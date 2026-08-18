using PujaCollectionTracker.Core.ExceptionLogAggregate;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Text;

namespace PujaCollectionTracker.Web.Middleware;

public class GlobalExceptionMiddleware
{
  private readonly RequestDelegate _next;
  private readonly ILogger<GlobalExceptionMiddleware> _logger;

  public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
  {
    _next = next;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context, IExceptionLogRepository exceptionLogRepository, PujaCollectionTracker.Infrastructure.Data.AppDbContext dbContext)
  {
    try
    {
      // Ensure the request body can be read multiple times if needed, though we might not need to read it here 
      // unless we explicitly buffer it earlier. FastEndpoints normally buffers it if configured.
      context.Request.EnableBuffering();
      
      await _next(context);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An unhandled exception occurred during the request.");
      await HandleExceptionAsync(context, ex, exceptionLogRepository, dbContext);
    }
  }

  private async Task HandleExceptionAsync(HttpContext context, Exception exception, IExceptionLogRepository repository, PujaCollectionTracker.Infrastructure.Data.AppDbContext dbContext)
  {
    string? requestBody = null;
    
    // Attempt to read the request body if available and seekable
    if (context.Request.Body.CanSeek)
    {
      try
      {
        context.Request.Body.Position = 0;
        using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
        requestBody = await reader.ReadToEndAsync();
        context.Request.Body.Position = 0;
      }
      catch (IOException)
      {
        // The client may have disconnected or aborted the request
        requestBody = "[Body could not be read: Client reset the request stream]";
      }
      catch (Exception)
      {
        requestBody = "[Body could not be read: Unknown error]";
      }
    }

    var exceptionLog = new ExceptionLog(
      exceptionType: Truncate(exception.GetType().Name, 250),
      message: exception.Message,
      stackTrace: exception.StackTrace,
      innerException: exception.InnerException?.Message,
      requestPath: Truncate(context.Request.Path.Value, 500),
      httpMethod: Truncate(context.Request.Method, 10),
      userId: Truncate(context.User?.FindFirstValue(ClaimTypes.NameIdentifier), 100),
      requestBody: requestBody,
      queryString: context.Request.QueryString.ToString()
    );

    try
    {
      // Clear any dirty tracked entities from the failed HTTP request before saving the error log
      dbContext.ChangeTracker.Clear();
      await repository.AddAsync(exceptionLog);
      await repository.SaveChangesAsync();
    }
    catch (Exception logException)
    {
      _logger.LogError(logException, "Failed to save exception log.");
    }

    context.Response.ContentType = "application/problem+json";
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;

    var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
    {
      Title = "Internal Server Error",
      Status = StatusCodes.Status500InternalServerError,
      Detail = "An unexpected error occurred.",
      Instance = context.Request.Path
    };

    await context.Response.WriteAsJsonAsync(problemDetails);
  }

  private static string Truncate(string? text, int maxLength)
  {
    if (string.IsNullOrEmpty(text)) return text ?? string.Empty;
    return text.Length <= maxLength ? text : text.Substring(0, maxLength);
  }
}
