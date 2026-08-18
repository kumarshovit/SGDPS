using Ardalis.Specification;

namespace PujaCollectionTracker.Core.IdentityAggregate.Specifications;

/// <summary>
/// Returns the User with their UserRoles and Roles eagerly loaded by their UserId.
/// Used by GetMeHandler to fetch user details along with assigned roles.
/// </summary>
public class UserByIdWithRolesSpec : Specification<User>
{
  public UserByIdWithRolesSpec(UserId userId)
  {
    Query.Where(user => user.Id == userId)
         .Include(user => user.UserRoles)
         .ThenInclude(ur => ur.Role);
  }
}
