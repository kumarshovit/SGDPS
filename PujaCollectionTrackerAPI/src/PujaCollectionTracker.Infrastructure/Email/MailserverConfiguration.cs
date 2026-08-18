namespace PujaCollectionTracker.Infrastructure.Email;

public class MailserverConfiguration
{
  public string Hostname { get; set; } = "smtp-relay.brevo.com";
  public int Port { get; set; } = 587;

  public string Username { get; set; } = string.Empty;
  public string Password { get; set; } = string.Empty;

  public string SenderName { get; set; } = "PujaCollectionTracker Support";
  public string SenderEmail { get; set; } = string.Empty;
}
