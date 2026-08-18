using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.ForgotPassword;

/// <summary>
/// Handler for ForgotPasswordCommand.
/// Resolves the user by email, generates a secure password reset token, and sends an HTML reset email.
/// Always returns success to mitigate user enumeration attacks.
/// </summary>
public class ForgotPasswordHandler(
  IReadRepository<User> _repository,
  IPasswordResetService _passwordResetService,
  IEmailSender _emailSender,
  ILogger<ForgotPasswordHandler> _logger)
  : ICommandHandler<ForgotPasswordCommand, Result>
{
  public async ValueTask<Result> Handle(ForgotPasswordCommand command, CancellationToken cancellationToken)
  {
    try
    {
    var user = await _repository.FirstOrDefaultAsync(
      new UserByEmailSpec(command.Email), cancellationToken);

    // If the user exists, generate the token and send the reset email.
    if (user is not null)
    {
      // 1. Token will expire in 60 minutes.
      var token = _passwordResetService.GenerateResetToken(command.Email, TimeSpan.FromMinutes(60));
      
      // 2. Build the temporary React frontend reset URL.
      var resetUrl = $"http://localhost:5173/reset-password?email={Uri.EscapeDataString(command.Email)}&token={Uri.EscapeDataString(token)}";

      // 3. Build the HTML email body.
      var htmlBody = $@"
        <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333;"">
          <h2>Hello, {user.FirstName}</h2>
          <p>We received a request to reset the password for your PujaCollectionTracker account.</p>
          <p>Please click the button below to set a new password:</p>
          <p style=""margin: 24px 0;"">
            <a href=""{resetUrl}"" style=""background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;"">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste the raw link below into your web browser:</p>
          <p style=""word-break: break-all;""><a href=""{resetUrl}"">{resetUrl}</a></p>
          <p>This password reset link is valid for <strong>60 minutes</strong>.</p>
          <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
          <br/>
          <p>Best regards,<br/>The PujaCollectionTracker Team</p>
        </div>";

      // 4. Dispatch the HTML email via Brevo SMTP relay.
      await _emailSender.SendEmailAsync(
        to: command.Email,
        from: "noreply@PujaCollectionTracker.com",
        subject: "Reset your PujaCollectionTracker account password",
        body: htmlBody
      );
    }

    // Always return Success to prevent indicating whether the email exists in the database.
    return Result.Success();
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(ForgotPasswordHandler), command);
      throw;
    }
  }
}
