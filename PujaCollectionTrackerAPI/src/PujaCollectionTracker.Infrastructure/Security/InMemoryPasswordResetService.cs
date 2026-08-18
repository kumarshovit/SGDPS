using System.Collections.Concurrent;
using System.Security.Cryptography;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Infrastructure.Security;

/// <summary>
/// Thread-safe in-memory implementation of IPasswordResetService for development.
/// Stores password reset tokens in memory with an expiration time.
/// </summary>
public class InMemoryPasswordResetService(ILogger<InMemoryPasswordResetService> _logger) : IPasswordResetService
{
  private readonly ConcurrentDictionary<string, ResetTokenInfo> _tokens = new(StringComparer.OrdinalIgnoreCase);

  public string GenerateResetToken(string email, TimeSpan expiration)
  {
    try
    {
    var bytes = new byte[32];
    using (var rng = RandomNumberGenerator.Create())
    {
      rng.GetBytes(bytes);
    }
    var token = Convert.ToHexString(bytes);
    var info = new ResetTokenInfo(token, DateTime.UtcNow.Add(expiration));

    _tokens[email] = info;
    return token;
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(InMemoryPasswordResetService), new { email, expiration });
      throw;
    }
  }

  public bool ValidateToken(string email, string token)
  {
    try
    {
    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
    {
      return false;
    }

    if (_tokens.TryGetValue(email, out var info))
    {
      // Check if token is not expired and matches the provided token
      if (info.ExpiresAt > DateTime.UtcNow && string.Equals(info.Token, token, StringComparison.Ordinal))
      {
        return true;
      }
    }

    return false;
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(InMemoryPasswordResetService), new { email });
      throw;
    }
  }

  public void InvalidateToken(string email)
  {
    try
    {
    if (!string.IsNullOrEmpty(email))
    {
      _tokens.TryRemove(email, out _);
    }
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(InMemoryPasswordResetService), new { email });
      throw;
    }
  }

  private record ResetTokenInfo(string Token, DateTime ExpiresAt);
}
