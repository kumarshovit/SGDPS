using PujaCollectionTracker.Core.IdentityAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
  public void Configure(EntityTypeBuilder<User> builder)
  {
    // Table Name
    builder.ToTable("Users");

    // Primary Key
    builder.Property(x => x.Id)
           .HasValueGenerator<VogenIdValueGenerator<AppDbContext, User, UserId>>()
           .HasVogenConversion()
           .IsRequired();

    // Properties
    builder.Property(x => x.FirstName)
           .HasMaxLength(100)
           .IsRequired();

    builder.Property(x => x.LastName)
           .HasMaxLength(100)
           .IsRequired();

    builder.Property(x => x.Email)
           .HasMaxLength(200)
           .IsRequired();

    builder.HasIndex(x => x.Email)
           .IsUnique();

    builder.Property(x => x.PasswordHash)
           .HasMaxLength(500)
           .IsRequired();

    builder.Property(x => x.IsActive)
           .IsRequired();

    builder.Property(x => x.CreatedOn)
           .IsRequired();

    builder.Property(x => x.RefreshTokenHash)
           .HasMaxLength(500)
           .IsRequired(false);

    builder.Property(x => x.RefreshTokenExpiresAt)
           .IsRequired(false);

    // Configure relationship with UserRoles
    builder.HasMany(x => x.UserRoles)
           .WithOne(x => x.User)
           .HasForeignKey(x => x.UserId)
           .OnDelete(DeleteBehavior.Cascade);
  }
}
