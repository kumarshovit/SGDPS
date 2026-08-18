using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.UseCases.Authentication;

namespace PujaCollectionTracker.UseCases.Authentication.GetMe;

/// <summary>
/// Query to retrieve the currently logged in user's profile information.
/// </summary>
public record GetMeQuery(UserId UserId) : IQuery<Result<UserDto>>;
