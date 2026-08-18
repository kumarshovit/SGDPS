using PujaCollectionTracker.Core.FlatAggregate;

namespace PujaCollectionTracker.IntegrationTests.Data;

public class EfRepositoryUpdate : BaseEfRepoTestFixture
{
  [Fact]
  public async Task UpdatesItemAfterAddingIt()
  {
    var repository = GetRepository();
    var flat = new Flat
    {
      FlatNumber = "C-303",
      TowerOrBlock = "Block C",
      OwnerName = "Original Name",
      OwnerPhone = "1234567890"
    };

    await repository.AddAsync(flat);

    _dbContext.Entry(flat).State = EntityState.Detached;

    var newFlat = (await repository.ListAsync())
        .FirstOrDefault(f => f.FlatNumber == "C-303");
    newFlat.ShouldNotBeNull();

    newFlat.OwnerName = "Updated Name";

    await repository.UpdateAsync(newFlat);

    var updatedItem = (await repository.ListAsync())
        .FirstOrDefault(f => f.FlatNumber == "C-303");

    updatedItem.ShouldNotBeNull();
    updatedItem.OwnerName.ShouldBe("Updated Name");
  }
}
