namespace PujaCollectionTracker.Core.CollectionAggregate;

public enum PaymentMode
{
  Cash = 1,
  UPI = 2,
  Cheque = 3,
  BankTransfer = 4
}

public enum CollectionType
{
  ResidentBlock = 1,
  SponsorshipOther = 2
}

public class PaymentCollection : EntityBase, IAggregateRoot
{
  public CollectionType Type { get; set; } = CollectionType.ResidentBlock;
  public int? FlatId { get; set; }
  public string? Block { get; set; }
  public int? Floor { get; set; }
  public string? FlatNumber { get; set; }
  public string? Category { get; set; }
  public string? DonorResidentName { get; set; }

  [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "decimal(18,2)")]
  public decimal Amount { get; set; }
  public PaymentMode Mode { get; set; } = PaymentMode.Cash;
  public DateTime CollectionDateTime { get; set; } = DateTime.UtcNow;

  // Captured by Android App / Web
  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public string? ReceiptNumber { get; set; }
  public string? TransactionReference { get; set; }
  public string CollectedByUserId { get; set; } = default!;
  public string? CollectedByName { get; set; }
  public string? Remarks { get; set; }
  public bool IsDeleted { get; set; } = false;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime? UpdatedAt { get; set; }
}
