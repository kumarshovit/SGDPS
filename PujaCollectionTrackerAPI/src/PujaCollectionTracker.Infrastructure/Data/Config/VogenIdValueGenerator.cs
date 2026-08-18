using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

internal class VogenIdValueGenerator<TContext, TEntityBase, TId> : ValueGenerator<TId>
    where TContext : DbContext
    where TEntityBase : EntityBase<TEntityBase, TId>
    where TId : struct
{
  private readonly PropertyInfo _matchPropertyGetter;

  public VogenIdValueGenerator()
  {
    var matchingProperties =
        typeof(TContext).GetProperties().Where(p => p!.GetGetMethod()!.IsPublic && p.PropertyType == typeof(DbSet<TEntityBase>)).ToList();

    if (matchingProperties.Count == 0)
    {
      throw new InvalidOperationException($"No properties found in the EFCore context for a DBSet of {nameof(TEntityBase)}");
    }

    if (matchingProperties.Count > 1)
    {
      throw new InvalidOperationException($"Multiple properties found in the EFCore context for a DBSet of {nameof(TEntityBase)}");
    }

    _matchPropertyGetter = matchingProperties[0];
  }

  public override TId Next(EntityEntry entry)
  {
    Console.WriteLine($"VogenIdValueGenerator.Next() called for Entity Type: {entry.Entity.GetType().Name}");
    
    TContext ctx = (TContext)entry.Context;

    DbSet<TEntityBase> entities = (DbSet<TEntityBase>)_matchPropertyGetter!.GetValue(ctx)!;

    var next = Math.Max(
        MaxFrom(entities.Local),
        MaxFrom(entities)) + 1;

    Console.WriteLine($"VogenIdValueGenerator.Next() generated ID: {next} for {entry.Entity.GetType().Name}");
    
    var fromMethod = typeof(TId).GetMethod("From", [typeof(int)]);
    return (TId)fromMethod!.Invoke(null, [next])!;

    static int MaxFrom(IEnumerable<TEntityBase> es) =>
        es.Any() ? es.Max(e => (int)((dynamic)e.Id!).Value) : 0;
  }


  public override bool GeneratesTemporaryValues => false;
}
