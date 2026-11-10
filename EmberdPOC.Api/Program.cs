using System.Text;
using EmberdPOC.Api.Data;
using EmberdPOC.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
        // SignalR WebSockets send the token as ?access_token= (the export progress hub).
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (ctx.Request.Path.Value?.Contains("/hubs/") == true && ctx.Request.Query["access_token"] is { Count: > 0 } t)
                    ctx.Token = t.ToString();
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

builder.Services.AddHttpClient("DashboardWeb", c => c.BaseAddress = new Uri("http://localhost:5150"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto-migrate on startup (POC only)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
    if (admin is not null && admin.PasswordHash == "AQAAAAIAAYagAAAAEH+E1SZT0FwR4Lnz5kg==")
    {
        admin.PasswordHash = AuthEndpoints.HashPassword("admin123");
        await db.SaveChangesAsync();
    }
}

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapMasterEndpoints();
app.MapSaleEndpoints();

// Dashboard proxy: the browser calls only this back end. We get the user's Dashboard token
// server-to-server (client id + secret never leave here) and forward /api/v1/embed/* to the
// OSOS Dashboard service with it.
var dashboardTokens = new System.Collections.Concurrent.ConcurrentDictionary<string, (string Token, DateTimeOffset ExpiresAt)>();

async Task<string?> DashboardTokenAsync(HttpContext ctx, IHttpClientFactory factory, AppDbContext db)
{
    var userId = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (userId is null) return null;
    if (dashboardTokens.TryGetValue(userId, out var cached) && cached.ExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
        return cached.Token;

    var id = int.Parse(userId);
    var user = await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.Id == id);
    var body = new
    {
        clientId = app.Configuration["Dashboard:ClientId"],
        clientSecret = app.Configuration["Dashboard:ClientSecret"],
        user = new
        {
            id = user?.Username ?? "poc-user",
            email = user?.Email ?? "poc@emberd.com",
            fullName = user?.FullName ?? "POC User",
            // The product's own role names: the Access page grants dashboards and datasets to them.
            roles = user?.UserRoles.Select(ur => ur.Role.Name).ToArray() ?? [],
            capabilities = new[] { "TenantAdmin" }
        }
    };
    var resp = await factory.CreateClient("DashboardWeb").PostAsJsonAsync("/api/v1/embed/token", body);
    if (!resp.IsSuccessStatusCode) return null;
    var issued = await resp.Content.ReadFromJsonAsync<DashboardTokenResponse>();
    if (issued is null) return null;
    dashboardTokens[userId] = (issued.Token, issued.ExpiresAt);
    return issued.Token;
}

app.Map("/api/v1/embed/{**path}", async (HttpContext ctx, IHttpClientFactory factory, AppDbContext db) =>
{
    var token = await DashboardTokenAsync(ctx, factory, db);
    if (token is null) return Results.StatusCode(StatusCodes.Status502BadGateway);

    var forward = new HttpRequestMessage(new HttpMethod(ctx.Request.Method), $"{ctx.Request.Path}{ctx.Request.QueryString}");
    forward.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    if (ctx.Request.Headers.TryGetValue("X-Dashboard-Module", out var module))
        forward.Headers.TryAddWithoutValidation("X-Dashboard-Module", module.ToString());
    if (ctx.Request.ContentLength > 0 || ctx.Request.Headers.TransferEncoding.Count > 0)
    {
        forward.Content = new StreamContent(ctx.Request.Body);
        if (ctx.Request.ContentType is { } contentType)
            forward.Content.Headers.TryAddWithoutValidation("Content-Type", contentType);
    }

    var resp = await factory.CreateClient("DashboardWeb").SendAsync(forward, HttpCompletionOption.ResponseHeadersRead, ctx.RequestAborted);
    ctx.Response.StatusCode = (int)resp.StatusCode;
    foreach (var header in resp.Content.Headers.Where(h => h.Key is "Content-Type" or "Content-Disposition"))
        ctx.Response.Headers[header.Key] = header.Value.ToArray();
    await resp.Content.CopyToAsync(ctx.Response.Body, ctx.RequestAborted);
    return Results.Empty;
}).RequireAuthorization();

// Insight Hub: ask the Dashboard service for the published GLOBAL + module dashboards and
// return the list; the page binds it to the hub's input.
app.MapGet("/api/dashboard-hub/{moduleCode}", async (string moduleCode, HttpContext ctx, IHttpClientFactory factory, AppDbContext db) =>
{
    var token = await DashboardTokenAsync(ctx, factory, db);
    if (token is null) return Results.StatusCode(StatusCodes.Status502BadGateway);

    var request = new HttpRequestMessage(HttpMethod.Get,
        $"/api/v1/embed/dashboard/hub?moduleCode={Uri.EscapeDataString(moduleCode)}&$top=200&$skip=0");
    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    request.Headers.Add("X-Dashboard-Module", moduleCode);

    var resp = await factory.CreateClient("DashboardWeb").SendAsync(request, ctx.RequestAborted);
    if (!resp.IsSuccessStatusCode) return Results.StatusCode((int)resp.StatusCode);
    var page = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
    return Results.Ok(page.TryGetProperty("items", out var items) ? items : default);
}).RequireAuthorization();

// Hardcoded mode: the same embed API answered from JSON files in HardcodedData/ (no Dashboard.Web call).
app.MapHardcodedEmbedEndpoints();

app.Run();

record DashboardTokenResponse(string Token, DateTimeOffset ExpiresAt);
