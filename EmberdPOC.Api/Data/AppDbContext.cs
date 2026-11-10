using EmberdPOC.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmberdPOC.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<UserRole>(e =>
        {
            e.HasKey(ur => new { ur.UserId, ur.RoleId });
            e.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            e.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
        });

        mb.Entity<Sale>(e =>
        {
            e.HasOne(s => s.Customer).WithMany().HasForeignKey(s => s.CustomerId);
            e.HasMany(s => s.Items).WithOne().HasForeignKey(si => si.SaleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(s => s.Payments).WithOne().HasForeignKey(p => p.SaleId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<SaleItem>(e =>
        {
            e.HasOne(si => si.Product).WithMany().HasForeignKey(si => si.ProductId);
        });

        // Seed admin role and user (password: admin123)
        mb.Entity<Role>().HasData(new Role { Id = 1, Name = "Admin", Description = "System Administrator" });
        mb.Entity<AppUser>().HasData(new AppUser
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "AQAAAAIAAYagAAAAEH+E1SZT0FwR4Lnz5kg==", // will use BCrypt at runtime
            FullName = "System Admin",
            Email = "admin@emberd.com",
            IsActive = true
        });
        mb.Entity<UserRole>().HasData(new UserRole { UserId = 1, RoleId = 1 });
    }
}
