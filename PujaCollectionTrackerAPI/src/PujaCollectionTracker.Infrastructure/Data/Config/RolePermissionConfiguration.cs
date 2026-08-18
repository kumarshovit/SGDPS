using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

/// <summary>
/// EF Core configuration for the RolePermission join entity.
/// </summary>
public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
  public void Configure(EntityTypeBuilder<RolePermission> builder)
  {
    // Table Name
    builder.ToTable("RolePermissions");

    // Composite Primary Key
    builder.HasKey(x => new { x.RoleId, x.PermissionId });

    // Properties with Vogen Value Object Conversions
    builder.Property(x => x.RoleId)
           .HasVogenConversion()
           .IsRequired();

    builder.Property(x => x.PermissionId)
           .HasVogenConversion()
           .IsRequired();

    // Relationships
    builder.HasOne(x => x.Role)
           .WithMany(x => x.RolePermissions)
           .HasForeignKey(x => x.RoleId)
           .OnDelete(DeleteBehavior.Cascade);

    builder.HasOne(x => x.Permission)
           .WithMany(x => x.RolePermissions)
           .HasForeignKey(x => x.PermissionId)
           .OnDelete(DeleteBehavior.Cascade);
  }
}
