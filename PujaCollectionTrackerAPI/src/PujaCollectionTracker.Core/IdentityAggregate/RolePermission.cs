namespace PujaCollectionTracker.Core.IdentityAggregate;

public class RolePermission
{
  private RolePermission()
  {
  }

  public RolePermission(
      RoleId roleId,
      PermissionId permissionId)
  {
    RoleId = roleId;
    PermissionId = permissionId;
  }

  public RoleId RoleId { get; private set; }

  public PermissionId PermissionId { get; private set; }

  public Role Role { get; private set; } = default!;

  public Permission Permission { get; private set; } = default!;
}
