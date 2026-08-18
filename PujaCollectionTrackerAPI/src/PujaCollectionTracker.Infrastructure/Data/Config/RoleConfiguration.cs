using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

/// <summary>
/// EF Core configuration for the Role entity.
/// </summary>
public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
  public void Configure(EntityTypeBuilder<Role> builder)
  {
    // Table Name
    builder.ToTable("Roles");

    // Primary Key
    builder.Property(x => x.Id)
           .HasValueGenerator<VogenIdValueGenerator<AppDbContext, Role, RoleId>>()
           .HasVogenConversion()
           .IsRequired();

    // Properties
    builder.Property(x => x.Name)
           .HasMaxLength(100)
           .IsRequired();

    builder.Property(x => x.Description)
           .HasMaxLength(250)
           .IsRequired();

    // Configure relationship with UserRoles (one-to-many from Role to join entity)
    builder.HasMany(x => x.UserRoles)
           .WithOne(x => x.Role)
           .HasForeignKey(x => x.RoleId)
           .OnDelete(DeleteBehavior.Cascade);

    // Configure relationship with RolePermissions (one-to-many from Role to join entity)
    builder.HasMany(x => x.RolePermissions)
           .WithOne(x => x.Role)
           .HasForeignKey(x => x.RoleId)
           .OnDelete(DeleteBehavior.Cascade);
  }
}
