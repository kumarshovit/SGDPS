using System.Text;
using PujaCollectionTracker.Core.Interfaces;
using PujaCollectionTracker.Infrastructure;
using PujaCollectionTracker.Infrastructure.Email;
using PujaCollectionTracker.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace PujaCollectionTracker.Web.Configurations;

public static class ServiceConfigs
{
  public static IServiceCollection AddServiceConfigs(this IServiceCollection services, Microsoft.Extensions.Logging.ILogger logger, WebApplicationBuilder builder)
  {
    services.AddInfrastructureServices(builder.Configuration, logger)
            .AddMediatorSourceGen(logger);

    // JWT Bearer Authentication
    var jwtConfig = builder.Configuration.GetSection("Jwt").Get<JwtConfiguration>()
      ?? new JwtConfiguration();

    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddJwtBearer(options =>
      {
        options.Events = new JwtBearerEvents
        {
          OnMessageReceived = context =>
          // {
          //   if (context.Request.Cookies.TryGetValue("access_token", out var accessToken))
          //   {
          //     context.Token = accessToken;
          //   }

          //   return Task.CompletedTask;
          // }
            {
    // Fallback to cookie if Bearer token is not in header
    if (string.IsNullOrEmpty(context.Token) &&
        context.Request.Cookies.TryGetValue("access_token", out var accessToken))
    {
      context.Token = accessToken;
    }
    return Task.CompletedTask;
  }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = jwtConfig.Issuer,
          ValidAudience = jwtConfig.Audience,
          IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtConfig.Secret)),
          ClockSkew = TimeSpan.Zero
        };
      });


    services.AddAuthorization();

    if (builder.Environment.IsDevelopment())
    {
      // Use a local test email server - configured in Aspire
      // See: https://ardalis.com/configuring-a-local-test-email-server/
      services.AddScoped<IEmailSender, MimeKitEmailSender>();

      // Otherwise use this:
      //builder.Services.AddScoped<IEmailSender, FakeEmailSender>();
    }
    else
    {
      services.AddScoped<IEmailSender, MimeKitEmailSender>();
    }

    logger.LogInformation("{Project} services registered", "Mediator Source Generator and Email Sender");

    return services;
  }


}
