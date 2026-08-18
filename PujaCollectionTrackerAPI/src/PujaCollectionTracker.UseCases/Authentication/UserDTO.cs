using PujaCollectionTracker.Core.IdentityAggregate;

namespace PujaCollectionTracker.UseCases.Authentication;

/// <summary>
/// Data Transfer Object representing user information.
/// Exposes assigned roles to the Web presentation layer.
/// </summary>
public record UserDto(
  UserId Id,
  string FirstName,
  string LastName,
  string Email,
  bool IsActive,
  DateTime CreatedOn,
  IReadOnlyCollection<string> Roles = null!);
