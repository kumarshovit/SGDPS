using Ardalis.SharedKernel;

namespace PujaCollectionTracker.Core.ExceptionLogAggregate;

public class ExceptionLog : EntityBase<ExceptionLog, ExceptionLogId>, IAggregateRoot
{
  public string ExceptionType { get; private set; } = string.Empty;
  public string Message { get; private set; } = string.Empty;
  public string? StackTrace { get; private set; }
  public string? InnerException { get; private set; }
  public string RequestPath { get; private set; } = string.Empty;
  public string HttpMethod { get; private set; } = string.Empty;
  public string? UserId { get; private set; }
  public string? RequestBody { get; private set; }
  public string? QueryString { get; private set; }
  public DateTime CreatedOnUtc { get; private set; }

  // Private constructor for EF Core
  private ExceptionLog() { }

  public ExceptionLog(
    string exceptionType,
    string message,
    string? stackTrace,
    string? innerException,
    string requestPath,
    string httpMethod,
    string? userId,
    string? requestBody,
    string? queryString)
  {
    ExceptionType = exceptionType;
    Message = message;
    StackTrace = stackTrace;
    InnerException = innerException;
    RequestPath = requestPath;
    HttpMethod = httpMethod;
    UserId = userId;
    RequestBody = requestBody;
    QueryString = queryString;
    CreatedOnUtc = DateTime.UtcNow;
  }
}
