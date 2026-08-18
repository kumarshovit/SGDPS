using Ardalis.ListStartupServices;
using PujaCollectionTracker.Infrastructure.Data;
using Scalar.AspNetCore;
using PujaCollectionTracker.Web.Middleware;

namespace PujaCollectionTracker.Web.Configurations;

public static class MiddlewareConfig
{
  public static async Task<IApplicationBuilder> UseAppMiddlewareAndSeedDatabase(this WebApplication app)
  {
    app.UseMiddleware<GlobalExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
      app.UseShowAllServicesMiddleware(); // see https://github.com/ardalis/AspNetCoreStartupServices
    }
    else
    {   
      app.UseHsts();
    }

    app.UseCors("Frontend");

    app.UseAuthentication();
    app.UseAuthorization();

    app.UseFastEndpoints(c =>
    {
      c.Endpoints.RoutePrefix = "api";
    });

   
      app.UseSwaggerGen(options =>
      {
        options.Path = "/openapi/{documentName}.json";
      },
      settings =>
      {
        settings.Path = "/swagger";
        settings.DocumentPath = "/openapi/{documentName}.json";
      });
  
      app.MapScalarApiReference(options =>
      {
        options.WithTitle("Durga Pujo Collection Tracker API");
        options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
      });
    

    // app.UseHttpsRedirection(); // Commented out for HTTP IIS deployment

    // Run migrations and seed in Development or when explicitly requested via environment variable
    var shouldMigrate = app.Environment.IsDevelopment() || 
                        app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup");
    
    if (shouldMigrate)
    {
      await MigrateDatabaseAsync(app);
      await SeedDatabaseAsync(app);
    }

    return app;
  }

  static async Task MigrateDatabaseAsync(WebApplication app)
  {
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
      logger.LogInformation("Applying database migrations...");
      var context = services.GetRequiredService<AppDbContext>();
      
      // For SQLite, use EnsureCreated instead of migrations (common for dev/local scenarios)
      // For SQL Server, use migrations (production scenario)
      if (context.Database.IsSqlite())
      {
        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("SQLite database created successfully");
      }
      else
      {
        await context.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully");
      }
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "An error occurred migrating the DB. {exceptionMessage}", ex.Message);
      throw; // Re-throw to make startup fail if migrations fail
    }
  }

  static async Task SeedDatabaseAsync(WebApplication app)
  {
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
      logger.LogInformation("Seeding database...");
      var context = services.GetRequiredService<AppDbContext>();
      await SeedData.InitializeAsync(context, services);
      logger.LogInformation("Database seeded successfully");
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "An error occurred seeding the DB. {exceptionMessage}", ex.Message);
      // Don't re-throw for seeding errors - it's not critical
    }
  }
}
