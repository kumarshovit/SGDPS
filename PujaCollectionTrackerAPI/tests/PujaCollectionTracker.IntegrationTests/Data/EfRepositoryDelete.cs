using PujaCollectionTracker.Core.FlatAggregate;

namespace PujaCollectionTracker.IntegrationTests.Data;

public class EfRepositoryDelete : BaseEfRepoTestFixture
{
  [Fact]
  public async Task DeletesItemAfterAddingIt()
  {
    var repository = GetRepository();
    var flat = new Flat
    {
      FlatNumber = "B-202",
      TowerOrBlock = "Block B",
      OwnerName = "Owner To Delete",
      OwnerPhone = "9999999999"
    };
    await repository.AddAsync(flat);

    await repository.DeleteAsync(flat);

    (await repository.ListAsync()).ShouldNotContain(f => f.FlatNumber == "B-202");
  }
}
