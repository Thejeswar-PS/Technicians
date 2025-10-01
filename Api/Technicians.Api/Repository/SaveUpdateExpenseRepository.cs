using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class SaveUpdateExpenseRepository
    {
        private readonly string _connectionString;

        public SaveUpdateExpenseRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<int> SaveUpdateExpenseAsync(SaveUpdateExpenseDto expense)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", expense.CallNbr);
            parameters.Add("@TechName", expense.TechName);
            parameters.Add("@ExpType", expense.ExpType);
            parameters.Add("@TravelType", expense.TravelType);
            parameters.Add("@StrtDate", expense.StrtDate);
            parameters.Add("@StrtTime", expense.StrtTime);
            parameters.Add("@EndDate", expense.EndDate);
            parameters.Add("@EndTime", expense.EndTime);
            parameters.Add("@Mileage", expense.Mileage);
            parameters.Add("@RentalCar", expense.RentalCar);
            parameters.Add("@Notes", expense.Notes);
            parameters.Add("@Purpose", expense.Purpose);
            parameters.Add("@TechPaid", expense.TechPaid);
            parameters.Add("@CompanyPaid", expense.CompanyPaid);
            parameters.Add("@Changeby", expense.Changeby);
            parameters.Add("@TableIndex", expense.TableIndex);
            parameters.Add("@TravelBy", expense.TravelBy);
            parameters.Add("@PayType", expense.PayType);
            parameters.Add("@Edit", expense.Edit);
            parameters.Add("@ImageExists", expense.ImageExists);

            // ⚡ IMPORTANT FIX:
            // Always pass at least 1 byte if ImageStream is null
            var safeImageStream = expense.ImageStream ?? new byte[] { 0x0 };
            parameters.Add("@ImageStream", safeImageStream, DbType.Binary, ParameterDirection.Input);

            int rowsAffected = await connection.ExecuteAsync(
                "SaveUpdateExpenses",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return rowsAffected;
        }
    }
}
