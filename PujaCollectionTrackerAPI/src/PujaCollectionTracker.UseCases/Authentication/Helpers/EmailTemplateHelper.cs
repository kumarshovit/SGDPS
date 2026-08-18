namespace PujaCollectionTracker.UseCases.Authentication.Helpers;

/// <summary>
/// Helper class to encapsulate HTML email templates.
/// Separates presentation/wording concerns from use case processing handlers.
/// </summary>
public static class EmailTemplateHelper
{
  /// <summary>
  /// Generates the HTML body for the email verification email.
  /// </summary>
  public static string BuildVerificationEmail(string firstName, string verificationUrl, int expiryHours)
  {
    return $@"
      <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333;"">
        <h2>Welcome to PujaCollectionTracker, {firstName}!</h2>
        <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
        <p style=""margin: 24px 0;"">
          <a href=""{verificationUrl}"" style=""background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;"" target=""_blank"">Verify Email Address</a>
        </p>
        <p>If the button doesn't work, copy and paste the raw link below into your web browser:</p>
        <p style=""word-break: break-all;""><a href=""{verificationUrl}"" target=""_blank"">{verificationUrl}</a></p>
        <p>This verification link is valid for <strong>{expiryHours} hours</strong>.</p>
        <br/>
        <p>Best regards,<br/>The PujaCollectionTracker Team</p>
      </div>";
  }
}
