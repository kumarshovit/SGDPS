using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

/// <summary>
/// EF Core configuration for the UserRole join entity.
/// </summary>
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
  public void Configure(EntityTypeBuilder<UserRole> builder)
  {
    // Table Name
    builder.ToTable("UserRoles");

    // Composite Primary Key
    builder.HasKey(x => new { x.UserId, x.RoleId });

    // Properties with Vogen Value Object Conversions
    builder.Property(x => x.UserId)
           .HasVogenConversion()
           .IsRequired();

    builder.Property(x => x.RoleId)
           .HasVogenConversion()
           .IsRequired();

    // Relationships
    builder.HasOne(x => x.User)
           .WithMany(x => x.UserRoles)
           .HasForeignKey(x => x.UserId)
           .OnDelete(DeleteBehavior.Cascade);

    builder.HasOne(x => x.Role)
           .WithMany(x => x.UserRoles)
           .HasForeignKey(x => x.RoleId)
           .OnDelete(DeleteBehavior.Cascade);
  }
}
