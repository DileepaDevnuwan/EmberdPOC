using EmberdPOC.Api.Data;
using EmberdPOC.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmberdPOC.Api.Endpoints;

public static class MasterEndpoints
{
    public static void MapMasterEndpoints(this WebApplication app)
    {
        MapUserEndpoints(app);
        MapRoleEndpoints(app);
        MapProductEndpoints(app);
        MapCustomerEndpoints(app);
    }

    static void MapUserEndpoints(WebApplication app)
    {
        var grp = app.MapGroup("/api/users").WithTags("Users").RequireAuthorization();

        grp.MapGet("/", async (AppDbContext db) =>
            await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Select(u => new { u.Id, u.Username, u.FullName, u.Email, u.IsActive, Roles = u.UserRoles.Select(ur => ur.Role.Name) })
                .ToListAsync());

        grp.MapGet("/{id}", async (int id, AppDbContext db) =>
        {
            var u = await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.Id == id);
            return u is null ? Results.NotFound() : Results.Ok(new { u.Id, u.Username, u.FullName, u.Email, u.IsActive, Roles = u.UserRoles.Select(ur => ur.Role.Name) });
        });

        grp.MapPost("/", async (CreateUserRequest req, AppDbContext db) =>
        {
            var user = new AppUser { Username = req.Username, FullName = req.FullName, Email = req.Email, PasswordHash = AuthEndpoints.HashPassword(req.Password), IsActive = true };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/users/{user.Id}", new { user.Id, user.Username, user.FullName });
        });

        grp.MapPut("/{id}", async (int id, UpdateUserRequest req, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.FullName = req.FullName;
            user.Email = req.Email;
            user.IsActive = req.IsActive;
            if (!string.IsNullOrEmpty(req.Password)) user.PasswordHash = AuthEndpoints.HashPassword(req.Password);
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        grp.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // Role assignment
        grp.MapPost("/{id}/roles", async (int id, AssignRolesRequest req, AppDbContext db) =>
        {
            var user = await db.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return Results.NotFound();
            user.UserRoles.Clear();
            foreach (var roleId in req.RoleIds)
                user.UserRoles.Add(new UserRole { UserId = id, RoleId = roleId });
            await db.SaveChangesAsync();
            return Results.Ok();
        });
    }

    static void MapRoleEndpoints(WebApplication app)
    {
        var grp = app.MapGroup("/api/roles").WithTags("Roles").RequireAuthorization();

        grp.MapGet("/", async (AppDbContext db) => await db.Roles.ToListAsync());
        grp.MapGet("/{id}", async (int id, AppDbContext db) => await db.Roles.FindAsync(id) is Role r ? Results.Ok(r) : Results.NotFound());
        grp.MapPost("/", async (Role role, AppDbContext db) => { db.Roles.Add(role); await db.SaveChangesAsync(); return Results.Created($"/api/roles/{role.Id}", role); });
        grp.MapPut("/{id}", async (int id, Role req, AppDbContext db) =>
        {
            var role = await db.Roles.FindAsync(id);
            if (role is null) return Results.NotFound();
            role.Name = req.Name; role.Description = req.Description;
            await db.SaveChangesAsync();
            return Results.Ok();
        });
        grp.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var role = await db.Roles.FindAsync(id);
            if (role is null) return Results.NotFound();
            db.Roles.Remove(role);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    static void MapProductEndpoints(WebApplication app)
    {
        var grp = app.MapGroup("/api/products").WithTags("Products").RequireAuthorization();

        grp.MapGet("/", async (AppDbContext db) => await db.Products.ToListAsync());
        grp.MapGet("/{id}", async (int id, AppDbContext db) => await db.Products.FindAsync(id) is Product p ? Results.Ok(p) : Results.NotFound());
        grp.MapPost("/", async (Product product, AppDbContext db) => { db.Products.Add(product); await db.SaveChangesAsync(); return Results.Created($"/api/products/{product.Id}", product); });
        grp.MapPut("/{id}", async (int id, Product req, AppDbContext db) =>
        {
            var p = await db.Products.FindAsync(id);
            if (p is null) return Results.NotFound();
            p.Code = req.Code; p.Name = req.Name; p.Price = req.Price; p.IsActive = req.IsActive;
            await db.SaveChangesAsync();
            return Results.Ok();
        });
        grp.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var p = await db.Products.FindAsync(id);
            if (p is null) return Results.NotFound();
            db.Products.Remove(p);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    static void MapCustomerEndpoints(WebApplication app)
    {
        var grp = app.MapGroup("/api/customers").WithTags("Customers").RequireAuthorization();

        grp.MapGet("/", async (AppDbContext db) => await db.Customers.ToListAsync());
        grp.MapGet("/{id}", async (int id, AppDbContext db) => await db.Customers.FindAsync(id) is Customer c ? Results.Ok(c) : Results.NotFound());
        grp.MapPost("/", async (Customer customer, AppDbContext db) => { db.Customers.Add(customer); await db.SaveChangesAsync(); return Results.Created($"/api/customers/{customer.Id}", customer); });
        grp.MapPut("/{id}", async (int id, Customer req, AppDbContext db) =>
        {
            var c = await db.Customers.FindAsync(id);
            if (c is null) return Results.NotFound();
            c.Code = req.Code; c.Name = req.Name; c.Phone = req.Phone; c.Email = req.Email; c.Address = req.Address; c.IsActive = req.IsActive;
            await db.SaveChangesAsync();
            return Results.Ok();
        });
        grp.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var c = await db.Customers.FindAsync(id);
            if (c is null) return Results.NotFound();
            db.Customers.Remove(c);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}

public record CreateUserRequest(string Username, string Password, string FullName, string Email);
public record UpdateUserRequest(string FullName, string Email, bool IsActive, string? Password);
public record AssignRolesRequest(List<int> RoleIds);
