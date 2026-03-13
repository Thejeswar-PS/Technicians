using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface IDCGEmployeeRepository
    {
        // DCG Employees
        Task<List<DCGEmployeeDto>> GetDCGEmployeesAsync(string sortBy);
        Task<DCGEmployeeDto?> GetDCGEmployeeByIdAsync(int empNo);
        Task<int> CreateDCGEmployeeAsync(CreateDCGEmployeeDto employee);
        Task<bool> UpdateDCGEmployeeAsync(UpdateDCGEmployeeDto employee);
        Task<bool> DeleteDCGEmployeeAsync(int empNo);

        // Office State Assignments
        Task<List<OfficeStateAssignmentDto>> GetOfficeStateAssignmentsAsync(string sortBy);
        Task<OfficeStateAssignmentDto?> GetOfficeStateAssignmentByStateAsync(string state);
        Task<bool> CreateOfficeStateAssignmentAsync(CreateOfficeStateAssignmentDto assignment);
        Task<bool> UpdateOfficeStateAssignmentAsync(UpdateOfficeStateAssignmentDto assignment);
        Task<bool> DeleteOfficeStateAssignmentAsync(string state);

        // Combined
        Task<DCGEmpDetailsResponse> GetDCGEmpDetailsAsync(string gridType, string sortBy);
    }

    public class DCGEmployeeRepository : IDCGEmployeeRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpConnectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<DCGEmployeeRepository> _logger;

        private const string LoggerName = "Technicians.DCGEmployeeRepository";

        private static readonly HashSet<string> EmployeeSortColumns =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "EmpNo", "EmpID", "EmpName", "EmpStatus", "WindowsID", "Email", "Country"
            };

        private static readonly HashSet<string> OfficeSortColumns =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "State", "StateName", "OffID", "InvUserID", "SubRegion"
            };

        public DCGEmployeeRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<DCGEmployeeRepository> logger)
        {
            _configuration = configuration;
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
            _gpConnectionString =
                configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new InvalidOperationException("ETechGreatPlainsConnString not found");
            _errorLog = errorLog;
            _logger = logger;
        }

        #region Helpers

        private static string SafeEmployeeSort(string sortBy) =>
            EmployeeSortColumns.Contains(sortBy) ? sortBy : "EmpName";

        private static string SafeOfficeSort(string sortBy) =>
            OfficeSortColumns.Contains(sortBy) ? sortBy : "State";

        #endregion

        #region DCG Employees

        public async Task<List<DCGEmployeeDto>> GetDCGEmployeesAsync(string sortBy)
        {
            try
            {
                var safeSort = SafeEmployeeSort(sortBy);

                using var connection = new SqlConnection(_connectionString);

                var sql = $@"
                    SELECT EmpNo, EmpID, EmpName, EmpStatus, WindowsID, Email, Country
                    FROM DCG_Employees
                    ORDER BY {safeSort}";

                var data = await connection.QueryAsync<DCGEmployeeDto>(sql);
                var result = data.ToList();

                _logger.LogInformation("Retrieved {Count} DCG employees sorted by: {SortBy}", result.Count, safeSort);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetDCGEmployeesAsync", sortBy);
                _logger.LogError(sqlEx, "SQL error retrieving DCG employees with sort: {SortBy}", sortBy);
                throw new Exception($"Database error retrieving DCG employees: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetDCGEmployeesAsync", sortBy);
                _logger.LogError(ex, "Error retrieving DCG employees with sort: {SortBy}", sortBy);
                throw;
            }
        }

        public async Task<DCGEmployeeDto?> GetDCGEmployeeByIdAsync(int empNo)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryFirstOrDefaultAsync<DCGEmployeeDto>(
                    @"SELECT EmpNo, EmpID, EmpName, EmpStatus, WindowsID, Email, Country
                      FROM DCG_Employees
                      WHERE EmpNo = @EmpNo",
                    new { EmpNo = empNo });

                _logger.LogInformation("Retrieved DCG employee by ID: {EmpNo} - Found: {Found}", empNo, result != null);
                return result;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetDCGEmployeeByIdAsync", empNo.ToString());
                _logger.LogError(ex, "Error retrieving DCG employee by ID: {EmpNo}", empNo);
                throw;
            }
        }

        public async Task<int> CreateDCGEmployeeAsync(CreateDCGEmployeeDto employee)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var country = _configuration.GetValue<string>("Canada") == "Yes"
                    ? "CANADA"
                    : "USA";

                var newEmpNo = await connection.QuerySingleAsync<int>(
                    @"INSERT INTO DCG_Employees
                      (EmpID, EmpName, EmpStatus, WindowsID, Email, Country)
                      VALUES (@EmpID, @EmpName, @EmpStatus, @WindowsID, @Email, @Country);
                      SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        employee.EmpID,
                        employee.EmpName,
                        employee.EmpStatus,
                        employee.WindowsID,
                        employee.Email,
                        Country = country
                    });

                _logger.LogInformation("Created DCG employee - EmpID: {EmpID}, EmpName: {EmpName}, NewEmpNo: {NewEmpNo}", 
                    employee.EmpID, employee.EmpName, newEmpNo);
                return newEmpNo;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "CreateDCGEmployeeAsync", $"{employee.EmpID}|{employee.EmpName}");
                _logger.LogError(sqlEx, "SQL error creating DCG employee - EmpID: {EmpID}, EmpName: {EmpName}", 
                    employee.EmpID, employee.EmpName);
                throw new Exception($"Database error creating DCG employee: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "CreateDCGEmployeeAsync", $"{employee.EmpID}|{employee.EmpName}");
                _logger.LogError(ex, "Error creating DCG employee - EmpID: {EmpID}, EmpName: {EmpName}", 
                    employee.EmpID, employee.EmpName);
                throw;
            }
        }

        public async Task<bool> UpdateDCGEmployeeAsync(UpdateDCGEmployeeDto employee)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var rows = await connection.ExecuteAsync(
                    @"UPDATE DCG_Employees
                      SET EmpID=@EmpID,
                          EmpName=@EmpName,
                          EmpStatus=@EmpStatus,
                          WindowsID=@WindowsID,
                          Email=@Email
                      WHERE EmpNo=@EmpNo",
                    employee);

                var success = rows > 0;
                _logger.LogInformation("Updated DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}, Success: {Success}", 
                    employee.EmpNo, employee.EmpID, success);
                return success;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "UpdateDCGEmployeeAsync", $"{employee.EmpNo}|{employee.EmpID}");
                _logger.LogError(sqlEx, "SQL error updating DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}", 
                    employee.EmpNo, employee.EmpID);
                throw new Exception($"Database error updating DCG employee: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UpdateDCGEmployeeAsync", $"{employee.EmpNo}|{employee.EmpID}");
                _logger.LogError(ex, "Error updating DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}", 
                    employee.EmpNo, employee.EmpID);
                throw;
            }
        }

        public async Task<bool> DeleteDCGEmployeeAsync(int empNo)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var rows = await connection.ExecuteAsync(
                    "DELETE FROM DCG_Employees WHERE EmpNo=@EmpNo",
                    new { EmpNo = empNo });

                var success = rows > 0;
                _logger.LogInformation("Deleted DCG employee - EmpNo: {EmpNo}, Success: {Success}", empNo, success);
                return success;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "DeleteDCGEmployeeAsync", empNo.ToString());
                _logger.LogError(sqlEx, "SQL error deleting DCG employee - EmpNo: {EmpNo}", empNo);
                throw new Exception($"Database error deleting DCG employee: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DeleteDCGEmployeeAsync", empNo.ToString());
                _logger.LogError(ex, "Error deleting DCG employee - EmpNo: {EmpNo}", empNo);
                throw;
            }
        }

        #endregion

        #region Office State Assignments

        public async Task<List<OfficeStateAssignmentDto>> GetOfficeStateAssignmentsAsync(string sortBy)
        {
            try
            {
                var safeSort = SafeOfficeSort(sortBy);

                using var connection = new SqlConnection(_gpConnectionString);

                var sql = $@"
                    SELECT State, StateName, OffID, InvUserID, SubRegion
                    FROM aaOfficeIDStateAssignments
                    ORDER BY {safeSort}";

                var data = await connection.QueryAsync<OfficeStateAssignmentDto>(sql);
                var result = data.ToList();

                _logger.LogInformation("Retrieved {Count} office state assignments sorted by: {SortBy}", result.Count, safeSort);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetOfficeStateAssignmentsAsync", sortBy);
                _logger.LogError(sqlEx, "SQL error retrieving office state assignments with sort: {SortBy}", sortBy);
                throw new Exception($"Database error retrieving office state assignments: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetOfficeStateAssignmentsAsync", sortBy);
                _logger.LogError(ex, "Error retrieving office state assignments with sort: {SortBy}", sortBy);
                throw;
            }
        }

        public async Task<OfficeStateAssignmentDto?> GetOfficeStateAssignmentByStateAsync(string state)
        {
            try
            {
                using var connection = new SqlConnection(_gpConnectionString);

                var result = await connection.QueryFirstOrDefaultAsync<OfficeStateAssignmentDto>(
                    @"SELECT State, StateName, OffID, InvUserID, SubRegion
                      FROM aaOfficeIDStateAssignments
                      WHERE State = @State",
                    new { State = state });

                _logger.LogInformation("Retrieved office state assignment for State: {State} - Found: {Found}", state, result != null);
                return result;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetOfficeStateAssignmentByStateAsync", state);
                _logger.LogError(ex, "Error retrieving office state assignment for State: {State}", state);
                throw;
            }
        }

        public async Task<bool> CreateOfficeStateAssignmentAsync(CreateOfficeStateAssignmentDto assignment)
        {
            try
            {
                // Check if state already exists
                var existingRecord = await GetOfficeStateAssignmentByStateAsync(assignment.State);
                if (existingRecord != null)
                {
                    throw new InvalidOperationException($"Office state assignment for state '{assignment.State}' already exists. Use update instead.");
                }

                using var connection = new SqlConnection(_gpConnectionString);

                var rows = await connection.ExecuteAsync(
                    @"INSERT INTO aaOfficeIDStateAssignments
                      (State, StateName, OffID, InvUserID, SubRegion)
                      VALUES (@State, @StateName, @OffID, @InvUserID, '0')",
                    assignment);

                var success = rows > 0;
                _logger.LogInformation("Created office state assignment - State: {State}, StateName: {StateName}, Success: {Success}", 
                    assignment.State, assignment.StateName, success);
                return success;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "CreateOfficeStateAssignmentAsync", $"{assignment.State}|{assignment.StateName}");
                _logger.LogError(sqlEx, "SQL error creating office state assignment - State: {State}, StateName: {StateName}", 
                    assignment.State, assignment.StateName);
                throw new Exception($"Database error creating office state assignment: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "CreateOfficeStateAssignmentAsync", $"{assignment.State}|{assignment.StateName}");
                _logger.LogError(ex, "Error creating office state assignment - State: {State}, StateName: {StateName}", 
                    assignment.State, assignment.StateName);
                throw;
            }
        }

        public async Task<bool> UpdateOfficeStateAssignmentAsync(UpdateOfficeStateAssignmentDto assignment)
        {
            try
            {
                using var connection = new SqlConnection(_gpConnectionString);

                var rows = await connection.ExecuteAsync(
                    @"UPDATE aaOfficeIDStateAssignments
                      SET StateName=@StateName,
                          OffID=@OffID,
                          InvUserID=@InvUserID
                      WHERE State=@State",
                    assignment);

                var success = rows > 0;
                _logger.LogInformation("Updated office state assignment - State: {State}, StateName: {StateName}, Success: {Success}", 
                    assignment.State, assignment.StateName, success);
                return success;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "UpdateOfficeStateAssignmentAsync", $"{assignment.State}|{assignment.StateName}");
                _logger.LogError(sqlEx, "SQL error updating office state assignment - State: {State}, StateName: {StateName}", 
                    assignment.State, assignment.StateName);
                throw new Exception($"Database error updating office state assignment: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UpdateOfficeStateAssignmentAsync", $"{assignment.State}|{assignment.StateName}");
                _logger.LogError(ex, "Error updating office state assignment - State: {State}, StateName: {StateName}", 
                    assignment.State, assignment.StateName);
                throw;
            }
        }

        public async Task<bool> DeleteOfficeStateAssignmentAsync(string state)
        {
            try
            {
                using var connection = new SqlConnection(_gpConnectionString);

                var rows = await connection.ExecuteAsync(
                    "DELETE FROM aaOfficeIDStateAssignments WHERE State=@State",
                    new { State = state });

                var success = rows > 0;
                _logger.LogInformation("Deleted office state assignment - State: {State}, Success: {Success}", state, success);
                return success;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "DeleteOfficeStateAssignmentAsync", state);
                _logger.LogError(sqlEx, "SQL error deleting office state assignment - State: {State}", state);
                throw new Exception($"Database error deleting office state assignment: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DeleteOfficeStateAssignmentAsync", state);
                _logger.LogError(ex, "Error deleting office state assignment - State: {State}", state);
                throw;
            }
        }

        #endregion

        #region Combined

        public async Task<DCGEmpDetailsResponse> GetDCGEmpDetailsAsync(string gridType, string sortBy)
        {
            var response = new DCGEmpDetailsResponse
            {
                GridType = gridType
            };

            if (gridType == "I")
            {
                response.OfficeAssignments = await GetOfficeStateAssignmentsAsync(sortBy);
                response.SortBy = SafeOfficeSort(sortBy);
            }
            else
            {
                response.Employees = await GetDCGEmployeesAsync(sortBy);
                response.SortBy = SafeEmployeeSort(sortBy);
            }

            return response;
        }

        #endregion
    }
}
