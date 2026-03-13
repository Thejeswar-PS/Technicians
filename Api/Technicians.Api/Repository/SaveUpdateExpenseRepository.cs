using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class SaveUpdateExpenseRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<SaveUpdateExpenseRepository> _logger;

        private const string LoggerName = "Technicians.SaveUpdateExpenseRepository";

        public SaveUpdateExpenseRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<SaveUpdateExpenseRepository> logger)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("DefaultConnection");
            _errorLog = errorLog;
            _logger = logger;
        }

        public async Task SaveOrUpdateExpenseAsync(SaveUpdateExpenseDto req)
        {
            try
            {
                await using SqlConnection con = new SqlConnection(_connectionString);
                await using SqlCommand cmd = new SqlCommand("SaveUpdateExpenses", con)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", (object?)req.CallNbr ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TechName", (object?)req.TechName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ExpType", (object?)req.ExpType ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TravelType", (object?)req.TravelType ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@StrtDate", (object?)req.StrtDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@StrtTime", (object?)req.StrtTime ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@EndDate", (object?)req.EndDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@EndTime", (object?)req.EndTime ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Mileage", (object?)req.Mileage ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RentalCar", req.RentalCar);
                cmd.Parameters.AddWithValue("@Notes", (object?)req.Notes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Purpose", (object?)req.Purpose ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TechPaid", req.TechPaid);
                cmd.Parameters.AddWithValue("@CompanyPaid", req.CompanyPaid);
                cmd.Parameters.AddWithValue("@Changeby", (object?)req.Changeby ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TableIndex", req.TableIdx);
                cmd.Parameters.AddWithValue("@TravelBy", (object?)req.TravelBy ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PayType", (object?)req.PayType ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Edit", (object?)req.Edit ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ImageExists", req.ImageExists);
                cmd.Parameters.Add("@ImageStream", SqlDbType.Image).Value = (object?)req.ImageStream ?? DBNull.Value;

                await con.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                _logger.LogInformation("Successfully saved/updated expense for CallNbr: {CallNbr}, TechName: {TechName}",
                    req.CallNbr, req.TechName);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "SaveOrUpdateExpenseAsync", req.CallNbr ?? "");
                _logger.LogError(ex, "Error saving/updating expense for CallNbr: {CallNbr}, TechName: {TechName}",
                    req.CallNbr, req.TechName);
                throw new Exception($"Failed to save or update expense: {ex.Message}", ex);
            }
        }
    }
}
