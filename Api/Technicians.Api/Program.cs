using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Technicians.Api.Repository;

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDevClient",
        builder =>
        {
            builder.WithOrigins("http://localhost:4200","http://dcg-sql-dev:3500", "http://dcg-sql-dev:3600") // Angular dev server
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
builder.Services.AddScoped<CommonRepository>();
builder.Services.AddScoped<SaveUpdatePartsReqRepository>();
builder.Services.AddScoped<SaveUpdatePartsTechRepository>();
//builder.Services.AddScoped<PartsShipRepository>();
builder.Services.AddScoped<PartsDataRepository>();
builder.Services.AddScoped<PartsShippingDataRepository>();



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
