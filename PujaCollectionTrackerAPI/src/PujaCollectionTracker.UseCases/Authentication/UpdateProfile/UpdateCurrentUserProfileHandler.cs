using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.UseCases.Authentication;
using Ardalis.Result;
using Ardalis.SharedKernel;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.UpdateProfile;

public class UpdateCurrentUserProfileHandler(
  IRepository<User> _repository,
  ILogger<UpdateCurrentUserProfileHandler> _logger)
  : ICommandHandler<UpdateCurrentUserProfileCommand, Result<UserDto>>
{
  public async ValueTask<Result<UserDto>> Handle(
    UpdateCurrentUserProfileCommand command,
    CancellationToken cancellationToken)
  {
    try
    {
      var user = await _repository.FirstOrDefaultAsync(
        new UserByIdWithRolesSpec(command.UserId), cancellationToken);

      if (user is null)
      {
        return Result<UserDto>.NotFound();
      }

      user.UpdateName(command.FirstName.Trim(), command.LastName.Trim());
      await _repository.UpdateAsync(user, cancellationToken);

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

      return Result<UserDto>.Success(userDto);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(UpdateCurrentUserProfileHandler), command);
      throw;
    }
  }
}
