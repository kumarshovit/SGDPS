namespace PujaCollectionTracker.Core.Interfaces;

/// <summary>
/// Defines the contract for password hashing and verification.
/// Implementations live in PujaCollectionTracker.Infrastructure; this interface
/// keeps the domain free from cryptographic dependencies.
/// </summary>
public interface IPasswordHasher
{
  /// <summary>
  /// Produces a cryptographically secure hash of the plain-text password.
  /// The returned string is self-contained and includes the salt.
  /// </summary>
  string Hash(string plainTextPassword);

  /// <summary>
  /// Verifies that a plain-text password matches a previously produced hash.
  /// </summary>
  bool Verify(string plainTextPassword, string passwordHash);
}
