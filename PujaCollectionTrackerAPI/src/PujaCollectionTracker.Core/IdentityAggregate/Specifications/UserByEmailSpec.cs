namespace PujaCollectionTracker.Core.IdentityAggregate.Specifications;

/// <summary>
/// Returns the User whose email address matches the given value.
/// Used by the RegisterUserHandler to detect duplicate registrations.
/// </summary>
public class UserByEmailSpec : Specification<User>
{
  public UserByEmailSpec(string email) =>
    Query.Where(user => user.Email == email);
}
