using Vogen;

namespace PujaCollectionTracker.Core.IdentityAggregate;

[ValueObject<int>]
public readonly partial struct PermissionId
{
  private static Validation Validate(int value)
      => value > 0
          ? Validation.Ok
          : Validation.Invalid("PermissionId must be positive.");
}
