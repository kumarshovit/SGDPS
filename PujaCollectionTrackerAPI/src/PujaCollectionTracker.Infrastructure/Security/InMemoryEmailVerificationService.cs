using System.Collections.Concurrent;
using System.Security.Cryptography;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Infrastructure.Security;

/// <summary>
/// Thread-safe in-memory implementation of IEmailVerificationService for development.
/// Stores email verification tokens in memory with an expiration time.
/// </summary>
public class InMemoryEmailVerificationService(ILogger<InMemoryEmailVerificationService> _logger) : IEmailVerificationService
{
  private readonly ConcurrentDictionary<string, VerificationTokenInfo> _tokens = new(StringComparer.OrdinalIgnoreCase);

  public string GenerateVerificationToken(string email, TimeSpan expiration)
  {
    try
    {
    var bytes = new byte[32];
    using (var rng = RandomNumberGenerator.Create())
    {
      rng.GetBytes(bytes);
    }
    var token = Convert.ToHexString(bytes);
    var info = new VerificationTokenInfo(token, DateTime.UtcNow.Add(expiration));

    _tokens[email] = info;
    return token;
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(InMemoryEmailVerificationService), new { email, expiration });
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
          nameof(InMemoryEmailVerificationService), new { email });
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
          nameof(InMemoryEmailVerificationService), new { email });
      throw;
    }
  }

  private record VerificationTokenInfo(string Token, DateTime ExpiresAt);
}
