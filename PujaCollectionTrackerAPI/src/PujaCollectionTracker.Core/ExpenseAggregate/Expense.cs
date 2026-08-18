namespace PujaCollectionTracker.Core.ExpenseAggregate;

public class Expense : EntityBase, IAggregateRoot
{
  public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
  public string Category { get; set; } = default!; // e.g. Electricity, MaintenanceRepair, Cleaning, Security, Decoration, Food, PujaMaterials, Miscellaneous
  public string Description { get; set; } = default!;

  [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "decimal(18,2)")]
  public decimal Amount { get; set; }
  public PujaCollectionTracker.Core.CollectionAggregate.PaymentMode PaymentMode { get; set; } = PujaCollectionTracker.Core.CollectionAggregate.PaymentMode.Cash;
  public string? PaidToVendor { get; set; }
  public string? BillAttachmentUrl { get; set; }
  public string? Remarks { get; set; }
  public string RecordedByUserId { get; set; } = default!;
  public string? RecordedByName { get; set; }
  public bool IsDeleted { get; set; } = false;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
