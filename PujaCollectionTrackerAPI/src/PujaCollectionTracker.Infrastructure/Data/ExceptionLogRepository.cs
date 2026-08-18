using PujaCollectionTracker.Core.ExceptionLogAggregate;
using PujaCollectionTracker.Core.Interfaces;

namespace PujaCollectionTracker.Infrastructure.Data;

public class ExceptionLogRepository : EfRepository<ExceptionLog>, IExceptionLogRepository
{
  public ExceptionLogRepository(AppDbContext dbContext) : base(dbContext)
  {
  }
}
