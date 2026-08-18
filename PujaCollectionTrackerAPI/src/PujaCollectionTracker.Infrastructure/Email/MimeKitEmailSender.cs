using PujaCollectionTracker.Core.Interfaces;

namespace PujaCollectionTracker.Infrastructure.Email;

public class MimeKitEmailSender(ILogger<MimeKitEmailSender> logger,
  IOptions<MailserverConfiguration> mailserverOptions) : IEmailSender
{
  private readonly ILogger<MimeKitEmailSender> _logger = logger;
  private readonly MailserverConfiguration _mailserverConfiguration = mailserverOptions.Value!;

  public async Task SendEmailAsync(string to, string from, string subject, string body)
  {
    try
    {
    _logger.LogWarning("Sending email to {to} from {from} with subject {subject} using {type}.", to, from, subject, this.ToString());

    using var client = new MailKit.Net.Smtp.SmtpClient(); 
    
    // Bypass certificate validation (useful for local development/MailHog/Papercut)
    client.ServerCertificateValidationCallback = (s, c, h, e) => true;
    
    // 1. Connect using the configured Hostname and Port, enabling StartTls.
    await client.ConnectAsync(_mailserverConfiguration.Hostname, 
      _mailserverConfiguration.Port, MailKit.Security.SecureSocketOptions.StartTls);

    // 2. Authenticate using Username and Password credentials if provided.
    if (!string.IsNullOrEmpty(_mailserverConfiguration.Username))
    {
      await client.AuthenticateAsync(_mailserverConfiguration.Username, _mailserverConfiguration.Password);
    }

    var message = new MimeMessage();
    
    // 3. Resolve Sender Email and Name from MailserverConfiguration fallback.
    var senderEmail = !string.IsNullOrEmpty(_mailserverConfiguration.SenderEmail) 
      ? _mailserverConfiguration.SenderEmail 
      : from;
    var senderName = !string.IsNullOrEmpty(_mailserverConfiguration.SenderName) 
      ? _mailserverConfiguration.SenderName 
      : senderEmail;

    message.From.Add(new MailboxAddress(senderName, senderEmail));
    message.To.Add(new MailboxAddress(to, to));
    message.Subject = subject;
    
    // 4. Create an HTML body instead of plain text.
    message.Body = new TextPart("html") { Text = body };

    await client.SendAsync(message);
    
    // 5. Disconnect gracefully.
    await client.DisconnectAsync(true);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(MimeKitEmailSender), new { to, from, subject });
      throw;
    }
  }
}
