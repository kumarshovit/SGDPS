using Ardalis.Result;
using Ardalis.SharedKernel;

namespace PujaCollectionTracker.UseCases.Authentication.RefreshToken;

/// <summary>
/// Command to refresh an expired JWT access token using a valid Refresh Token.
/// </summary>
/// <param name="RefreshToken">The plain refresh token provided by the client.</param>
public record RefreshTokenCommand(string RefreshToken) : ICommand<Result<RefreshTokenResult>>;
