namespace PujaCollectionTracker.UseCases.Authentication.RefreshToken;

/// <summary>
/// Represents the result of a successful token refresh operation.
/// </summary>
public record RefreshTokenResult(
  string AccessToken,
  DateTime ExpiresAt,
  string RefreshToken,
  DateTime RefreshTokenExpiresAt);
