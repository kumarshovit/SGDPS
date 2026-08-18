using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

/// <summary>
/// EF Core configuration for the Permission entity.
/// </summary>
public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
  public void Configure(EntityTypeBuilder<Permission> builder)
  {
    // Table Name
    builder.ToTable("Permissions");

    // Primary Key
    builder.Property(x => x.Id)
           .HasValueGenerator<VogenIdValueGenerator<AppDbContext, Permission, PermissionId>>()
           .HasVogenConversion()
           .IsRequired();

    // Properties
    builder.Property(x => x.Name)
           .HasMaxLength(100)
           .IsRequired();

    builder.Property(x => x.Code)
           .HasMaxLength(100)
           .IsRequired();

    builder.Property(x => x.Description)
           .HasMaxLength(250)
           .IsRequired();

    // Configure relationship with RolePermissions (one-to-many from Permission to join entity)
    builder.HasMany(x => x.RolePermissions)
           .WithOne(x => x.Permission)
           .HasForeignKey(x => x.PermissionId)
           .OnDelete(DeleteBehavior.Cascade);
  }
}
