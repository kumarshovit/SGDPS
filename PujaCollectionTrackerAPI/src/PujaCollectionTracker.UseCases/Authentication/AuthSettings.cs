namespace PujaCollectionTracker.UseCases.Authentication;

/// <summary>
/// Configurable authentication settings bound from the "Authentication" section in configuration.
/// </summary>
public class AuthSettings
{
  /// <summary>
  /// The base URL of the client application (e.g. React frontend).
  /// </summary>
  public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

  /// <summary>
  /// The frontend path to redirect user for email verification.
  /// </summary>
  public string EmailVerificationRoute { get; set; } = "/verify-email";

  /// <summary>
  /// Expiration period of the generated email verification token in hours.
  /// </summary>
  public int VerificationTokenExpiryHours { get; set; } = 24;
}
