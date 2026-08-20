namespace PujaCollectionTracker.Core.FlatAggregate;

public class Block : EntityBase, IAggregateRoot
{
  public string BlockName { get; set; } = default!; // e.g. "A-Block", "B-Block"
  public int Floors { get; set; } = 18;
  public int FlatsPerFloor { get; set; } = 7;

  [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "decimal(18,2)")]
  public decimal ExpectedAmount { get; set; } = 0m;

  public bool IsActive { get; set; } = true;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime? UpdatedAt { get; set; }
}
