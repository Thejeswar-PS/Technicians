using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Technicians.Api.Repository;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Server.IIS;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<PartReqStatusRepository>();
builder.Services.AddScoped<PartReturnStatusRepository>();
builder.Services.AddScoped<OrderRequestRepository>();
builder.Services.AddScoped<OrderRequestStatusRepository>();
builder.Services.AddScoped<PartsTestRepository>();
builder.Services.AddScoped<PartsTestStatusRepository>();
builder.Services.AddScoped<StrippedUnitsStatusRepository>();
builder.Services.AddScoped<NewDisplayCallsGraphRepository>();


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
