namespace PujaCollectionTracker.UseCases.Authentication.ForgotPassword;

/// <summary>
/// Command to request a password reset token.
/// Always returns a generic success result to prevent user enumeration.
/// </summary>
public record ForgotPasswordCommand(string Email) : ICommand<Result<string?>>;
