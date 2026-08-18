using Vogen;

namespace PujaCollectionTracker.Core.IdentityAggregate;

[ValueObject<int>]
public readonly partial struct RoleId
{
  private static Validation Validate(int value)
      => value > 0
          ? Validation.Ok
          : Validation.Invalid("RoleId must be positive.");
}
