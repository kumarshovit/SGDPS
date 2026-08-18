namespace PujaCollectionTracker.UseCases.Authentication.Login;

/// <summary>
/// Authenticates an existing user by email and password.
/// Password is plain-text; the handler verifies it against the stored hash.
/// </summary>
/// <param name="Email">The user's registered email address.</param>
/// <param name="Password">The plain-text password to verify.</param>
public record LoginUserCommand(
  string Email,
  string Password) : ICommand<Result<LoginResult>>;
