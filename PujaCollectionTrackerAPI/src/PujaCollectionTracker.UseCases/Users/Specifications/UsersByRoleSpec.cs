using PujaCollectionTracker.Core.IdentityAggregate;
using Ardalis.Specification;

namespace PujaCollectionTracker.UseCases.Users.Specifications;

public class UsersByRoleSpec : Specification<User>
{
  public UsersByRoleSpec(string roleName)
  {
    Query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == roleName))
         .Include(u => u.UserRoles)
         .ThenInclude(ur => ur.Role);
  }
}
