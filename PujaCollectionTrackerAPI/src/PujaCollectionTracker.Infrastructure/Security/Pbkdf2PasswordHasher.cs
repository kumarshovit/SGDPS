using System.Security.Cryptography;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Infrastructure.Security;

public class Pbkdf2PasswordHasher(ILogger<Pbkdf2PasswordHasher> _logger) : IPasswordHasher
{
  private const int SaltSize = 16;
  private const int HashSize = 32;
  private const int Iterations = 310_000;
  private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

  public string Hash(string plainTextPassword)
  {
    try
    {
    var salt = RandomNumberGenerator.GetBytes(SaltSize);

    var hash = Rfc2898DeriveBytes.Pbkdf2(
      plainTextPassword,
      salt,
      Iterations,
      Algorithm,
      HashSize);

    return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(Pbkdf2PasswordHasher), "Hash");
      throw;
    }
  }

  public bool Verify(string plainTextPassword, string passwordHash)
  {
    try
    {
    var parts = passwordHash.Split('.');

    if (parts.Length != 3)
      return false;

    if (!int.TryParse(parts[0], out var iterations))
      return false;

    var salt = Convert.FromBase64String(parts[1]);
    var storedHash = Convert.FromBase64String(parts[2]);

    var computedHash = Rfc2898DeriveBytes.Pbkdf2(
      plainTextPassword,
      salt,
      iterations,
      Algorithm,
      HashSize);

    return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(Pbkdf2PasswordHasher), "Verify");
      throw;
    }
  }
}
