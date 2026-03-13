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
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<ExtranetUserClassesRepository> _logger;

        private const string LoggerName = "Technicians.ExtranetUserClassesRepository";

        public ExtranetUserClassesRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<ExtranetUserClassesRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString") ??
                throw new InvalidOperationException("ETechGreatPlainsConnString string not found in configuration");
            _errorLog = errorLog;
            _logger = logger;
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

                _logger.LogInformation("Successfully retrieved {Count} ExtranetUserClasses records", classesData.Count());
                return classesData.ToList();
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetExtranetUserClassesAsync");
                _logger.LogError(sqlEx, "SQL error retrieving ExtranetUserClasses data");
                throw new Exception($"Database error retrieving ExtranetUserClasses data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetExtranetUserClassesAsync");
                _logger.LogError(ex, "Error retrieving ExtranetUserClasses data");
                throw new Exception($"Error retrieving ExtranetUserClasses data: {ex.Message}", ex);
            }
        }

        public async Task<ExtranetUserInfoDto?> GetByLoginAsync(string login)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryFirstOrDefaultAsync<ExtranetUserInfoDto>(
                    "ExtranetUserInfo",
                    new { plogin = login },
                    commandType: CommandType.StoredProcedure);

                _logger.LogInformation("Retrieved ExtranetUserInfo for login: {Login}", login);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetByLoginAsync", login);
                _logger.LogError(sqlEx, "SQL error retrieving ExtranetUserInfo for login: {Login}", login);
                throw new Exception($"Database error while retrieving ExtranetUserInfo for login '{login}'.", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetByLoginAsync", login);
                _logger.LogError(ex, "Error retrieving ExtranetUserInfo for login: {Login}", login);
                throw new Exception($"Unexpected error while retrieving ExtranetUserInfo for login '{login}'.", ex);
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

                _logger.LogInformation("Retrieved {Count} customer numbers for login: {Login}", result.Count(), login);
                return result.ToList();
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetCustomerNumbersAsync", login);
                _logger.LogError(sqlEx, "SQL error retrieving customer numbers for login: {Login}", login);
                throw new Exception($"Database error while retrieving customer numbers for login '{login}'", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetCustomerNumbersAsync", login);
                _logger.LogError(ex, "Error retrieving customer numbers for login: {Login}", login);
                throw new Exception($"Unexpected error while retrieving customer numbers for login '{login}'", ex);
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

                _logger.LogInformation("Added customer number {CustNmbr} for login: {Login} - Result: {Result}", 
                    custNmbr, login, result);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "AddCustomerNumberAsync", $"{login}|{custNmbr}");
                _logger.LogError(sqlEx, "SQL error adding customer number {CustNmbr} for login: {Login}", custNmbr, login);
                throw new Exception($"Database error while adding customer number '{custNmbr}' for login '{login}'.", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "AddCustomerNumberAsync", $"{login}|{custNmbr}");
                _logger.LogError(ex, "Error adding customer number {CustNmbr} for login: {Login}", custNmbr, login);
                throw new Exception($"Unexpected error while adding customer number '{custNmbr}' for login '{login}'.", ex);
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

                var result = await connection.QuerySingleAsync<string>(
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

                _logger.LogInformation("Saved/updated extranet user: {Login} - Result: {Result}", login, result);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "SaveUpdateUserAsync", login);
                _logger.LogError(sqlEx, "SQL error saving/updating extranet user: {Login}", login);
                throw new Exception($"Database error while saving/updating extranet user '{login}'.", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "SaveUpdateUserAsync", login);
                _logger.LogError(ex, "Error saving/updating extranet user: {Login}", login);
                throw new Exception($"Unexpected error while saving/updating extranet user '{login}'.", ex);
            }
        }

        public async Task<int> DeleteUserAsync(string username)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.ExecuteAsync(
                    "ExtranetDeleteUser",
                    new { pUsername = username },
                    commandType: CommandType.StoredProcedure);

                _logger.LogInformation("Deleted extranet user: {Username} - Rows affected: {RowsAffected}", username, result);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "DeleteUserAsync", username);
                _logger.LogError(sqlEx, "SQL error deleting extranet user: {Username}", username);
                throw new Exception($"Database error deleting user '{username}'.", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DeleteUserAsync", username);
                _logger.LogError(ex, "Error deleting extranet user: {Username}", username);
                throw;
            }
        }

        public async Task<string> DeleteCustomerNumberAsync(string login, string custNmbr)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QuerySingleAsync<string>(
                    "ExtranetDeleteCustnmbr",
                    new
                    {
                        plogin = login,
                        pcustnmbr = custNmbr
                    },
                    commandType: CommandType.StoredProcedure);

                _logger.LogInformation("Deleted customer number {CustNmbr} for login: {Login} - Result: {Result}", 
                    custNmbr, login, result);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "DeleteCustomerNumberAsync", $"{login}|{custNmbr}");
                _logger.LogError(sqlEx, "SQL error deleting customer number {CustNmbr} for login: {Login}", custNmbr, login);
                throw new Exception($"Database error deleting customer number '{custNmbr}' for login '{login}'.", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DeleteCustomerNumberAsync", $"{login}|{custNmbr}");
                _logger.LogError(ex, "Error deleting customer number {CustNmbr} for login: {Login}", custNmbr, login);
                throw;
            }
        }
    }
}

