using PujaCollectionTracker.Core.IdentityAggregate;
using Ardalis.Result;
using Ardalis.SharedKernel;

namespace PujaCollectionTracker.UseCases.Authentication.Logout;

/// <summary>
/// Command to log out the specified user.
/// </summary>
/// <param name="UserId">The ID of the user performing the logout.</param>
public record LogoutCommand(UserId UserId) : ICommand<Result>;
