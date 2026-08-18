using Ardalis.GuardClauses;
using Ardalis.SharedKernel;

namespace PujaCollectionTracker.Core.IdentityAggregate;

public class Permission : EntityBase<Permission, PermissionId>, IAggregateRoot
{
  private readonly List<RolePermission> _rolePermissions = [];

  private Permission()
  {
  }

  public Permission(
      string name,
      string code,
      string description)
  {
    Name = Guard.Against.NullOrWhiteSpace(name);
    Code = Guard.Against.NullOrWhiteSpace(code);
    Description = Guard.Against.NullOrWhiteSpace(description);
  }

  public string Name { get; private set; } = string.Empty;

  public string Code { get; private set; } = string.Empty;

  public string Description { get; private set; } = string.Empty;

  public IReadOnlyCollection<RolePermission> RolePermissions =>
      _rolePermissions.AsReadOnly();

  public void Update(
      string name,
      string code,
      string description)
  {
    Name = Guard.Against.NullOrWhiteSpace(name);
    Code = Guard.Against.NullOrWhiteSpace(code);
    Description = Guard.Against.NullOrWhiteSpace(description);
  }
}
