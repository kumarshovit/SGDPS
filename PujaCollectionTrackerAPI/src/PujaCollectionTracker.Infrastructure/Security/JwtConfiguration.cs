namespace PujaCollectionTracker.Infrastructure.Security;

/// <summary>
/// JWT signing and validation settings bound from the "Jwt" appsettings section.
/// </summary>
public class JwtConfiguration
{
  public string Secret { get; set; } = string.Empty;
  public string Issuer { get; set; } = string.Empty;
  public string Audience { get; set; } = string.Empty;
  public int ExpirationMinutes { get; set; } = 60;
  public int RefreshTokenExpirationDays { get; set; } = 7;
}
