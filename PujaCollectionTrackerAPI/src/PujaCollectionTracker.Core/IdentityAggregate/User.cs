using Ardalis.GuardClauses;
using Ardalis.SharedKernel;

namespace PujaCollectionTracker.Core.IdentityAggregate;

public class User : EntityBase<User, UserId>, IAggregateRoot
{
  private readonly List<UserRole> _userRoles = [];

  private User()
  {
  }

  public User(
    string firstName,
    string lastName,
    string email,
    string passwordHash)
  {
    FirstName = Guard.Against.NullOrWhiteSpace(firstName);
    LastName = Guard.Against.NullOrWhiteSpace(lastName);
    Email = Guard.Against.NullOrWhiteSpace(email);
    PasswordHash = Guard.Against.NullOrWhiteSpace(passwordHash);

    IsActive = true;
    IsEmailVerified = false;
    CreatedOn = DateTime.UtcNow;
  }
  public string FirstName { get; private set; } = string.Empty;

  public string LastName { get; private set; } = string.Empty;

  public string Email { get; private set; } = string.Empty;

  public string PasswordHash { get; private set; } = string.Empty;

  public bool IsActive { get; private set; }

  public bool IsEmailVerified { get; private set; }

  public DateTime CreatedOn { get; private set; }

  public DateTime? UpdatedOn { get; private set; }

  public DateTime? LastLoginOn { get; private set; }

  public string? RefreshTokenHash { get; private set; }

  public DateTime? RefreshTokenExpiresAt { get; private set; }

  public IReadOnlyCollection<UserRole> UserRoles => _userRoles.AsReadOnly();

  public void SetRefreshToken(string refreshTokenHash, DateTime expiresAt)
  {
    RefreshTokenHash = Guard.Against.NullOrWhiteSpace(refreshTokenHash);
    RefreshTokenExpiresAt = expiresAt;
    UpdatedOn = DateTime.UtcNow;
  }

  public void RevokeRefreshToken()
  {
    RefreshTokenHash = null;
    RefreshTokenExpiresAt = null;
    UpdatedOn = DateTime.UtcNow;
  }

  public bool IsRefreshTokenValid(string refreshTokenHash)
  {
    return !string.IsNullOrWhiteSpace(RefreshTokenHash) &&
           string.Equals(RefreshTokenHash, refreshTokenHash, StringComparison.Ordinal) &&
           RefreshTokenExpiresAt.HasValue &&
           RefreshTokenExpiresAt.Value > DateTime.UtcNow &&
           IsActive;
  }

  public void UpdateName(
    string firstName,
    string lastName)
  {
    FirstName = Guard.Against.NullOrWhiteSpace(firstName);
    LastName = Guard.Against.NullOrWhiteSpace(lastName);

    UpdatedOn = DateTime.UtcNow;
  }

  public void ChangePassword(string passwordHash)
  {
    PasswordHash = Guard.Against.NullOrWhiteSpace(passwordHash);

    UpdatedOn = DateTime.UtcNow;
  }

  public void VerifyEmail()
  {
    IsEmailVerified = true;

    UpdatedOn = DateTime.UtcNow;
  }

  public void Activate()
  {
    IsActive = true;

    UpdatedOn = DateTime.UtcNow;
  }

  public void Deactivate()
  {
    IsActive = false;

    UpdatedOn = DateTime.UtcNow;
  }

  public void UpdateLastLogin()
  {
    LastLoginOn = DateTime.UtcNow;
    UpdatedOn = DateTime.UtcNow;
  }
  public void AssignRole(Role role)
  {
    Guard.Against.Null(role);

    if (_userRoles.Any(x => x.RoleId == role.Id))
      return;

    _userRoles.Add(new UserRole(Id, role.Id));
  }
  public void RemoveRole(RoleId roleId)
  {
    var role = _userRoles.FirstOrDefault(x => x.RoleId == roleId);

    if (role is not null)
    {
      _userRoles.Remove(role);
    }
  }

}
