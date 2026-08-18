using PujaCollectionTracker.Core.Interfaces;
using PujaCollectionTracker.Infrastructure.Data;
using PujaCollectionTracker.Infrastructure.Security;
using PujaCollectionTracker.UseCases.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;


namespace PujaCollectionTracker.Infrastructure;

public static class InfrastructureServiceExtensions
{
  public static IServiceCollection AddInfrastructureServices(
    this IServiceCollection services,
    ConfigurationManager config,
    ILogger logger)
  {
    // Try to get connection strings in order of priority:
    // 1. "cleanarchitecture" - provided by Aspire when using .WithReference(cleanArchDb)
    // 2. "DefaultConnection" - SQL Server (Windows only by default, can be forced with USE_SQL_SERVER=true)
    // 3. "SqliteConnection" - fallback to SQLite
    bool isWindows = OperatingSystem.IsWindows();
    bool forceSqlServer = Environment.GetEnvironmentVariable("USE_SQL_SERVER") == "true";

    string? connectionString = config.GetConnectionString("DefaultConnection");

    services.AddScoped<EventDispatchInterceptor>();
    services.AddScoped<IDomainEventDispatcher, MediatorDomainEventDispatcher>();

    services.AddDbContext<AppDbContext>((provider, options) =>
    {
      var eventDispatchInterceptor = provider.GetRequiredService<EventDispatchInterceptor>();
      
      // Use SQL Server if Aspire or DefaultConnection (on Windows or forced) is available, otherwise use SQLite
      if (config.GetConnectionString("cleanarchitecture") != null || 
          ((isWindows || forceSqlServer) && config.GetConnectionString("DefaultConnection") != null))
      {
        options.UseSqlServer(connectionString);
      }
      else
      {
        options.UseSqlite(connectionString);
      }

      options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
      options.AddInterceptors(eventDispatchInterceptor);
    });

    services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>))
           .AddScoped(typeof(IReadRepository<>), typeof(EfRepository<>))
           .AddScoped<IExceptionLogRepository, ExceptionLogRepository>()
           .AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>()
           .AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

    services.AddSingleton<IPasswordResetService, InMemoryPasswordResetService>();
    services.AddSingleton<IEmailVerificationService, InMemoryEmailVerificationService>();
    
    // Register the raw AuthSettings resolved directly from bound Options to support clean dependency injection
    services.AddSingleton(sp => sp.GetRequiredService<IOptions<AuthSettings>>().Value);

    logger.LogInformation("{Project} services registered", "Infrastructure");

    return services;
  }
}
