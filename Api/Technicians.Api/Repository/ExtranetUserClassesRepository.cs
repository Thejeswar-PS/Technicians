using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class ExtranetUserClassesRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public ExtranetUserClassesRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("ETechConnString") ??
                throw new InvalidOperationException("ETechConnString string not found in configuration");
        }

        /// <summary>
        /// Gets ExtranetUserClasses data using the ExtranetUserClasses stored procedure
        /// </summary>
        public async Task<List<ExtranetUserClassesDto>> GetExtranetUserClassesAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Execute the stored procedure (no parameters needed currently)
                var classesData = await connection.QueryAsync<ExtranetUserClassesDto>(
                    "ExtranetUserClasses",
                    commandType: CommandType.StoredProcedure);

                return classesData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving ExtranetUserClasses data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving ExtranetUserClasses data: {ex.Message}", ex);
            }
        }

        public async Task<ExtranetUserInfoDto?> GetByLoginAsync(string login)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                return await connection.QueryFirstOrDefaultAsync<ExtranetUserInfoDto>(
                    "ExtranetUserInfo",
                    new { plogin = login },
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex)
            {
                // Database-specific errors
                throw new Exception(
                    $"Database error while retrieving ExtranetUserInfo for login '{login}'.",
                    ex);
            }
            catch (Exception ex)
            {
                // Any other unexpected errors
                throw new Exception(
                    $"Unexpected error while retrieving ExtranetUserInfo for login '{login}'.",
                    ex);
            }
        }


        public async Task<List<ExtranetCustNumbersDto>> GetCustomerNumbersAsync(string login)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var result = await connection.QueryAsync<ExtranetCustNumbersDto>(
                    "ExtranetCustNumbers",
                    new { plogin = login },
                    commandType: CommandType.StoredProcedure);

                return result.ToList();
            }
            catch (SqlException ex)
            {
                throw new Exception(
                    $"Database error while retrieving customer numbers for login '{login}'",
                    ex);
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Unexpected error while retrieving customer numbers for login '{login}'",
                    ex);
            }
        }

        public async Task<string> AddCustomerNumberAsync(string login, string custNmbr)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // SP returns a single string column (ActionPerformed)
                var result = await connection.QuerySingleAsync<string>(
                    "ExtranetAddCustnmbr",
                    new
                    {
                        plogin = login,
                        pcustnmbr = custNmbr
                    },
                    commandType: CommandType.StoredProcedure);

                return result;
            }
            catch (SqlException ex)
            {
                throw new Exception(
                    $"Database error while adding customer number '{custNmbr}' for login '{login}'.",
                    ex);
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Unexpected error while adding customer number '{custNmbr}' for login '{login}'.",
                    ex);
            }
        }

        public async Task<string> SaveUpdateUserAsync(
             string login,
             string password,
             string classId,
             string customerName,
             string contactName,
             string address1,
             string address2,
             string city,
             string state,
             string zip,
             string phone,
             string email,
             bool viewFinancial,
             bool underContract)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                return await connection.QuerySingleAsync<string>(
                    "ExtranetDCGSaveUpdateUser",
                    new
                    {
                        plogin = login,
                        ppassword = password,
                        pclassid = classId,
                        pcustomername = customerName,
                        pcontactname = contactName,
                        paddress1 = address1,
                        paddress2 = address2,
                        pcity = city,
                        pstate = state,
                        pzip = zip,
                        pphone = phone,
                        pemail = email,
                        pviewfinancial = viewFinancial ? 1 : 0,
                        undercontract = underContract ? 1 : 0
                    },
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex)
            {
                throw new Exception(
                    $"Database error while saving/updating extranet user '{login}'.",
                    ex);
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Unexpected error while saving/updating extranet user '{login}'.",
                    ex);
            }
        }

        public async Task<int> DeleteUserAsync(string username)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                return await connection.ExecuteAsync(
                    "ExtranetDeleteUser",
                    new { pUsername = username },
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex)
            {
                throw new Exception(
                    $"Database error deleting user '{username}'.", ex);
            }
        }

        public async Task<string> DeleteCustomerNumberAsync(string login, string custNmbr)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                return await connection.QuerySingleAsync<string>(
                    "ExtranetDeleteCustnmbr",
                    new
                    {
                        plogin = login,
                        pcustnmbr = custNmbr
                    },
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex)
            {
                throw new Exception(
                    $"Database error deleting customer number '{custNmbr}' for login '{login}'.",
                    ex);
            }
        }


    }

}

