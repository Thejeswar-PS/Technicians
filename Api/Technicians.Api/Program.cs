using Dapper;                        
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using System.Reflection;
using System.Text.Json;
using Technicians.Api.Models;
using Technicians.Api.Repositories;
using Technicians.Api.Repository;

var builder = WebApplication.CreateBuilder(args);

static void RegisterContractNoMapping<T>()
{
    SqlMapper.SetTypeMap(
        typeof(T),
        new CustomPropertyTypeMap(
            typeof(T),
            (type, columnName) =>
            {
                if (columnName.Equals("Contract No", StringComparison.OrdinalIgnoreCase))
                    return type.GetProperty("ContractNo");

                return type.GetProperties()
                           .FirstOrDefault(p =>
                               p.Name.Equals(columnName, StringComparison.OrdinalIgnoreCase));
            }
        )
    );
}

// Register for ALL DTOs that read from @CallStatus
RegisterContractNoMapping<AccMgrCallStatusDto>();
RegisterContractNoMapping<AccMgrReturnedForProcessingDto>();
RegisterContractNoMapping<AccMgrJobsScheduledTodayDto>();
RegisterContractNoMapping<AccMgrJobsConfirmedNext120HoursDto>();
//RegisterContractNoMapping<AccMgrReturnedWithIncompleteDataDto>();


// --- Configure Logging ---
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// --- Add services ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure multipart form limits (10 MB)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB limit
});

// Configure Kestrel and IIS server limits to match multipart limit
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDevClient",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyHeader()
                   .AllowAnyMethod(); // includes GET, POST, PUT, DELETE, OPTIONS
        });
});

// --- Register your repository ---
builder.Services.AddScoped<EtechExpenseRepository>();
builder.Services.AddScoped<EquipmentDetailsRepository>();
builder.Services.AddScoped<JobRepository>();
builder.Services.AddScoped<SaveUpdateExpenseRepository>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<PreJobSafetyInfoRepository>();
builder.Services.AddScoped<PreJobSafetyListInfoRepository>();
builder.Services.AddScoped<CommonRepository>();
builder.Services.AddScoped<SaveUpdatePartsReqRepository>();
builder.Services.AddScoped<SaveUpdatePartsTechRepository>();
builder.Services.AddScoped<JobInfoRepository>();
//builder.Services.AddScoped<PartsReqDataRepository>();
//builder.Services.AddScoped<PartsShipRepository>();
builder.Services.AddScoped<PartsDataRepository>();
builder.Services.AddScoped<PartsShippingDataRepository>();
builder.Services.AddScoped<ReadingsRepository>();
builder.Services.AddScoped<TechToolsRepository>();
builder.Services.AddScoped<PartReqStatusRepository>();
builder.Services.AddScoped<PartReturnStatusRepository>();
builder.Services.AddScoped<OrderRequestRepository>();
builder.Services.AddScoped<OrderRequestStatusRepository>();
builder.Services.AddScoped<PartsTestRepository>();
builder.Services.AddScoped<PartsTestStatusRepository>();
builder.Services.AddScoped<StrippedUnitsStatusRepository>();
builder.Services.AddScoped<NewDisplayCallsGraphRepository>();
builder.Services.AddScoped<IDisplayCallsDetailRepository, DisplayCallsDetailRepository>();
builder.Services.AddScoped<IPartsSearchRepository, PartsSearchRepository>();
builder.Services.AddScoped<IAccMgrPerformanceReportRepository, AccMgrPerformanceReportRepository>();
builder.Services.AddScoped<IPastDueGraphRepository, PastDueGraphRepository>();
builder.Services.AddScoped<EmergencyJobsRepository>();
builder.Services.AddScoped<UPSTestStatusRepository>();
builder.Services.AddScoped<NewUniTestRepository>(); 
builder.Services.AddScoped<DTechUsersDataRepository>();
builder.Services.AddScoped<ExtranetUserClassesRepository>();
builder.Services.AddScoped<ToolsTrackingTechsRepository>();
builder.Services.AddScoped<DCGEmployeeRepository>(); 

var app = builder.Build();

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

// Apply CORS policy (must be between UseRouting and UseAuthorization)
app.UseCors("AllowAngularDevClient");
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers(); // Important: maps your API controllers

// --- Run app ---
Log.Information("Application starting...");
app.Run();
