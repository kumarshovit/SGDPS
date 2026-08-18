using PujaCollectionTracker.Core.Interfaces;

namespace PujaCollectionTracker.Infrastructure.Email;

public class FakeEmailSender(ILogger<FakeEmailSender> logger) : IEmailSender
{
  private readonly ILogger<FakeEmailSender> _logger = logger;
  public Task SendEmailAsync(string to, string from, string subject, string body)
  {
    try
    {
      _logger.LogInformation("Not actually sending an email to {to} from {from} with subject {subject}", to, from, subject);
      return Task.CompletedTask;
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(FakeEmailSender), new { to, from, subject });
      throw;
    }
  }
}
