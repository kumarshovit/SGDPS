using PujaCollectionTracker.Core.IdentityAggregate;

namespace PujaCollectionTracker.UseCases.Authentication.Register;

/// <summary>
/// Registers a new user account with a specified role.
/// Password is plain-text; the handler is responsible for hashing it.
/// </summary>
/// <param name="FirstName">The user's first name.</param>
/// <param name="LastName">The user's last name.</param>
/// <param name="Email">The user's unique email address.</param>
/// <param name="Password">The plain-text password to be hashed by the handler.</param>
/// <param name="Role">The registration role selected by the user (Admin, TeamManager, or Player).</param>
public record RegisterUserCommand(
  string FirstName,
  string LastName,
  string Email,
  string Password,
  string Role) : ICommand<Result<UserId>>;
