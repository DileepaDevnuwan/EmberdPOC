using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EmberdPOC.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EmberdPOC.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var grp = app.MapGroup("/api/auth").WithTags("Auth");

        grp.MapPost("/login", async (LoginRequest req, AppDbContext db, IConfiguration cfg) =>
        {
            var user = await db.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == req.Username && u.IsActive);

            if (user is null || !VerifyPassword(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            var token = GenerateToken(user, roles, cfg);

            return Results.Ok(new { token, user.Id, user.Username, user.FullName, roles });
        }).AllowAnonymous();

        grp.MapGet("/me", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await db.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return Results.NotFound();
            return Results.Ok(new { user.Id, user.Username, user.FullName, user.Email, Roles = user.UserRoles.Select(ur => ur.Role.Name) });
        }).RequireAuthorization();
    }

    public static string HashPassword(string password)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("EmberdPOC-Secret-Salt"));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }

    static bool VerifyPassword(string password, string storedHash) => HashPassword(password) == storedHash;

    static string GenerateToken(Entities.AppUser user, List<string> roles, IConfiguration cfg)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("fullName", user.FullName)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: cfg["Jwt:Issuer"],
            audience: cfg["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(string Username, string Password);
