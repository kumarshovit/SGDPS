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
    await SyncBlocksAndFlatsAsync(dbContext);
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

  private static async Task SyncBlocksAndFlatsAsync(AppDbContext dbContext)
  {
    var standardBlocks = new (string Name, int Floors, int FlatsPerFloor, bool IsActive)[]
    {
      ("A-Block", 18, 7, true),
      ("B-Block", 18, 7, true),
      ("C-Block", 18, 7, true),
      ("D-Block", 18, 7, true),
      ("E-Block", 18, 7, true),
      ("F-Block", 18, 7, true),
      ("G-Block", 18, 7, true),
      ("H-Block", 18, 7, true),
      ("I-Block", 18, 7, true),
      ("J-Block", 18, 9, true),
      ("K-Block", 18, 7, true),
      ("L-Block", 18, 7, true),
      ("M-Block", 18, 9, true),
      ("N-Block", 18, 9, true),
      ("O-Block", 18, 9, true),
      ("P-Block", 18, 7, true),
      ("Q-Block", 18, 7, false),
      ("S-Block", 18, 7, false),
      ("X-Block", 18, 10, false),
      ("Y-Block", 18, 7, false),
    };

    var existingBlocks = await dbContext.Blocks.ToListAsync();
    var existingFlats = await dbContext.Flats.ToListAsync();

    // 1. Ensure Blocks table contains all standard blocks and blocks found in flats
    var allBlockNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach (var b in standardBlocks) allBlockNames.Add(b.Name);
    foreach (var f in existingFlats) allBlockNames.Add(f.Block);

    foreach (var bName in allBlockNames)
    {
      var blockRecord = existingBlocks.FirstOrDefault(b => b.BlockName.Equals(bName, StringComparison.OrdinalIgnoreCase));
      var standardMeta = standardBlocks.FirstOrDefault(s => s.Name.Equals(bName, StringComparison.OrdinalIgnoreCase));

      int targetFloors = standardMeta.Floors > 0 ? standardMeta.Floors : 18;
      int targetFlatsPerFloor = standardMeta.FlatsPerFloor > 0 ? standardMeta.FlatsPerFloor : 7;
      bool targetIsActive = standardMeta.Name != null ? standardMeta.IsActive : true;

      if (blockRecord == null)
      {
        blockRecord = new Block
        {
          BlockName = bName,
          Floors = targetFloors,
          FlatsPerFloor = targetFlatsPerFloor,
          ExpectedAmount = 0m,
          IsActive = targetIsActive,
          CreatedAt = DateTime.UtcNow
        };
        dbContext.Blocks.Add(blockRecord);
        existingBlocks.Add(blockRecord);
      }
      else
      {
        if (blockRecord.Floors < targetFloors)
        {
          blockRecord.Floors = targetFloors;
          blockRecord.UpdatedAt = DateTime.UtcNow;
        }
        if (blockRecord.FlatsPerFloor < targetFlatsPerFloor)
        {
          blockRecord.FlatsPerFloor = targetFlatsPerFloor;
          blockRecord.UpdatedAt = DateTime.UtcNow;
        }
        blockRecord.ExpectedAmount = 0m;
      }
    }

    await dbContext.SaveChangesAsync();

    // 2. Self-healing backfill: Provision missing flat records up to target dimensions for all blocks
    var flatsToAdd = new List<Flat>();

    foreach (var block in existingBlocks)
    {
      var currentBlockFlats = existingFlats
        .Where(f => f.Block.Equals(block.BlockName, StringComparison.OrdinalIgnoreCase))
        .ToList();

      var existingFlatNumbers = new HashSet<string>(currentBlockFlats.Select(f => f.FlatNumber.Trim()), StringComparer.OrdinalIgnoreCase);

      for (int floor = 1; floor <= block.Floors; floor++)
      {
        for (int unit = 1; unit <= block.FlatsPerFloor; unit++)
        {
          var flatNumber = $"{floor}0{unit}";
          if (!existingFlatNumbers.Contains(flatNumber))
          {
            var prefix = block.BlockName.Length > 0 ? block.BlockName[..1].ToUpper() : "U";
            flatsToAdd.Add(new Flat
            {
              Block = block.BlockName,
              Floor = floor,
              FlatNumber = flatNumber,
              OwnerName = $"Resident {prefix}-{flatNumber}",
              OwnerPhone = "",
              ExpectedAmount = 0m,
              IsActive = block.IsActive,
              CreatedAt = DateTime.UtcNow
            });
            existingFlatNumbers.Add(flatNumber);
          }
        }
      }
    }

    if (flatsToAdd.Count > 0)
    {
      await dbContext.Flats.AddRangeAsync(flatsToAdd);
      await dbContext.SaveChangesAsync();
    }
  }
}
