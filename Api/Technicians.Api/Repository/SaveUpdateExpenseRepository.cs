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

        public async Task SaveOrUpdateExpenseAsync(SaveUpdateExpenseDto req)
        {
            using SqlConnection con = new SqlConnection(_connectionString);
            using SqlCommand cmd = new SqlCommand("SaveUpdateExpenses", con)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@CallNbr", req.CallNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TechName", req.TechName ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ExpType", req.ExpType);
            cmd.Parameters.AddWithValue("@TravelType", req.TravelType);
            cmd.Parameters.AddWithValue("@StrtDate", req.StrtDate);
            cmd.Parameters.AddWithValue("@StrtTime", req.StrtTime);
            cmd.Parameters.AddWithValue("@EndDate", req.EndDate);
            cmd.Parameters.AddWithValue("@EndTime", req.EndTime);
            cmd.Parameters.AddWithValue("@Mileage", req.Mileage);
            cmd.Parameters.AddWithValue("@RentalCar", req.RentalCar);
            cmd.Parameters.AddWithValue("@Notes", req.Notes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Purpose", req.Purpose);
            cmd.Parameters.AddWithValue("@TechPaid", req.TechPaid);
            cmd.Parameters.AddWithValue("@CompanyPaid", req.CompanyPaid);
            cmd.Parameters.AddWithValue("@Changeby", req.Changeby ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TableIndex", req.TableIndex);
            cmd.Parameters.AddWithValue("@TravelBy", req.TravelBy);
            cmd.Parameters.AddWithValue("@PayType", req.PayType);
            cmd.Parameters.AddWithValue("@Edit", req.Edit);
            cmd.Parameters.AddWithValue("@ImageExists", req.ImageExists);
            cmd.Parameters.Add("@ImageStream", SqlDbType.Image).Value = (object)req.ImageStream ?? DBNull.Value;


            await con.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
