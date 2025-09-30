////using SM.Domain.IEntity;
//using Microsoft.AspNetCore.Authorization.Infrastructure;
//using Microsoft.AspNetCore.Authorization;

//namespace Technicians.Api.Authentication
//{
//    public class CustomAuthorizationHandler : AuthorizationHandler<ClaimsAuthorizationRequirement>, IAuthorizationHandler
//    {
//        private readonly ICurrentUser _currentUser;

//        public CustomAuthorizationHandler(ICurrentUser currentUser)
//        {
//            _currentUser = currentUser;
//        }

//        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context,
//            ClaimsAuthorizationRequirement requirement)
//        {
//            if (context.User == null || !context.User.Identity.IsAuthenticated)
//            {
//                context.Fail();
//                return;
//            }

//            var claims = new List<string>();
//            try
//            {
//                //var id = context.User.GetGroupId();
//                //claims.AddRange(await _groupService.GetPermissionsByGroupId(id));
//                //claims.AddRange(DefaultPermissions.All());
//                //_currentUser.Claims.AddRange(claims.Select(x => new Claim(DrishtiClaimType.Permission, x)));
//            }
//            catch (Exception ex)
//            {

//                context.Fail();
//                return;
//            }

//            if (requirement.AllowedValues.Any(item => !claims.Contains(item)))
//            {
//                context.Fail();
//                return;
//            }
//            context.Succeed(requirement);
//        }
//    }
//}
