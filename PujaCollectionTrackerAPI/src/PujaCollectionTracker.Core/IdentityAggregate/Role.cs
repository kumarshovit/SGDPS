using Ardalis.GuardClauses;
using Ardalis.SharedKernel;

namespace PujaCollectionTracker.Core.IdentityAggregate;

public class Role : EntityBase<Role, RoleId>, IAggregateRoot
{
  private readonly List<UserRole> _userRoles = [];
  private readonly List<RolePermission> _rolePermissions = [];

  private Role()
  {
  }

  public Role(
      string name,
      string description)
  {
    Name = Guard.Against.NullOrWhiteSpace(name);
    Description = Guard.Against.NullOrWhiteSpace(description);
  }

  public string Name { get; private set; } = string.Empty;

  public string Description { get; private set; } = string.Empty;

  public IReadOnlyCollection<UserRole> UserRoles => _userRoles.AsReadOnly();

  public IReadOnlyCollection<RolePermission> RolePermissions => _rolePermissions.AsReadOnly();

  public void Update(string name, string description)
  {
    Name = Guard.Against.NullOrWhiteSpace(name);
    Description = Guard.Against.NullOrWhiteSpace(description);
  }
  public void AddPermission(Permission permission)
  {
    Guard.Against.Null(permission);

    if (_rolePermissions.Any(x => x.PermissionId == permission.Id))
      return;

    _rolePermissions.Add(new RolePermission(Id, permission.Id));
  }
  public void RemovePermission(PermissionId permissionId)
  {
    var permission = _rolePermissions
        .FirstOrDefault(x => x.PermissionId == permissionId);

    if (permission is not null)
    {
      _rolePermissions.Remove(permission);
    }
  }

}
