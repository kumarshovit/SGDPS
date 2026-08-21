using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.Interfaces;
using Ardalis.GuardClauses;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Infrastructure.Security;

public class JwtTokenGenerator(IOptions<JwtConfiguration> jwtOptions, ILogger<JwtTokenGenerator> _logger) : IJwtTokenGenerator
{
  private readonly JwtConfiguration _config = jwtOptions.Value;

  public (string AccessToken, DateTime ExpiresAt) GenerateToken(User user)
  {
    try
    {
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config.Secret));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expiresAt = DateTime.UtcNow.AddMinutes(_config.ExpirationMinutes);

    var pwdStamp = !string.IsNullOrEmpty(user.PasswordHash)
      ? user.PasswordHash.Substring(0, Math.Min(16, user.PasswordHash.Length))
      : string.Empty;

    var claims = new List<Claim>
    {
      new Claim(JwtRegisteredClaimNames.Sub, user.Id.Value.ToString()),
      new Claim(JwtRegisteredClaimNames.Email, user.Email),
      new Claim(JwtRegisteredClaimNames.GivenName, user.FirstName),
      new Claim(JwtRegisteredClaimNames.FamilyName, user.LastName),
      new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
      new Claim("pwd_stamp", pwdStamp)
    };

    foreach (var userRole in user.UserRoles)
    {
      if (userRole.Role is not null)
      {
        claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
      }
    }

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims),
      Expires = expiresAt,
      Issuer = _config.Issuer,
      Audience = _config.Audience,
      SigningCredentials = credentials
    };

    var handler = new JwtSecurityTokenHandler();
    var securityToken = handler.CreateToken(tokenDescriptor);
    var accessToken = handler.WriteToken(securityToken);

    return (accessToken, expiresAt);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(JwtTokenGenerator), new { user.Id, user.Email });
      throw;
    }
  }

  public (string RefreshToken, DateTime ExpiresAt) GenerateRefreshToken()
  {
    var randomNumber = RandomNumberGenerator.GetBytes(64);
    var refreshToken = Convert.ToBase64String(randomNumber);
    var expiresAt = DateTime.UtcNow.AddDays(_config.RefreshTokenExpirationDays);

    return (refreshToken, expiresAt);
  }

  public string HashRefreshToken(string refreshToken)
  {
    Guard.Against.NullOrWhiteSpace(refreshToken);
    var bytes = Encoding.UTF8.GetBytes(refreshToken);
    var hashBytes = SHA256.HashData(bytes);
    return Convert.ToHexString(hashBytes);
  }
}


