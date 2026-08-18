namespace PujaCollectionTracker.Core.FlatAggregate;

public class Flat : EntityBase, IAggregateRoot
{
  public string Block { get; set; } = default!; // e.g. "A-Block", "B-Block"

  // Backward compatibility alias for TowerOrBlock
  public string TowerOrBlock
  {
    get => Block;
    set => Block = value;
  }

  public int Floor { get; set; } = 1;
  public string FlatNumber { get; set; } = default!; // e.g. "101", "A-101"
  public string OwnerName { get; set; } = default!;
  public string OwnerPhone { get; set; } = default!;
  public string? Email { get; set; }

  [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "decimal(18,2)")]
  public decimal ExpectedAmount { get; set; } = 0m;
  public bool IsActive { get; set; } = true;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
