using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.UseCases.Authentication;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.GetMe;

/// <summary>
/// Handler for retrieving user profile details by UserId.
/// Eagerly loads and includes the user's assigned roles.
/// </summary>
public class GetMeHandler(IReadRepository<User> _repository, ILogger<GetMeHandler> _logger)
  : IQueryHandler<GetMeQuery, Result<UserDto>>
{
  public async ValueTask<Result<UserDto>> Handle(GetMeQuery request, CancellationToken cancellationToken)
  {
    try
    {
    // Use the specification to eagerly load UserRoles and the underlying Role entities
    var user = await _repository.FirstOrDefaultAsync(
      new UserByIdWithRolesSpec(request.UserId), cancellationToken);

    if (user is null)
    {
      return Result.NotFound();
    }

    var roles = user.UserRoles
      .Where(ur => ur.Role is not null)
      .Select(ur => ur.Role!.Name)
      .ToList();

    var userDto = new UserDto(
      user.Id,
      user.FirstName,
      user.LastName,
      user.Email,
      user.IsActive,
      user.CreatedOn,
      roles);

    return Result.Success(userDto);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(GetMeHandler), request);
      throw;
    }
  }
}
