using Ardalis.Specification;

namespace PujaCollectionTracker.Core.IdentityAggregate.Specifications;

/// <summary>
/// Specification to look up a User by their hashed Refresh Token with UserRoles and Roles eagerly loaded.
/// </summary>
public class UserByRefreshTokenHashSpec : Specification<User>
{
  public UserByRefreshTokenHashSpec(string refreshTokenHash)
  {
    Query.Where(user => user.RefreshTokenHash == refreshTokenHash)
         .Include(user => user.UserRoles)
         .ThenInclude(ur => ur.Role);
  }
}
