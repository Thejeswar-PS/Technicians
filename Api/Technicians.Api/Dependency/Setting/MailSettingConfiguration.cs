////using SM.Domain.Constant;
////using SM.Domain.Settings;

//namespace Technicians.Api.Dependency.Setting
//{
//    public static class MailSettingConfiguration
//    {
//        public static IServiceCollection AddMailSettingService(this IServiceCollection services, IConfiguration configuration)
//        {
//            var mailSettings = configuration.GetSection(ConfigOptions.MailSettingsConfigName).Get<MailSettings>();
//            services.AddSingleton(mailSettings);

//            return services;
//        }
//    }
//}
