namespace PujaCollectionTracker.UseCases.Authentication.Login;

/// <summary>
/// Represents the data returned by a successful login.
/// Carried inside Result&lt;LoginResult&gt; from LoginUserHandler.
/// </summary>
public record LoginResult(
  string AccessToken,
  DateTime ExpiresAt,
  string RefreshToken,
  DateTime RefreshTokenExpiresAt,
  UserDto User);

