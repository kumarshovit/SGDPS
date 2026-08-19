using PujaCollectionTracker.Core.FlatAggregate;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace PujaCollectionTracker.Infrastructure.Data;

public static class SeedData
{
  public static async Task InitializeAsync(AppDbContext dbContext, IServiceProvider? serviceProvider = null)
  {
    await SeedRolesAsync(dbContext);
    if (serviceProvider != null)
    {
      await SeedUsersAsync(dbContext, serviceProvider);
    }
    await SeedInitialFlatsAsync(dbContext);
  }

  private static async Task SeedRolesAsync(AppDbContext dbContext)
  {
    var rolesToSeed = new[] { "Admin", "Collector" };

    foreach (var roleName in rolesToSeed)
    {
      var roleExists = await dbContext.Roles.AnyAsync(r => r.Name == roleName);
      if (!roleExists)
      {
        dbContext.Roles.Add(new Role(roleName, $"Default {roleName} role"));
      }
    }

    await dbContext.SaveChangesAsync();
  }

  private static async Task SeedUsersAsync(AppDbContext dbContext, IServiceProvider serviceProvider)
  {
    var passwordHasher = serviceProvider.GetService<IPasswordHasher>();
    if (passwordHasher == null) return;

    var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
    var collectorRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Collector");

    // Admin & Treasurer User (Unified Web Admin)
    if (!await dbContext.Users.AnyAsync(u => u.Email == "admin@sgdps.com"))
    {
      var adminUser = new User("System", "Admin", "admin@sgdps.com", passwordHasher.Hash("Admin@123"));
      adminUser.VerifyEmail();
      if (adminRole != null) adminUser.AssignRole(adminRole);
      dbContext.Users.Add(adminUser);
    }

    // Collector User (Field Mobile App)
    if (!await dbContext.Users.AnyAsync(u => u.Email == "collector@sgdps.com"))
    {
      var collectorUser = new User("Field", "Collector", "collector@sgdps.com", passwordHasher.Hash("Collector@123"));
      collectorUser.VerifyEmail();
      if (collectorRole != null) collectorUser.AssignRole(collectorRole);
      dbContext.Users.Add(collectorUser);
    }

    await dbContext.SaveChangesAsync();
  }

  private static async Task SeedInitialFlatsAsync(AppDbContext dbContext)
  {
    if (await dbContext.Flats.AnyAsync()) return;

    var blocks = new[] { "A-Block", "B-Block", "C-Block", "D-Block" };
    var flatsToAdd = new List<Flat>();

    foreach (var block in blocks)
    {
      for (int floor = 1; floor <= 9; floor++)
      {
        for (int flatNum = 1; flatNum <= 7; flatNum++)
        {
          var flatNumber = $"{floor}0{flatNum}";
          flatsToAdd.Add(new Flat
          {
            Block = block,
            Floor = floor,
            FlatNumber = flatNumber,
            OwnerName = $"Resident {block}-{flatNumber}",
            OwnerPhone = "",
            ExpectedAmount = 0m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
          });
        }
      }
    }

    await dbContext.Flats.AddRangeAsync(flatsToAdd);
    await dbContext.SaveChangesAsync();
  }
}
