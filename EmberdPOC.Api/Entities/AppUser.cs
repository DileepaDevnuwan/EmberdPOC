namespace EmberdPOC.Api.Entities;

public class AppUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public class UserRole
{
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
