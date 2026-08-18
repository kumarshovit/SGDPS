using PujaCollectionTracker.Core.IdentityAggregate;
using Vogen;

namespace PujaCollectionTracker.Infrastructure.Data.Config;

[EfCoreConverter<UserId>]
[EfCoreConverter<RoleId>]
[EfCoreConverter<PermissionId>]
internal partial class VogenEfCoreConverters;
