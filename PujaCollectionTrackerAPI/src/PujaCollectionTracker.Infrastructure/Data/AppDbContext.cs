using PujaCollectionTracker.Core.CollectionAggregate;
using PujaCollectionTracker.Core.ExceptionLogAggregate;
using PujaCollectionTracker.Core.ExpenseAggregate;
using PujaCollectionTracker.Core.FlatAggregate;
using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace PujaCollectionTracker.Infrastructure.Data;
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
  public DbSet<Flat> Flats => Set<Flat>();
  public DbSet<PaymentCollection> PaymentCollections => Set<PaymentCollection>();
  public DbSet<Expense> Expenses => Set<Expense>();
  public DbSet<User> Users => Set<User>();
  public DbSet<Role> Roles => Set<Role>();
  public DbSet<UserRole> UserRoles => Set<UserRole>();
  public DbSet<Permission> Permissions => Set<Permission>();
  public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
  public DbSet<ExceptionLog> ExceptionLogs => Set<ExceptionLog>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

    // Global soft-delete query filters
    modelBuilder.Entity<PaymentCollection>().HasQueryFilter(e => !e.IsDeleted);
    modelBuilder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);
  }

  public override int SaveChanges() =>
        SaveChangesAsync().GetAwaiter().GetResult();
}
