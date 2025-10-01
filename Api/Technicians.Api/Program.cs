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

// --- Register your repository ---
builder.Services.AddScoped<EtechExpenseRepository>();
builder.Services.AddScoped<EquipmentDetailsRepository>();
builder.Services.AddScoped<JobRepository>();
builder.Services.AddScoped<UserRepository>();

var app = builder.Build();

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers(); // Important: maps your API controllers

// --- Run app ---
Log.Information("Application starting...");
app.Run();
