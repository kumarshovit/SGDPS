using PujaCollectionTracker.Core.FlatAggregate;

namespace PujaCollectionTracker.IntegrationTests.Data;

public class EfRepositoryAdd : BaseEfRepoTestFixture
{
  [Fact]
  public async Task AddsFlatAndSetsId()
  {
    var repository = GetRepository();
    var flat = new Flat
    {
      FlatNumber = "A-101",
      TowerOrBlock = "Block A",
      OwnerName = "Test Owner",
      OwnerPhone = "9876543210"
    };

    await repository.AddAsync(flat);

    var newFlat = (await repository.ListAsync()).FirstOrDefault();

    newFlat.ShouldNotBeNull();
    newFlat.FlatNumber.ShouldBe("A-101");
    newFlat.OwnerName.ShouldBe("Test Owner");
    newFlat.Id.ShouldBeGreaterThan(0);
  }
}
