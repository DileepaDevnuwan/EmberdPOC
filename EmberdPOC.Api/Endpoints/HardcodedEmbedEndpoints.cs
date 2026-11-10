using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using EmberdPOC.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EmberdPOC.Api.Endpoints;

/// <summary>
/// "Hardcoded" twin of the Dashboard embed API: same paths, verbs and response shapes as
/// /api/v1/embed/*, answered from JSON files in HardcodedData/ (captured once from the live API).
/// Writes are saved back to the files. Dashboard.Web is never called.
/// </summary>
public static class HardcodedEmbedEndpoints
{
    public const string Prefix = "/hardcoded/api/v1/embed";

    public static void MapHardcodedEmbedEndpoints(this WebApplication app)
    {
        var store = new HardcodedStore(Path.Combine(app.Environment.ContentRootPath, "HardcodedData"));

        var logPath = Path.Combine(app.Environment.ContentRootPath, "HardcodedData", "request-log.jsonl");
        var logLock = new object();

        app.Map(Prefix + "/{**path}", async (HttpContext ctx, string? path, AppDbContext db) =>
        {
            JsonNode? body = null;
            string? rawBody = null;
            if (ctx.Request.ContentLength > 0 || ctx.Request.Headers.TransferEncoding.Count > 0)
            {
                using var reader = new StreamReader(ctx.Request.Body, Encoding.UTF8);
                rawBody = await reader.ReadToEndAsync();
                try { body = JsonNode.Parse(rawBody); } catch (JsonException) { }
            }
            var user = await CurrentUserAsync(ctx, db);
            var result = store.Handle(ctx.Request.Method, (path ?? "").Trim('/'), ctx.Request.Query, body, user);
            await result.ExecuteAsync(ctx);

            // Request log: one JSON line per call, so manual clicks in the hosts can be traced.
            var line = new JsonObject
            {
                ["time"] = DateTimeOffset.UtcNow.ToString("o"),
                ["user"] = user.Id,
                ["method"] = ctx.Request.Method,
                ["path"] = "/" + (path ?? "").Trim('/'),
                ["query"] = ctx.Request.QueryString.Value,
                ["body"] = rawBody is null ? null : rawBody.Length > 4096 ? rawBody[..4096] + "...(truncated)" : rawBody,
                ["status"] = ctx.Response.StatusCode,
            }.ToJsonString();
            lock (logLock)
            {
                try { System.IO.File.AppendAllText(logPath, line + Environment.NewLine); } catch (IOException) { }
            }
            return Results.Empty;
        }).RequireAuthorization();

        // Export progress hub: exports finish at once in hardcoded mode, so the hub only accepts the connection.
        app.MapHub<HardcodedExportHub>(Prefix + "/dashboard/hubs/exports").RequireAuthorization();

        // Twin of /api/dashboard-hub/{moduleCode}: published GLOBAL + module dashboards from the store.
        app.MapGet("/hardcoded/api/dashboard-hub/{moduleCode}", (string moduleCode) =>
            Results.Content(store.Hub(moduleCode).ToJsonString(), "application/json")).RequireAuthorization();
    }

    /// <summary>The POC user as the Dashboard sees it: id = username, roles = the POC role names (read from the DB).</summary>
    private static async Task<EmbedUser> CurrentUserAsync(HttpContext ctx, AppDbContext db)
    {
        var name = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "poc-user";
        var roles = await db.Users.Where(u => u.Username == name)
            .SelectMany(u => u.UserRoles.Select(ur => ur.Role.Name)).ToArrayAsync();
        return new EmbedUser(name, roles);
    }
}

internal sealed record EmbedUser(string Id, string[] Roles);

internal sealed class HardcodedExportHub : Microsoft.AspNetCore.SignalR.Hub;

internal sealed class HardcodedStore
{
    private const int Published = 1;
    private const string Global = "GLOBAL";
    private static readonly JsonSerializerOptions Indented = new() { WriteIndented = true };

    private readonly string _dir;
    private readonly object _lock = new();
    private readonly Dictionary<string, JsonNode> _files = new();
    private EmbedUser _user = new("poc-user", []); // the caller of the current request (set under _lock)

    public HardcodedStore(string dir) => _dir = dir;

    // ---------- file access ----------
    private JsonNode File(string name, Func<JsonNode> empty)
    {
        if (_files.TryGetValue(name, out var node)) return node;
        var path = Path.Combine(_dir, name);
        node = System.IO.File.Exists(path) ? JsonNode.Parse(System.IO.File.ReadAllText(path)) ?? empty() : empty();
        _files[name] = node;
        return node;
    }
    private JsonArray Arr(string name) => File(name, () => new JsonArray()).AsArray();
    private JsonObject Obj(string name) => File(name, () => new JsonObject()).AsObject();
    private void Save(string name)
    {
        Directory.CreateDirectory(_dir);
        System.IO.File.WriteAllText(Path.Combine(_dir, name), _files[name].ToJsonString(Indented));
    }

    private JsonArray Dashboards => Arr("dashboards.json");
    private JsonArray Datasets => Arr("datasets.json");
    private JsonArray Filters => Arr("filters.json");
    private JsonArray Hierarchies => Arr("hierarchies.json");

    // ---------- helpers ----------
    private static IResult Json(JsonNode? node, int status = 200) =>
        Results.Content(node?.ToJsonString() ?? "null", "application/json", null, status);
    private static IResult Ok(bool value = true) => Json(JsonValue.Create(value));
    private static IResult NotFound() => Results.NotFound();
    private static string NewId() => Guid.NewGuid().ToString();
    private static string Now() => DateTimeOffset.UtcNow.ToString("o");
    private static string? Str(JsonNode? n, string key) => n?[key]?.GetValueKind() == JsonValueKind.String ? n[key]!.GetValue<string>() : n?[key]?.ToString();
    private static bool Eq(string? a, string? b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    private static JsonObject? ById(JsonArray arr, string id) =>
        arr.OfType<JsonObject>().FirstOrDefault(o => Eq(Str(o, "id"), id));
    private static JsonObject? DashById(JsonArray arr, string id) =>
        arr.OfType<JsonObject>().FirstOrDefault(o => Eq(Str(o["summary"], "id"), id));

    /// <summary>Copies the body's properties onto the target (the request uses the response's camelCase names).</summary>
    private static void Merge(JsonObject target, JsonNode? body, params string[] skip)
    {
        if (body is not JsonObject src) return;
        foreach (var (key, value) in src)
        {
            if (skip.Contains(key, StringComparer.OrdinalIgnoreCase)) continue;
            target[key] = value?.DeepClone();
        }
    }

    /// <summary>OData-ish paging: $top/$skip plus a text search taken from the quoted values in $filter.</summary>
    private static JsonObject Page(IEnumerable<JsonNode> items, IQueryCollection q, params string[] searchFields)
    {
        var list = items.ToList();
        var filter = q["$filter"].ToString();
        var terms = Regex.Matches(filter, "'([^']*)'").Select(m => m.Groups[1].Value.Replace("''", "'"))
            .Where(t => t.Length > 0).ToList();
        if (terms.Count > 0)
            list = list.Where(i => terms.Any(t => searchFields.Any(f =>
                (Str(i, f) ?? "").Contains(t, StringComparison.OrdinalIgnoreCase)))).ToList();
        var count = list.Count;
        if (int.TryParse(q["$skip"], out var skip) && skip > 0) list = list.Skip(skip).ToList();
        if (int.TryParse(q["$top"], out var top) && top > 0) list = list.Take(top).ToList();
        return new JsonObject { ["count"] = count, ["items"] = new JsonArray(list.Select(i => i.DeepClone()).ToArray()) };
    }

    // ---------- dashboards ----------
    // Live lists dashboards newest first.
    private static IEnumerable<JsonNode> Summaries(JsonArray dashboards) =>
        dashboards.OfType<JsonObject>().OrderByDescending(r => CreatedAt(r["summary"])).Select(Summary);

    private static DateTimeOffset CreatedAt(JsonNode? n) =>
        DateTimeOffset.TryParse(Str(n, "createdDate"), System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var d) ? d : DateTimeOffset.MinValue;

    private static JsonNode Summary(JsonObject record)
    {
        var s = record["summary"]!.DeepClone().AsObject();
        s["widgets"] = new JsonArray();
        s["widgetCount"] = record["detail"]?["widgets"]?.AsArray().Count ?? 0;
        return s;
    }

    /// <summary>The detail response: widgets mirrored into layout.dashboard, as the live API returns them.</summary>
    private JsonNode Detail(JsonObject record)
    {
        var d = record["detail"]!.DeepClone().AsObject();
        if (d["layout"] is JsonObject layout)
        {
            var dash = record["summary"]!.DeepClone().AsObject();
            dash["widgets"] = d["widgets"]?.DeepClone() ?? new JsonArray();
            dash["widgetCount"] = dash["widgets"]!.AsArray().Count;
            layout["dashboard"] = dash;
        }
        d["permissions"] = DashboardPermissions(record);
        return d;
    }

    /// <summary>
    /// The dashboard's permissions as the live API derives them: one row per Access-page grant (access.json) on this
    /// dashboard. Ids of rows captured from the live API are kept.
    /// </summary>
    private JsonArray DashboardPermissions(JsonObject record)
    {
        var dashboardId = Str(record["summary"], "id");
        var captured = record["detail"]?["permissions"] as JsonArray ?? [];
        var grantedBy = Str(Obj("capabilities.json"), "userId") ?? Str(record["summary"], "ownerId");
        var rows = new List<JsonNode>();
        foreach (var (key, value) in Obj("access.json").OrderBy(kv => kv.Key.Split('/').Last(), StringComparer.OrdinalIgnoreCase))
        {
            var parts = key.Split('/', 2);
            if (parts.Length < 2) continue;
            var type = Eq(parts[0], "User") ? 0 : 1;
            foreach (var g in (value?["dashboards"] as JsonArray ?? []).OfType<JsonObject>().Where(g => Eq(Str(g, "dashboardId"), dashboardId)))
            {
                var old = captured.OfType<JsonObject>().FirstOrDefault(p =>
                    Eq(Str(p, "principalId"), parts[1]) && p["principalType"]?.ToString() == type.ToString());
                rows.Add(new JsonObject
                {
                    ["id"] = Str(old, "id") ?? DeterministicId($"{dashboardId}/{key}"),
                    ["principalType"] = type,
                    ["principalId"] = parts[1],
                    ["grant"] = Str(g, "grant"),
                    ["grantedBy"] = Str(old, "grantedBy") ?? grantedBy,
                });
            }
        }
        return new JsonArray(rows.ToArray());
    }

    private static string DeterministicId(string seed) =>
        new Guid(System.Security.Cryptography.MD5.HashData(Encoding.UTF8.GetBytes(seed))).ToString();

    // ---------- assigned filters (resolved on read from the current filter definitions, as the live API does) ----------
    private JsonArray ResolvedAssignedFilters(string dashboardId)
    {
        var stored = Obj("assigned-filters.json")[dashboardId] as JsonArray ?? [];
        var rows = new List<JsonObject>();
        foreach (var item in stored.OfType<JsonObject>())
        {
            var filterId = Str(item, "filterDefinitionId") ?? Str(item, "filterId") ?? "";
            var f = ById(Filters, filterId);
            if (f is null) continue; // deleted filter: dropped, like the live query
            if (f["isActive"]?.GetValueKind() == JsonValueKind.False || f["status"]?.ToString() is { } st && st != "0") continue;
            var valueType = int.TryParse(Str(f, "valueType"), out var vt) ? vt : 0;
            rows.Add(new JsonObject
            {
                ["filterName"] = Str(f, "name"),
                ["displayName"] = Str(f, "displayName"),
                ["filterBehavior"] = string.IsNullOrWhiteSpace(Str(f, "filterBehavior")) ? valueType switch
                {
                    0 => "multiselect", 1 => "number_single", 2 => "dropdown", 4 => "dropdown", 3 => "daterange", _ => null,
                } : Str(f, "filterBehavior"),
                ["valueType"] = valueType,
                ["resolvedDefaultValue"] = ResolveDefault(f, valueType, Str(item, "defaultValueOverrideJson")),
                ["dropdownDatasetId"] = f["dropdownDatasetId"]?.DeepClone(),
                ["dropdownSqlQuery"] = f["dropdownSqlQuery"]?.DeepClone(),
                ["displayOrder"] = item["displayOrder"]?.DeepClone() ?? 0,
                ["renderMode"] = f["renderMode"]?.DeepClone(),
                ["quickPresetsJson"] = f["quickPresetsJson"]?.DeepClone(),
                ["defaultPreset"] = f["defaultPreset"]?.DeepClone(),
                ["filterId"] = filterId,
            });
        }
        return new JsonArray(rows.OrderBy(r => r["displayOrder"]?.GetValue<int>() ?? 0).Select(r => (JsonNode)r).ToArray());
    }

    private static JsonNode? ResolveDefault(JsonObject f, int valueType, string? overrideJson)
    {
        if (!string.IsNullOrWhiteSpace(overrideJson))
            try { return JsonNode.Parse(overrideJson); } catch (JsonException) { }
        return valueType switch
        {
            0 => f["defaultStringValue"]?.DeepClone(),
            1 => f["defaultNumberValue"]?.DeepClone(),
            2 => f["defaultBoolValue"]?.DeepClone(),
            4 => f["defaultBoolValue"]?.GetValueKind() == JsonValueKind.False ? null : f["defaultDropdownValue"]?.DeepClone(),
            3 => ResolvePeriod(f),
            _ => null,
        };
    }

    /// <summary>Port of Dashboard.Web's FilterPeriod.Resolve (dates as yyyy-MM-dd).</summary>
    private static JsonNode? ResolvePeriod(JsonObject f)
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var quarterStart = new DateTime(today.Year, (today.Month - 1) / 3 * 3 + 1, 1);
        DateTime StartOfWeek() => today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        (DateTime?, DateTime?) Relative(string? preset) => preset?.ToLowerInvariant() switch
        {
            "today" => (today, today),
            "yesterday" => (today.AddDays(-1), today.AddDays(-1)),
            "this_week" => (StartOfWeek(), StartOfWeek().AddDays(6)),
            "last_7_days" => (today.AddDays(-6), today),
            "last_30_days" => (today.AddDays(-29), today),
            "this_month" => (monthStart, monthStart.AddMonths(1).AddDays(-1)),
            "mtd" => (monthStart, today),
            "last_month" => (monthStart.AddMonths(-1), monthStart.AddDays(-1)),
            "last_3_months" => (today.AddMonths(-3).AddDays(1), today),
            "last_6_months" => (today.AddMonths(-6).AddDays(1), today),
            "last_12_months" => (today.AddMonths(-12).AddDays(1), today),
            "this_quarter" => (quarterStart, quarterStart.AddMonths(3).AddDays(-1)),
            "qtd" => (quarterStart, today),
            "last_quarter" => (quarterStart.AddMonths(-3), quarterStart.AddDays(-1)),
            "this_year" => (new DateTime(today.Year, 1, 1), new DateTime(today.Year, 12, 31)),
            "last_year" => (new DateTime(today.Year - 1, 1, 1), new DateTime(today.Year - 1, 12, 31)),
            "ytd" => (new DateTime(today.Year, 1, 1), today),
            _ => (null, null),
        };
        DateTime? Anchor(string? anchor, string? fixedDate) => anchor?.ToLowerInvariant() switch
        {
            null or "" or "fixed" => DateTime.TryParse(fixedDate, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var d) ? d.Date : null,
            "today" => today, "yesterday" => today.AddDays(-1), "start_of_week" => StartOfWeek(),
            "start_of_month" => monthStart, "start_of_last_month" => monthStart.AddMonths(-1), "end_of_last_month" => monthStart.AddDays(-1),
            "start_of_quarter" => quarterStart, "start_of_last_quarter" => quarterStart.AddMonths(-3), "end_of_last_quarter" => quarterStart.AddDays(-1),
            "start_of_year" => new DateTime(today.Year, 1, 1), "start_of_last_year" => new DateTime(today.Year - 1, 1, 1),
            "end_of_last_year" => new DateTime(today.Year - 1, 12, 31),
            _ => null,
        };
        (DateTime?, DateTime?) range = (int.TryParse(Str(f, "dateDefaultMode"), out var mode) ? mode : 0) switch
        {
            1 => (today, today),
            2 => Relative(Str(f, "dateRelativePreset")),
            3 => Offset(Str(f, "dateOffsetExpression")),
            4 => Ordered(Anchor(Str(f, "dateCustomFromAnchor"), Str(f, "dateCustomFrom")), Anchor(Str(f, "dateCustomToAnchor"), Str(f, "dateCustomTo"))),
            _ => (null, null),
        };
        (DateTime?, DateTime?) Offset(string? expr)
        {
            var m = Regex.Match(expr ?? "", @"^Add\(\s*(-?\d{1,4})\s*([dwmyDWMY])\s*\)$");
            if (!m.Success) return (null, null);
            var amount = int.Parse(m.Groups[1].Value);
            var edge = char.ToLowerInvariant(m.Groups[2].Value[0]) switch
            {
                'w' => today.AddDays(amount * 7), 'm' => today.AddMonths(amount), 'y' => today.AddYears(amount), _ => today.AddDays(amount),
            };
            return edge <= today ? (edge, today) : (today, edge);
        }
        static (DateTime?, DateTime?) Ordered(DateTime? a, DateTime? b) => a > b ? (b, a) : (a, b);
        if (range.Item1 is null && range.Item2 is null) return null;
        return new JsonObject
        {
            ["from"] = range.Item1?.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
            ["to"] = range.Item2?.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
        };
    }

    private static readonly string[] HeaderFields =
        ["code", "name", "description", "isShared", "isDefault", "moduleCode", "tags", "status", "isAutoSaveEnabled"];

    private static void ApplyHeader(JsonObject record, JsonNode? body)
    {
        if (body is not JsonObject src) return;
        foreach (var target in new[] { record["summary"]!.AsObject(), record["detail"]!.AsObject() })
        {
            foreach (var field in HeaderFields)
                if (src.ContainsKey(field)) target[field] = src[field]?.DeepClone();
            target["updatedDate"] = Now();
        }
    }

    private static void Bump(JsonObject record)
    {
        foreach (var target in new[] { record["summary"]!.AsObject(), record["detail"]!.AsObject() })
        {
            target["currentVersion"] = (target["currentVersion"]?.GetValue<int>() ?? 0) + 1;
            target["updatedDate"] = Now();
        }
    }

    public JsonNode Hub(string moduleCode)
    {
        lock (_lock) return HubItems(moduleCode);
    }

    private JsonArray HubItems(string? moduleCode) => new(Summaries(Dashboards)
        .Where(s => s["publishState"]?.GetValue<int>() == Published)
        .Where(s =>
        {
            var m = Str(s, "moduleCode");
            return string.IsNullOrEmpty(m) || Eq(m, Global) || Eq(m, moduleCode);
        }).ToArray());

    private JsonObject NewDashboard(JsonNode? body)
    {
        var id = NewId();
        var template = Dashboards.OfType<JsonObject>().FirstOrDefault();
        var summary = template?["summary"]?.DeepClone().AsObject() ?? new JsonObject();
        var detail = template?["detail"]?.DeepClone().AsObject() ?? new JsonObject();
        foreach (var o in new[] { summary, detail })
        {
            o["id"] = id;
            o["publishState"] = 0;
            o["currentVersion"] = 1;
            o["publishedVersion"] = null;
            o["parentDashboardId"] = null;
            o["createdDate"] = Now();
            o["updatedDate"] = Now();
            o["description"] = null;
            o["tags"] = null;
            o["isDefault"] = false;
        }
        summary["childDashboards"] = new JsonArray();
        summary["assignedFilters"] = new JsonArray();
        summary["permissions"] = new JsonArray();
        summary["code"] = summary["name"] = summary["moduleCode"] = null;
        summary["status"] = 0;
        summary["isShared"] = false;
        summary["isAutoSaveEnabled"] = false;
        detail["widgets"] = new JsonArray();
        detail["permissions"] = new JsonArray();
        detail["isChild"] = false;
        detail["code"] = detail["name"] = detail["moduleCode"] = null;
        detail["status"] = 0;
        detail["isShared"] = false;
        // A new dashboard has no layout until the builder's first layout save (version 0 -> 1), as in the live API.
        detail["layout"] = null;
        var record = new JsonObject { ["summary"] = summary, ["detail"] = detail };
        ApplyHeader(record, body);
        return record;
    }

    private static JsonObject ToWidget(JsonNode? request, string id, string dashboardId, JsonObject? existing)
    {
        var w = existing ?? new JsonObject
        {
            ["allowCommonFilter"] = true, ["allowMultiAxis"] = false, ["allowedPivotHierarchies"] = null,
            ["dimensionField"] = null, ["displayOrder"] = 0, ["drillConfigs"] = new JsonArray(),
            ["drillDownEnabled"] = false, ["hierarchyId"] = null, ["metricId"] = null, ["queryId"] = null,
            ["refreshIntervalSeconds"] = null, ["widgetMode"] = 0, ["widgetConfigJson"] = "{}", ["widgetFormatJson"] = "{}",
        };
        Merge(w, request, "widgetId", "dashboardId");
        w["id"] = id;
        w["dashboardId"] = dashboardId;
        return w;
    }

    private (JsonObject Record, JsonObject Widget)? FindWidget(string widgetId)
    {
        foreach (var record in Dashboards.OfType<JsonObject>())
        {
            var w = record["detail"]?["widgets"]?.AsArray().OfType<JsonObject>().FirstOrDefault(x => Eq(Str(x, "id"), widgetId));
            if (w is not null) return (record, w);
        }
        return null;
    }

    /// <summary>The widget's captured data; else data captured for a widget of the same chart type; else any.</summary>
    private JsonNode WidgetData(string widgetId)
    {
        var fixtures = Obj("widget-data.json");
        if (fixtures[widgetId] is { } own) return own.DeepClone();
        var template = FindWidget(widgetId) is { } found ? Str(found.Widget, "chartTemplateCode") : null;
        if (template is not null)
        {
            foreach (var record in Dashboards.OfType<JsonObject>())
                foreach (var w in record["detail"]?["widgets"]?.AsArray().OfType<JsonObject>() ?? [])
                    if (Eq(Str(w, "chartTemplateCode"), template) && fixtures[Str(w, "id")!] is { } same)
                        return same.DeepClone();
            // Same chart family (BAR_VERTICAL ~ BAR_HORIZONTAL, ...).
            var family = template.Split('_')[0];
            foreach (var record in Dashboards.OfType<JsonObject>())
                foreach (var w in record["detail"]?["widgets"]?.AsArray().OfType<JsonObject>() ?? [])
                    if ((Str(w, "chartTemplateCode") ?? "").StartsWith(family, StringComparison.OrdinalIgnoreCase)
                        && fixtures[Str(w, "id")!] is { } similar)
                        return similar.DeepClone();
        }
        // Generic: the richest captured response (most rows).
        return fixtures.Select(kv => kv.Value).Where(v => v is not null)
            .OrderByDescending(v => v!["rawRows"]?.AsArray().Count ?? 0).FirstOrDefault()?.DeepClone()
            ?? new JsonObject();
    }

    // ---------- generic collections (datasets / filters / hierarchies / data sources) ----------
    /// <summary>
    /// The shape of a new row: the keys of an existing row with empty values (null, false, 0, []), so nothing of that
    /// row leaks into the new one when the request leaves a field out (JSON.stringify drops undefined fields).
    /// </summary>
    private static JsonObject Blank(JsonArray arr)
    {
        var item = new JsonObject();
        if (arr.OfType<JsonObject>().FirstOrDefault() is not { } template) return item;
        foreach (var (key, value) in template)
            item[key] = value?.GetValueKind() switch
            {
                JsonValueKind.Array => new JsonArray(),
                JsonValueKind.True or JsonValueKind.False => false,
                JsonValueKind.Number => 0,
                _ => null,
            };
        if (item.ContainsKey("isActive")) item["isActive"] = true;
        if (item.ContainsKey("isSourceRecord")) item["isSourceRecord"] = true;
        return item;
    }

    private IResult Create(string file, JsonNode? body, Action<JsonObject>? after = null)
    {
        var arr = Arr(file);
        var item = Blank(arr);
        Merge(item, body, "id");
        var id = NewId();
        item["id"] = id;
        item["createdDate"] = Now();
        item["updatedDate"] = Now();
        item["createdBy"] = Str(Obj("capabilities.json"), "userId");
        item["updatedBy"] = Str(Obj("capabilities.json"), "userId");
        after?.Invoke(item);
        arr.Add(item);
        Save(file);
        return Json(JsonValue.Create(id), 201);
    }

    /// <summary>Update as the live handlers do: every field of the update DTO is set from the body (left out = null).</summary>
    private IResult Update(string file, string id, JsonNode? body, string[] dtoFields, Action<JsonObject>? after = null)
    {
        var item = ById(Arr(file), id);
        if (item is null) return NotFound();
        Merge(item, body, "id");
        if (body is JsonObject src)
            foreach (var f in dtoFields.Where(f => !src.ContainsKey(f))) item[f] = null;
        item["updatedDate"] = Now();
        after?.Invoke(item);
        Save(file);
        return Json(JsonValue.Create(id)); // live: the id
    }

    private IResult Delete(string file, string id)
    {
        var arr = Arr(file);
        var item = ById(arr, id);
        if (item is null) return NotFound();
        arr.Remove(item);
        Save(file);
        return Ok();
    }

    private IResult Misc(string method, string path, IQueryCollection q)
    {
        var misc = Obj("misc.json");
        var withQuery = $"{method} /{path}{(q.Count > 0 ? "?" + string.Join("&", q.Select(kv => $"{kv.Key}={kv.Value}")) : "")}";
        if (misc[withQuery] is { } exact) return Json(exact);
        if (misc[$"{method} /{path}"] is { } plain) return Json(plain);
        return NotFound();
    }

    // ---------- dataset access (same rule as Dashboard.Web for an external user) ----------
    private static IResult Forbidden(string detail) => Results.Problem(detail, statusCode: 403, title: "Forbidden");

    /// <summary>
    /// Grants matching the caller = dataset grants of User/{id} or Role/{role}. The creator or a Manage grant sees every
    /// column; otherwise a column is hidden only when every matching grant hides it. No grant (and not creator) = no access.
    /// Seeded datasets (no createdByUser) belong to the POC admin.
    /// </summary>
    private (bool Allowed, HashSet<string> Hidden) DatasetAccess(JsonObject dataset)
    {
        var none = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var creator = dataset["createdByUser"] is { } by ? Eq(by.ToString(), _user.Id) : Eq(_user.Id, "admin");
        var principals = new HashSet<string>(_user.Roles.Select(r => $"Role/{r}").Append($"User/{_user.Id}"), StringComparer.OrdinalIgnoreCase);
        var datasetId = Str(dataset, "id");
        var grants = Obj("access.json")
            .Where(kv => principals.Contains(kv.Key))
            .SelectMany(kv => kv.Value?["datasets"] as JsonArray ?? [])
            .OfType<JsonObject>()
            .Where(g => Eq(Str(g, "datasetDefinitionId"), datasetId))
            .ToList();
        static bool IsManage(JsonObject g) => Str(g, "level") is "1" || Eq(Str(g, "level"), "Manage");
        if (creator || grants.Any(IsManage)) return (true, none);
        if (grants.Count == 0) return (false, none);
        HashSet<string>? hidden = null;
        foreach (var g in grants)
        {
            var cols = new HashSet<string>((g["hiddenColumns"] as JsonArray ?? []).Select(c => c?.ToString() ?? ""), StringComparer.OrdinalIgnoreCase);
            if (hidden is null) hidden = cols; else hidden.IntersectWith(cols);
        }
        return (true, hidden ?? none);
    }

    /// <summary>403 when the widget's dataset is not visible to the caller or its config reads a hidden column.</summary>
    private IResult? WidgetDenial(string widgetId)
    {
        if (FindWidget(widgetId) is not { } found) return null;
        var widget = found.Widget;
        JsonNode? config = null;
        try { config = JsonNode.Parse(Str(widget, "widgetConfigJson") ?? "{}"); } catch (JsonException) { }
        var datasetId = Str(widget, "datasetDefinitionId") ?? Str(config, "datasetId");
        if (datasetId is null || ById(Datasets, datasetId) is not { } dataset) return null;
        var (allowed, hidden) = DatasetAccess(dataset);
        if (!allowed) return Forbidden("You do not have access to this widget's dataset.");
        var col = StringsIn(config).FirstOrDefault(hidden.Contains);
        return col is null ? null : Forbidden($"This widget reads a column you may not see: {col}");
    }

    private static IEnumerable<string> StringsIn(JsonNode? node) => node switch
    {
        JsonObject o => o.SelectMany(kv => StringsIn(kv.Value)),
        JsonArray a => a.SelectMany(StringsIn),
        JsonValue v when v.GetValueKind() == JsonValueKind.String => [v.GetValue<string>()],
        _ => [],
    };

    // ---------- exports (the host's own export logic: a job that completes at once, file built from the captured data) ----------
    private const int ExportCompleted = 2;
    private static readonly string[] ExportInternal = ["userId", "file", "contentType"];
    private JsonArray Exports => Arr("exports.json");
    private string ExportDir => Path.Combine(_dir, "export-files");

    private static JsonNode PublicJob(JsonObject job)
    {
        var o = job.DeepClone().AsObject();
        foreach (var k in ExportInternal) o.Remove(k);
        return o;
    }

    private IResult CreateExport(JsonObject record, JsonNode? body)
    {
        var dashboardId = Str(record["summary"], "id")!;
        var dashboardName = Str(record["summary"], "name") ?? "Dashboard";
        var format = int.TryParse(Str(body, "format"), out var f) ? f
            : Str(body, "format")?.ToLowerInvariant() switch { "pdf" => 1, "png" => 2, _ => 0 };
        var wanted = (body?["widgetIds"] as JsonArray)?.Select(x => x?.ToString() ?? "").ToHashSet(StringComparer.OrdinalIgnoreCase);
        var fullDashboard = body?["fullDashboard"]?.GetValueKind() == JsonValueKind.True || wanted is null || wanted.Count == 0;
        var widgets = (record["detail"]?["widgets"] as JsonArray ?? []).OfType<JsonObject>()
            .Where(w => fullDashboard || wanted!.Contains(Str(w, "id") ?? "")).ToList();

        byte[] content;
        string ext, contentType;
        var image = (body?["widgetImages"] as JsonArray ?? []).Select(i => Str(i, "imageBase64")).FirstOrDefault(s => !string.IsNullOrEmpty(s));
        if (format is 1 or 2 && image is not null)
        {
            var comma = image.IndexOf(',');
            content = Convert.FromBase64String(image.StartsWith("data:") && comma > 0 ? image[(comma + 1)..] : image);
            (ext, contentType) = ("png", "image/png");
        }
        else
        {
            content = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(Csv(dashboardName, widgets))).ToArray();
            (ext, contentType) = ("csv", "text/csv");
        }

        var id = NewId();
        var safeName = Regex.Replace(dashboardName, @"[^\w\-]+", "_");
        var fileName = $"{safeName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.{ext}";
        Directory.CreateDirectory(ExportDir);
        System.IO.File.WriteAllBytes(Path.Combine(ExportDir, $"{id}.{ext}"), content);

        var now = DateTimeOffset.UtcNow;
        var job = new JsonObject
        {
            ["id"] = id, ["dashboardId"] = dashboardId, ["dashboardName"] = dashboardName,
            ["format"] = format, ["status"] = ExportCompleted,
            ["progressCurrent"] = widgets.Count, ["progressTotal"] = widgets.Count, ["progressMessage"] = "Completed",
            ["fileName"] = fileName, ["fileSizeBytes"] = content.LongLength,
            ["requestedAt"] = now.ToString("o"), ["completedAt"] = now.ToString("o"), ["expiresAt"] = now.AddDays(1).ToString("o"),
            ["isTruncated"] = false, ["truncations"] = new JsonArray(), ["errorMessage"] = null,
            ["userId"] = _user.Id, ["file"] = $"{id}.{ext}", ["contentType"] = contentType,
        };
        Exports.Add(job);
        Save("exports.json");
        return Json(PublicJob(job), 202);
    }

    /// <summary>One CSV section per widget from its captured data (rawRows, else labels/values); widgets the caller may not read are skipped.</summary>
    private string Csv(string dashboardName, List<JsonObject> widgets)
    {
        static string Cell(JsonNode? v)
        {
            var s = v?.GetValueKind() == JsonValueKind.String ? v.GetValue<string>() : v?.ToJsonString() ?? "";
            return s.IndexOfAny([',', '"', '\n', '\r']) >= 0 ? $"\"{s.Replace("\"", "\"\"")}\"" : s;
        }
        var sb = new StringBuilder();
        sb.AppendLine(Cell(JsonValue.Create(dashboardName)));
        foreach (var w in widgets)
        {
            var id = Str(w, "id")!;
            sb.AppendLine().AppendLine(Cell(JsonValue.Create(Str(w, "title") ?? id)));
            if (WidgetDenial(id) is not null) { sb.AppendLine("(not exported: you may not see a column this widget reads)"); continue; }
            var data = WidgetData(id);
            if (data["rawRows"] is JsonArray rows && rows.Count > 0)
            {
                var cols = rows.OfType<JsonObject>().SelectMany(r => r.Select(kv => kv.Key)).Distinct().ToList();
                sb.AppendLine(string.Join(",", cols.Select(c => Cell(JsonValue.Create(c)))));
                foreach (var r in rows.OfType<JsonObject>())
                    sb.AppendLine(string.Join(",", cols.Select(c => Cell(r[c]))));
                continue;
            }
            var payload = new[] { "xyPayload", "slicePayload", "seriesPayload" }.Select(k => data[k]).FirstOrDefault(x => x?["labels"] is JsonArray);
            if (payload is not null)
            {
                var labels = payload["labels"]!.AsArray();
                var values = payload["values"] as JsonArray ?? [];
                sb.AppendLine("Label,Value");
                for (var i = 0; i < labels.Count; i++)
                    sb.AppendLine($"{Cell(labels[i])},{Cell(i < values.Count ? values[i] : null)}");
                continue;
            }
            sb.AppendLine("(no data)");
        }
        return sb.ToString();
    }

    private IResult? HandleExports(string method, string[] s)
    {
        // s = dashboard, exports[, jobId[, download]]
        if (method != "GET") return null;
        var mine = Exports.OfType<JsonObject>().Where(j => Eq(Str(j, "userId"), _user.Id)).ToList();
        if (s.Length == 2)
            return Json(new JsonArray(mine.OrderByDescending(j => Str(j, "requestedAt")).Select(PublicJob).ToArray()));
        var job = mine.FirstOrDefault(j => Eq(Str(j, "id"), s[2]));
        if (job is null) return NotFound();
        if (s.Length == 3) return Json(PublicJob(job));
        if (s.Length == 4 && s[3] == "download")
        {
            var path = Path.Combine(ExportDir, Str(job, "file") ?? "");
            if (!System.IO.File.Exists(path)) return NotFound();
            return Results.File(System.IO.File.ReadAllBytes(path), Str(job, "contentType") ?? "application/octet-stream", Str(job, "fileName"));
        }
        return null;
    }

    // ---------- dispatcher ----------
    public IResult Handle(string method, string path, IQueryCollection q, JsonNode? body, EmbedUser user)
    {
        lock (_lock)
        {
            _user = user;
            var s = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var p = s.Length;
            string At(int i) => i < p ? s[i] : "";
            method = method.ToUpperInvariant();

            switch (At(0))
            {
                case "config": return Json(Obj("config.json"));
                case "modules" when method == "GET": return Json(File("modules.json", () => new JsonArray()));
                case "modules" when method == "PUT":
                    _files["modules.json"] = body?.DeepClone() ?? new JsonArray();
                    Save("modules.json");
                    return Ok();
                case "me": return Json(Obj("capabilities.json"));
                case "dashboard": return HandleDashboard(method, s, q, body) ?? Misc(method, path, q);
                case "dashboard-datasets": return HandleDatasets(method, s, q, body) ?? Misc(method, path, q);
                case "dashboard-filters": return HandleFilters(method, s, q, body) ?? Misc(method, path, q);
                case "dashboard-access": return HandleAccess(method, s, body) ?? Misc(method, path, q);
                case "data-sources": return HandleDataSources(method, s, body) ?? Misc(method, path, q);
            }
            if (method == "GET") return Misc(method, path, q);
            return Ok();
        }
    }

    private IResult? HandleDashboard(string method, string[] s, IQueryCollection q, JsonNode? body)
    {
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";

        if (At(1) == "semantic") return HandleHierarchies(method, s, q, body);
        if (At(1) == "widgets") return HandleWidgets(method, s, body);
        if (At(1) == "exports") return HandleExports(method, s);

        if (method == "GET")
        {
            if (p == 1) // published, optional module
            {
                var module = q["moduleCode"].ToString();
                return Json(Page(Summaries(Dashboards).Where(x => x["publishState"]?.GetValue<int>() == Published
                    && (module.Length == 0 || Eq(Str(x, "moduleCode"), module))), q, "code", "name"));
            }
            switch (At(1))
            {
                case "all": return Json(Page(Summaries(Dashboards), q, "code", "name"));
                case "hub": return Json(Page(HubItems(q["moduleCode"]), q, "code", "name"));
                case "active": return Json(new JsonArray(Summaries(Dashboards).ToArray()));
                case "charttemplates": return Json(File("chart-templates.json", () => new JsonArray()));
                case "exports": return Json(new JsonArray());
                case "validator" when At(2) == "name":
                    var name = Uri.UnescapeDataString(At(3));
                    var exclude = q["excludeId"].ToString();
                    return Ok(Summaries(Dashboards).Any(x => Eq(Str(x, "name"), name) && !Eq(Str(x, "id"), exclude)));
            }
            var record = DashById(Dashboards, At(1));
            if (record is null) return null;
            return At(2) switch
            {
                "" => Json(Detail(record)),
                "assigned-filters" => Json(ResolvedAssignedFilters(At(1))),
                "versions" => Json(record["versions"]?.DeepClone() ?? new JsonArray()),
                "permissions" => Json(DashboardPermissions(record)),
                _ => null,
            };
        }

        if (method == "POST")
        {
            if (p == 1)
            {
                var record = NewDashboard(body);
                Dashboards.Add(record);
                Save("dashboards.json");
                return Json(record["summary"]!["id"]!.DeepClone(), 201);
            }
            if (At(1) == "child")
            {
                var source = DashById(Dashboards, Str(body, "parentDashboardId") ?? "");
                if (source is null) return NotFound();
                var clone = NewDashboard(source["summary"]);
                ApplyHeader(clone, body);
                var cloneId = Str(clone["summary"], "id")!;
                foreach (var o in new[] { clone["summary"]!.AsObject(), clone["detail"]!.AsObject() })
                    o["parentDashboardId"] = Str(source["summary"], "id");
                clone["detail"]!["isChild"] = true;
                var fixtures = Obj("widget-data.json");
                var widgets = new JsonArray();
                var layoutData = Str(source["detail"]?["layout"], "layoutData") ?? "[]";
                foreach (var w in source["detail"]?["widgets"]?.AsArray().OfType<JsonObject>() ?? [])
                {
                    var oldId = Str(w, "id")!;
                    var newId = NewId();
                    var copy = w.DeepClone().AsObject();
                    copy["id"] = newId;
                    copy["dashboardId"] = cloneId;
                    widgets.Add(copy);
                    if (fixtures[oldId] is { } data) fixtures[newId] = data.DeepClone();
                    layoutData = layoutData.Replace(oldId, newId, StringComparison.OrdinalIgnoreCase);
                }
                clone["detail"]!["widgets"] = widgets;
                if (source["detail"]?["layout"] is JsonObject sourceLayout)
                {
                    var layout = sourceLayout.DeepClone().AsObject();
                    layout.Remove("dashboard");
                    layout["id"] = NewId();
                    layout["dashboardId"] = cloneId;
                    layout["layoutData"] = layoutData;
                    layout["version"] = 1;
                    clone["detail"]!["layout"] = layout;
                }
                Dashboards.Add(clone);
                var assigned = Obj("assigned-filters.json");
                if (assigned[Str(source["summary"], "id")!] is { } filters) assigned[cloneId] = filters.DeepClone();
                Save("dashboards.json");
                Save("widget-data.json");
                Save("assigned-filters.json");
                return Json(JsonValue.Create(cloneId), 201);
            }
            var target = DashById(Dashboards, At(1));
            if (target is null) return null;
            switch (At(2))
            {
                case "publish":
                {
                    foreach (var o in new[] { target["summary"]!.AsObject(), target["detail"]!.AsObject() })
                    {
                        o["publishState"] = Published;
                        o["publishedVersion"] = o["currentVersion"]?.DeepClone();
                        o["updatedDate"] = Now();
                    }
                    // Version history (GET {id}/versions): the published version, newest first.
                    var versionId = NewId();
                    var number = target["summary"]?["currentVersion"]?.GetValue<int>() ?? 1;
                    var versions = target["versions"] as JsonArray ?? new JsonArray();
                    foreach (var v in versions.OfType<JsonObject>()) v["isCurrentPublished"] = false;
                    versions.Insert(0, new JsonObject
                    {
                        ["id"] = versionId, ["versionNumber"] = number, ["changeNote"] = Str(body, "changeNote") ?? "Published",
                        ["state"] = "Published", ["createdByName"] = Str(Obj("capabilities.json"), "userId"),
                        ["createdAt"] = DateTime.UtcNow.ToString("o"), ["isCurrentPublished"] = true,
                    });
                    target["versions"] = versions;
                    Save("dashboards.json");
                    return Json(new JsonObject { ["versionNumber"] = number, ["versionId"] = versionId });
                }
                case "exports":
                    return CreateExport(target, body);
            }
            return Ok();
        }

        if (method == "PUT")
        {
            var record = DashById(Dashboards, At(1));
            if (record is null) return NotFound();
            switch (At(2))
            {
                case "":
                    ApplyHeader(record, body);
                    Bump(record);
                    Save("dashboards.json");
                    return Json(new JsonObject()); // live: 200 {}
                case "layout":
                {
                    // Optimistic concurrency as in the live SaveLayout handler: the request names the version it read.
                    var current = record["detail"]!["layout"] as JsonObject;
                    var expected = int.TryParse(Str(body, "version"), out var v) ? v : 0;
                    var found = current?["version"]?.GetValue<int>() ?? 0;
                    if (expected != found)
                        return Results.Problem($"Layout version conflict: expected {expected} but found {found}. Please refresh and try again.",
                            statusCode: 409, title: "ConflictException");
                    var layout = current ?? new JsonObject
                    {
                        ["dashboardId"] = At(1), ["layoutData"] = "[]", ["gridColumns"] = 12, ["rowHeightPx"] = 96, ["version"] = 0,
                        ["id"] = NewId(), ["createdDate"] = Now(),
                    };
                    layout["layoutData"] = Str(body, "layoutData") ?? "[]";
                    if (body?["gridColumns"] is { } cols) layout["gridColumns"] = cols.DeepClone();
                    if (body?["rowHeightPx"] is { } rh) layout["rowHeightPx"] = rh.DeepClone();
                    layout["version"] = found + 1;
                    layout["updatedDate"] = Now();
                    record["detail"]!["layout"] = layout;
                    Save("dashboards.json");
                    return Json(new JsonObject());
                }
                case "assigned-filters":
                    // Stored as the request rows; GET resolves them from the current filter definitions.
                    Obj("assigned-filters.json")[At(1)] = new JsonArray((body as JsonArray ?? []).OfType<JsonObject>().Select(f => (JsonNode)new JsonObject
                    {
                        ["filterDefinitionId"] = Str(f, "filterDefinitionId") ?? Str(f, "filterId"),
                        ["displayOrder"] = f["displayOrder"]?.DeepClone() ?? 0,
                        ["defaultValueOverrideJson"] = f["defaultValueOverrideJson"]?.DeepClone(),
                    }).ToArray());
                    Save("assigned-filters.json");
                    return Ok();
                case "save":
                    ApplyHeader(record, body);
                    Bump(record);
                    Save("dashboards.json");
                    return Ok();
            }
            return NotFound();
        }

        if (method == "DELETE" && p == 2)
        {
            var record = DashById(Dashboards, At(1));
            if (record is null) return NotFound();
            Dashboards.Remove(record);
            // A child keeps living on its own; the parent's child list loses it.
            foreach (var other in Dashboards.OfType<JsonObject>())
                if (other["summary"]?["childDashboards"] is JsonArray kids)
                    foreach (var k in kids.Where(k => Eq(Str(k, "id"), At(1))).ToList()) kids.Remove(k);
            Obj("assigned-filters.json").Remove(At(1));
            Save("dashboards.json");
            Save("assigned-filters.json");
            return Json(new JsonObject { ["isDeleted"] = true });
        }
        return Ok();
    }

    private IResult? HandleWidgets(string method, string[] s, JsonNode? body)
    {
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";
        if (method == "POST" && p == 2)
        {
            var request = body?["widget"] ?? body;
            var record = DashById(Dashboards, Str(request, "dashboardId") ?? "");
            if (record is null) return Results.Problem("Dashboard not found.", statusCode: 404);
            var id = NewId();
            var widgets = record["detail"]!["widgets"] as JsonArray ?? new JsonArray();
            widgets.Add(ToWidget(request, id, Str(record["summary"], "id")!, null));
            record["detail"]!["widgets"] = widgets;
            Bump(record);
            Save("dashboards.json");
            return Json(JsonValue.Create(id), 201);
        }
        if (p < 3 && method != "POST") return null;
        var widgetId = At(2);
        if (method == "POST")
            return At(3) switch
            {
                "data" or "drilldown" or "crossdrilldown" => WidgetDenial(widgetId) ?? Json(WidgetData(widgetId)),
                _ => Ok(),
            };
        if (method == "GET")
            return null; // drillable-fields / field-map: captured in misc.json
        var found = FindWidget(widgetId);
        if (found is null) return NotFound();
        var (rec, widget) = found.Value;
        if (method == "PUT")
        {
            ToWidget(body?["widget"] ?? body, widgetId, Str(rec["summary"], "id")!, widget);
            Bump(rec);
            Save("dashboards.json");
            return Json(JsonValue.Create(widgetId)); // live: the widget id
        }
        if (method == "DELETE")
        {
            rec["detail"]!["widgets"]!.AsArray().Remove(widget);
            Bump(rec);
            Save("dashboards.json");
            return Json(new JsonObject { ["isDeleted"] = true });
        }
        return Ok();
    }

    // ---------- datasets: the save DTO mapped to the stored detail shape (SaveDatasetDefinitionCommand) ----------
    private static readonly string[] DatasetHeader =
        ["code", "name", "description", "moduleScope", "dataSourceType", "sourceDatasetId", "connectionString", "sqlQuery",
         "status", "dbProvider", "dataSourceId", "queryDesignJson"];

    private static int DataTypeOf(string? t) => t switch
    {
        "Number" => 1, "Boolean" => 2, "DateTime" => 3, "Date" => 4, "JSON" => 5,
        _ => int.TryParse(t, out var n) ? n : 0,
    };

    private static int UsageTypeOf(string? t) => t switch
    {
        "Metric" => 0, "Both" => 2, "Dimension" => 1,
        _ => int.TryParse(t, out var n) ? n : 1,
    };

    private IResult SaveDataset(JsonNode? body, bool isPut)
    {
        const string file = "datasets.json";
        var id = Str(body, "id");
        var isNew = string.IsNullOrEmpty(id) || id == Guid.Empty.ToString();
        JsonObject? entity = isNew ? null : ById(Datasets, id!);
        if (!isNew && entity is null) return Results.Problem($"DatasetDefinition with ID {id} not found.", statusCode: 404);
        if (entity is null)
        {
            id = NewId();
            entity = new JsonObject { ["id"] = id, ["isActive"] = true, ["fields"] = new JsonArray(), ["parameters"] = new JsonArray(),
                ["createdDate"] = Now(), ["createdBy"] = Str(Obj("capabilities.json"), "userId"), ["createdByUser"] = _user.Id };
            Datasets.Add(entity);
        }
        else entity["isActive"] = body?["isActive"]?.GetValueKind() != JsonValueKind.False;
        foreach (var f in DatasetHeader) entity[f] = body?[f]?.DeepClone();
        if (Str(body, "dataSourceId") is { Length: > 0 }) { entity["connectionString"] = null; entity["dbProvider"] = null; }
        entity["updatedDate"] = Now();
        entity["updatedBy"] = Str(Obj("capabilities.json"), "userId");

        var existing = (entity["fields"] as JsonArray ?? []).OfType<JsonObject>().ToList();
        var fields = new JsonArray();
        foreach (var f in (body?["fields"] as JsonArray ?? []).OfType<JsonObject>())
        {
            var fid = Str(f, "id");
            var old = existing.FirstOrDefault(e => !string.IsNullOrEmpty(fid) && Eq(Str(e, "id"), fid));
            var row = old?.DeepClone().AsObject() ?? new JsonObject
            {
                ["id"] = NewId(), ["description"] = null, ["isCommonFilter"] = false, ["commonFilterName"] = null,
                ["filterBehavior"] = null, ["dropdownDatasetId"] = null, ["dropdownSqlQuery"] = null,
            };
            row["datasetDefinitionId"] = id;
            row["fieldName"] = Str(f, "fieldName");
            row["displayName"] = Str(f, "displayName");
            row["dataType"] = DataTypeOf(Str(f, "dataType"));
            row["usageType"] = UsageTypeOf(Str(f, "usageType"));
            row["allowForXAxis"] = f["xAxis"]?.GetValueKind() == JsonValueKind.True;
            row["allowForYAxis"] = f["yAxis"]?.GetValueKind() == JsonValueKind.True;
            row["allowForZAxis"] = f["zAxis"]?.GetValueKind() == JsonValueKind.True;
            row["allowedOperatorsJson"] = (f["allowedOperators"] as JsonArray ?? new JsonArray()).ToJsonString();
            fields.Add(row);
        }
        entity["fields"] = fields;
        entity["fieldsCount"] = fields.Count;
        Save(file);
        return Json(JsonValue.Create(id));
    }

    private IResult? HandleDatasets(string method, string[] s, IQueryCollection q, JsonNode? body)
    {
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";
        const string file = "datasets.json";
        switch (method)
        {
            case "GET" when p == 1:
                // Live: newest first; list rows carry empty fields/parameters and a fieldsCount.
                return Json(Page(Datasets.OfType<JsonObject>()
                    .OrderByDescending(x => Str(x, "createdDate"), StringComparer.Ordinal)
                    .Select(x =>
                    {
                        var row = x.DeepClone().AsObject();
                        row["fieldsCount"] = (x["fields"] as JsonArray)?.Count ?? row["fieldsCount"]?.GetValue<int>() ?? 0;
                        row.Remove("createdByUser");
                        row["fields"] = new JsonArray();
                        row["parameters"] = new JsonArray();
                        return (JsonNode)row;
                    }), q, "code", "name"));
            case "GET" when p == 2:
            {
                if (ById(Datasets, At(1)) is not { } d) return NotFound();
                var (allowed, hidden) = DatasetAccess(d);
                if (!allowed) return Forbidden("You do not have access to this dataset.");
                var visible = d.DeepClone().AsObject();
                visible.Remove("createdByUser");
                visible.Remove("fieldsCount");
                if (hidden.Count > 0 && visible["fields"] is JsonArray fields)
                {
                    foreach (var f in fields.OfType<JsonObject>().Where(f => hidden.Contains(Str(f, "fieldName") ?? "")).ToList())
                        fields.Remove(f);
                    visible["fieldsCount"] = fields.Count;
                }
                return Json(visible);
            }
            case "POST" when p == 1:
                return Create(file, body, item =>
                {
                    item["createdByUser"] = _user.Id;
                    item["isActive"] = true;
                    item["fields"] = new JsonArray();
                    item["parameters"] = new JsonArray();
                });
            case "POST" or "PUT" when At(1) == "save":
                return SaveDataset(body, method == "PUT");
            case "PUT" when p == 2: return Update(file, At(1), body, [.. DatasetHeader, "isActive"]);
            case "DELETE" when p == 2: return Delete(file, At(1));
            case "PUT" when At(2) == "access": return Ok();
        }
        return null;
    }

    private static readonly string[] FilterDtoFields =
        ["code", "name", "displayName", "description", "moduleScope", "valueType", "filterBehavior", "defaultStringValue",
         "defaultNumberValue", "defaultBoolValue", "defaultDropdownValue", "dropdownDatasetId", "dropdownSqlQuery", "dateDefaultMode",
         "dateRelativePreset", "dateOffsetExpression", "dateCustomFrom", "dateCustomTo", "renderMode", "quickPresetsJson",
         "defaultPreset", "dateCustomFromAnchor", "dateCustomToAnchor", "dropdownValueField", "dropdownLabelField", "status"];

    /// <summary>Live EnsureDropdownFieldsAsync: value/label fields only for a Dropdown filter on a dataset; enums default to 0.</summary>
    private static void NormalizeFilter(JsonObject f)
    {
        foreach (var k in new[] { "valueType", "dateDefaultMode", "status" }) f[k] ??= 0;
        if (Str(f, "valueType") != "4" || string.IsNullOrEmpty(Str(f, "dropdownDatasetId")))
        {
            f["dropdownValueField"] = null;
            f["dropdownLabelField"] = null;
        }
    }

    /// <summary>
    /// A dropdown filter's options: those captured for it, else the distinct values of its value field in the captured widget
    /// rows / options of a filter on the same dataset and field, paged with skip/take (+ search).
    /// </summary>
    private JsonObject FilterOptions(string filterId, IQueryCollection q)
    {
        var fixtures = Obj("filter-options.json");
        if (fixtures[filterId] is JsonObject own) return own.DeepClone().AsObject();
        var f = ById(Filters, filterId);
        var empty = new JsonObject { ["items"] = new JsonArray(), ["hasMore"] = false };
        if (f is null) return empty;
        var datasetId = Str(f, "dropdownDatasetId");
        var valueField = Str(f, "dropdownValueField");
        var labelField = Str(f, "dropdownLabelField") ?? valueField;
        foreach (var other in Filters.OfType<JsonObject>().Where(o => !Eq(Str(o, "id"), filterId)
                     && Eq(Str(o, "dropdownDatasetId"), datasetId) && Eq(Str(o, "dropdownValueField"), valueField)))
            if (fixtures[Str(other, "id")!] is JsonObject same) return same.DeepClone().AsObject();
        if (datasetId is null || valueField is null) return empty;
        // Distinct values from captured widget data of widgets on that dataset.
        var values = new List<(string Value, string Label)>();
        foreach (var record in Dashboards.OfType<JsonObject>())
            foreach (var w in record["detail"]?["widgets"]?.AsArray().OfType<JsonObject>() ?? [])
                if (Eq(Str(w, "datasetDefinitionId"), datasetId) && Obj("widget-data.json")[Str(w, "id")!]?["rawRows"] is JsonArray rows)
                    foreach (var r in rows.OfType<JsonObject>())
                        if (Str(r, valueField) is { } v && values.All(x => x.Value != v)) values.Add((v, Str(r, labelField!) ?? v));
        var search = q["search"].ToString();
        var list = values.Where(v => search.Length == 0 || v.Label.Contains(search, StringComparison.OrdinalIgnoreCase)).OrderBy(v => v.Label).ToList();
        var skip = int.TryParse(q["skip"], out var sk) ? sk : 0;
        var take = int.TryParse(q["take"], out var tk) && tk > 0 ? tk : 50;
        return new JsonObject
        {
            ["items"] = new JsonArray(list.Skip(skip).Take(take).Select(v => (JsonNode)new JsonObject { ["value"] = v.Value, ["label"] = v.Label }).ToArray()),
            ["hasMore"] = list.Count > skip + take,
        };
    }

    private IResult? HandleFilters(string method, string[] s, IQueryCollection q, JsonNode? body)
    {
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";
        const string file = "filters.json";
        switch (method)
        {
            case "GET" when p == 1:
                var scope = q["moduleScope"].ToString();
                return Json(Page(Filters.OfType<JsonNode>().Where(f => scope.Length == 0
                    || Eq(Str(f, "moduleScope"), scope) || string.IsNullOrEmpty(Str(f, "moduleScope"))), q, "code", "name"));
            case "GET" when p == 2: return ById(Filters, At(1)) is { } f ? Json(f) : NotFound();
            case "GET" when At(2) == "dropdown-options":
                return Json(FilterOptions(At(1), q));
            case "POST" when p == 1: return Create(file, body, NormalizeFilter);
            case "PUT" when p == 2:
                return Update(file, At(1), body, FilterDtoFields, item =>
                {
                    item["isActive"] = body?["isActive"]?.GetValueKind() != JsonValueKind.False;
                    NormalizeFilter(item);
                });
            case "DELETE" when p == 2: return Delete(file, At(1));
        }
        return null;
    }

    private IResult? HandleHierarchies(string method, string[] s, IQueryCollection q, JsonNode? body)
    {
        // s = dashboard, semantic, hierarchies, ...
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";
        if (At(2) != "hierarchies") return method == "GET" ? null : Ok();
        const string file = "hierarchies.json";
        var module = q["module"].ToString();
        IEnumerable<JsonNode> InModule() => Hierarchies.OfType<JsonNode>()
            .Where(h => module.Length == 0 || Eq(Str(h, "module"), module));
        switch (method)
        {
            case "GET" when p == 3: return Json(Page(InModule(), q, "code", "hierarchyName"));
            case "GET" when At(3) == "active":
                return Json(new JsonArray(InModule().Where(h => h["isActive"]?.GetValue<bool>() != false)
                    .Select(h => h.DeepClone()).ToArray()));
            case "GET" when p == 4: return ById(Hierarchies, At(3)) is { } h ? Json(h) : NotFound();
            case "POST" when p == 3: return Create(file, body, h => { h["isActive"] = true; h["links"] = new JsonArray(); h["levels"] ??= new JsonArray(); });
            case "PUT" when p == 4:
                if (ById(Hierarchies, At(3)) is null) return NotFound();
                Update(file, At(3), body, ["code", "hierarchyName", "module", "description", "datasetDefinitionId", "status", "levels"],
                    h => { h["isActive"] = body?["isActive"]?.GetValueKind() != JsonValueKind.False; h["levels"] ??= new JsonArray(); });
                return Ok(); // live: true
            case "DELETE" when p == 4:
            {
                // Live: delete deactivates the hierarchy (still in the list and readable, gone from /active).
                if (ById(Hierarchies, At(3)) is not { } gone) return NotFound();
                gone["isActive"] = false;
                gone["updatedDate"] = Now();
                Save(file);
                return Results.NoContent();
            }
        }
        return null;
    }

    private IResult? HandleAccess(string method, string[] s, JsonNode? body)
    {
        if (s.Length < 3) return null;
        var key = $"{s[1]}/{Uri.UnescapeDataString(s[2])}";
        var access = Obj("access.json");
        if (method == "GET")
        {
            var found = access[key]?.DeepClone().AsObject() ?? new JsonObject { ["dashboards"] = new JsonArray(), ["datasets"] = new JsonArray() };
            // Grants on deleted dashboards / datasets are not listed.
            if (found["dashboards"] is JsonArray ds)
                foreach (var g in ds.Where(g => DashById(Dashboards, Str(g, "dashboardId") ?? "") is null).ToList()) ds.Remove(g);
            if (found["datasets"] is JsonArray dd)
                foreach (var g in dd.Where(g => ById(Datasets, Str(g, "datasetDefinitionId") ?? "") is null).ToList()) dd.Remove(g);
            return Json(found);
        }
        if (method != "PUT") return Ok();

        // Replace semantics, rows in the live response shape and order (by name).
        var saved = new JsonObject
        {
            ["dashboards"] = new JsonArray((body?["dashboards"] as JsonArray ?? []).OfType<JsonObject>().Select(d => new JsonObject
            {
                ["dashboardId"] = Str(d, "dashboardId"),
                ["name"] = Str(DashById(Dashboards, Str(d, "dashboardId") ?? "")?["summary"], "name"),
                ["grant"] = Str(d, "grant"),
                ["isOwner"] = true,
                ["canGrant"] = true,
            }).OrderBy(o => Str(o, "name"), StringComparer.OrdinalIgnoreCase).Select(o => (JsonNode)o).ToArray()),
            ["datasets"] = new JsonArray((body?["datasets"] as JsonArray ?? []).OfType<JsonObject>().Select(d => new JsonObject
            {
                ["datasetDefinitionId"] = Str(d, "datasetDefinitionId"),
                ["name"] = Str(ById(Datasets, Str(d, "datasetDefinitionId") ?? ""), "name"),
                ["level"] = d["level"]?.DeepClone() ?? 0,
                ["rowRuleColumn"] = d["rowRuleColumn"]?.DeepClone(),
                ["rowRuleAttribute"] = d["rowRuleAttribute"]?.DeepClone(),
                ["hiddenColumns"] = d["hiddenColumns"]?.DeepClone() ?? new JsonArray(),
                ["canManage"] = true,
            }).OrderBy(o => Str(o, "name"), StringComparer.OrdinalIgnoreCase).Select(o => (JsonNode)o).ToArray()),
        };
        access[key] = saved;
        Save("access.json");
        return Ok();
    }

    private static readonly string[] DataSourceFields =
        ["name", "type", "host", "port", "database", "username", "sslMode", "commandTimeoutSeconds", "rowLimit"];

    private IResult? HandleDataSources(string method, string[] s, JsonNode? body)
    {
        var p = s.Length;
        string At(int i) => i < p ? s[i] : "";
        var store = Obj("data-sources.json");
        var list = store["list"] as JsonArray ?? new JsonArray();
        var details = store["details"] as JsonObject ?? new JsonObject();
        store["list"] = list;
        store["details"] = details;
        switch (method)
        {
            case "GET" when p == 1: return Json(list);
            case "GET" when p == 2 && At(1) != "types": return details[At(1)] is { } d ? Json(d) : NotFound();
            case "POST" when At(1) == "test" || At(2) == "test":
                return Json(new JsonObject { ["success"] = true, ["message"] = "Hardcoded mode: connection not tested." });
            case "POST" when p == 1:
            {
                var id = NewId();
                var detail = new JsonObject { ["id"] = id };
                foreach (var f in DataSourceFields) detail[f] = body?[f]?.DeepClone();
                detail["hasPassword"] = !string.IsNullOrEmpty(Str(body, "password"));
                detail["status"] = 0;
                detail["lastTestedAt"] = null;
                detail["lastTestMessage"] = null;
                detail["serverVersion"] = null;
                detail["usageCount"] = 0;
                detail["isOwner"] = true;
                details[id] = detail;
                list.Add(new JsonObject
                {
                    ["id"] = id, ["name"] = Str(body, "name"), ["type"] = body?["type"]?.DeepClone(),
                    ["host"] = Str(body, "host"), ["database"] = Str(body, "database"),
                    ["status"] = 0, ["lastTestedAt"] = null, ["usageCount"] = 0, ["isOwner"] = true,
                });
                Save("data-sources.json");
                return Json(JsonValue.Create(id)); // live: 200 + id
            }
            case "PUT" when p == 2:
            {
                if (details[At(1)] is not JsonObject detail) return NotFound();
                foreach (var f in DataSourceFields) detail[f] = body?[f]?.DeepClone();
                if (!string.IsNullOrEmpty(Str(body, "password"))) detail["hasPassword"] = true; // left out = password kept
                if (ById(list, At(1)) is { } row)
                    foreach (var f in new[] { "name", "host", "database", "type" })
                        row[f] = body?[f]?.DeepClone();
                Save("data-sources.json");
                return Json(JsonValue.Create(At(1)));
            }
            case "DELETE" when p == 2:
                if (ById(list, At(1)) is not { } gone) return NotFound();
                list.Remove(gone);
                details.Remove(At(1));
                (store["permissions"] as JsonObject)?.Remove(At(1));
                Save("data-sources.json");
                return Results.NoContent();
            case "GET" when p == 3 && At(2) == "permissions":
            {
                if (details[At(1)] is null) return NotFound();
                if (store["permissions"]?[At(1)] is { } saved) return Json(saved.DeepClone());
                // Seeded data sources: the permissions captured from the live API.
                return Json(Obj("misc.json")[$"GET /data-sources/{At(1)}/permissions"]?.DeepClone() ?? new JsonArray());
            }
            case "PUT" when p == 3 && At(2) == "permissions":
            {
                if (details[At(1)] is null) return NotFound();
                var perms = store["permissions"] as JsonObject ?? new JsonObject();
                perms[At(1)] = new JsonArray((body as JsonArray ?? []).OfType<JsonObject>().Select(x => (JsonNode)new JsonObject
                {
                    ["principalType"] = x["principalType"]?.DeepClone(),
                    ["principalId"] = Str(x, "principalId"),
                }).ToArray());
                store["permissions"] = perms;
                Save("data-sources.json");
                return Results.NoContent();
            }
        }
        return null;
    }
}
