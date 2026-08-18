using PujaCollectionTracker.Core.IdentityAggregate;
using Ardalis.Result;

namespace PujaCollectionTracker.UseCases.Authentication.UpdateProfile;

/// <summary>
/// Command to update the currently authenticated user's first and last name.
/// </summary>
/// <param name="UserId">The ID of the currently authenticated user.</param>
/// <param name="FirstName">The updated first name.</param>
/// <param name="LastName">The updated last name.</param>
public record UpdateCurrentUserProfileCommand(
  UserId UserId,
  string FirstName,
  string LastName) : ICommand<Result<UserDto>>;
