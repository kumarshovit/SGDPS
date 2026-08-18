namespace PujaCollectionTracker.Core.IdentityAggregate;

public class UserRole
{
  private UserRole()
  {
  }

  public UserRole(
      UserId userId,
      RoleId roleId)
  {
    UserId = userId;
    RoleId = roleId;
  }

  public UserId UserId { get; private set; }

  public RoleId RoleId { get; private set; }

  public User User { get; private set; } = default!;

  public Role Role { get; private set; } = default!;
}
