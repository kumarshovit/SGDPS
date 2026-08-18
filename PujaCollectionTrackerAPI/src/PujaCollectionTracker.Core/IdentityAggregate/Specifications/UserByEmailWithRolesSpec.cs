using Ardalis.Specification;

namespace PujaCollectionTracker.Core.IdentityAggregate.Specifications;

/// <summary>
/// Returns the User with their UserRoles and Roles eagerly loaded.
/// Used during Login to populate JWT Role claims.
/// </summary>
public class UserByEmailWithRolesSpec : Specification<User>
{
  public UserByEmailWithRolesSpec(string email)
  {
    Query.Where(user => user.Email == email)
         .Include(user => user.UserRoles)
         .ThenInclude(ur => ur.Role);
  }
}
