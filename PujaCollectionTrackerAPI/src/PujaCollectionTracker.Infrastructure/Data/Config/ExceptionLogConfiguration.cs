using PujaCollectionTracker.Core.ExceptionLogAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

public class ExceptionLogConfiguration : IEntityTypeConfiguration<ExceptionLog>
{
  public void Configure(EntityTypeBuilder<ExceptionLog> builder)
  {
    builder.HasKey(x => x.Id);

    builder.Property(x => x.Id)
      .ValueGeneratedOnAdd()
      .HasConversion(
        new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<ExceptionLogId, int>(
            id => id.Value,
            value => ExceptionLogId.From(value)),
        new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<ExceptionLogId>(
            (l, r) => SafeEquals(l, r),
            v => SafeGetHashCode(v),
            v => v))
      .IsRequired();

    builder.Property(x => x.ExceptionType)
      .IsRequired()
      .HasMaxLength(250);

    builder.Property(x => x.Message)
      .IsRequired();

    builder.Property(x => x.RequestPath)
      .IsRequired()
      .HasMaxLength(500);

    builder.Property(x => x.HttpMethod)
      .IsRequired()
      .HasMaxLength(10);

    builder.Property(x => x.UserId)
      .HasMaxLength(100);

    builder.Property(x => x.CreatedOnUtc)
      .IsRequired();
  }
  private static int SafeGetHashCode(ExceptionLogId id)
  {
      try { return id.GetHashCode(); }
      catch { return 0; }
  }

  private static bool SafeEquals(ExceptionLogId l, ExceptionLogId r)
  {
      bool lInit = true;
      int lVal = 0;
      try { lVal = l.Value; } catch { lInit = false; }
      
      bool rInit = true;
      int rVal = 0;
      try { rVal = r.Value; } catch { rInit = false; }
      
      if (!lInit && !rInit) return true;
      if (!lInit || !rInit) return false;
      return lVal == rVal;
  }
}
