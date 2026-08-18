using Ardalis.Specification;

namespace PujaCollectionTracker.Core.IdentityAggregate.Specifications;

/// <summary>
/// Returns the Role whose name matches the given value.
/// Used to lookup default roles like "Player".
/// </summary>
public class RoleByNameSpec : Specification<Role>
{
  public RoleByNameSpec(string name) =>
    Query.Where(role => role.Name == name);
}
