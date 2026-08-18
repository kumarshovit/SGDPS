namespace PujaCollectionTracker.UseCases.Authentication.VerifyEmail;

/// <summary>
/// Command to verify a user's email using a secure token.
/// </summary>
public record VerifyEmailCommand(string Email, string Token) : ICommand<Result>;
