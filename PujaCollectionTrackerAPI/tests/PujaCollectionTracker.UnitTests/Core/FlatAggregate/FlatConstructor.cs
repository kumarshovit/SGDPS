using PujaCollectionTracker.Core.FlatAggregate;

namespace PujaCollectionTracker.UnitTests.Core.FlatAggregate;

public class FlatConstructor
{
  [Fact]
  public void InitializesFlatPropertiesCorrectly()
  {
    var flat = new Flat
    {
      FlatNumber = "A-101",
      TowerOrBlock = "Block A",
      OwnerName = "Test Owner",
      OwnerPhone = "9876543210"
    };

    flat.FlatNumber.ShouldBe("A-101");
    flat.TowerOrBlock.ShouldBe("Block A");
    flat.OwnerName.ShouldBe("Test Owner");
    flat.OwnerPhone.ShouldBe("9876543210");
    flat.IsActive.ShouldBeTrue();
  }
}
