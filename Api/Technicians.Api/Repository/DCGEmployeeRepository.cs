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

        // ADDED: Authentication methods
        Task<DCGEmployeeDto?> AuthenticateEmployeeAsync(string empID, string password);
        Task<bool> ChangePasswordAsync(int empNo, string currentPassword, string newPassword);

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
                "EmpNo", "EmpID", "EmpName", "Department", "EmpStatus", "WindowsID", "Email", "Country"
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

        #region DCG Employees

        public async Task<List<DCGEmployeeDto>> GetDCGEmployeesAsync(string sortBy)
        {
            try
            {
                var safeSort = SafeEmployeeSort(sortBy);

                using var connection = new SqlConnection(_connectionString);

                var sql = $@"
                    SELECT EmpNo, EmpID, EmpName, Department, EmpStatus, WindowsID, Email, Country, Password, ModifiedOn
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
                    @"SELECT EmpNo, EmpID, EmpName, Department, EmpStatus, WindowsID, Email, Country, Password, ModifiedOn
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

                var country = GetCountrySetting();

                // UPDATED: Store password as plain text (no hashing)
                var newEmpNo = await connection.QuerySingleAsync<int>(
                    @"INSERT INTO DCG_Employees
                      (EmpID, EmpName, Department, EmpStatus, WindowsID, Email, Country, Password, ModifiedOn)
                      VALUES (@EmpID, @EmpName, @Department, @EmpStatus, @WindowsID, @Email, @Country, @Password, GETDATE());
                      SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        employee.EmpID,
                        employee.EmpName,
                        employee.Department,
                        employee.EmpStatus,
                        employee.WindowsID,
                        employee.Email,
                        Country = country,
                        Password = employee.Password  // CHANGED: Plain text password
                    });

                _logger.LogInformation("Created DCG employee - EmpID: {EmpID}, EmpName: {EmpName}, Department: {Department}, NewEmpNo: {NewEmpNo}", 
                    employee.EmpID, employee.EmpName, employee.Department, newEmpNo);
                return newEmpNo;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "CreateDCGEmployeeAsync", $"{employee.EmpID}|{employee.EmpName}|{employee.Department}");
                _logger.LogError(sqlEx, "SQL error creating DCG employee - EmpID: {EmpID}, EmpName: {EmpName}, Department: {Department}", 
                    employee.EmpID, employee.EmpName, employee.Department);
                throw new Exception($"Database error creating DCG employee: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "CreateDCGEmployeeAsync", $"{employee.EmpID}|{employee.EmpName}|{employee.Department}");
                _logger.LogError(ex, "Error creating DCG employee - EmpID: {EmpID}, EmpName: {EmpName}, Department: {Department}", 
                    employee.EmpID, employee.EmpName, employee.Department);
                throw;
            }
        }

        public async Task<bool> UpdateDCGEmployeeAsync(UpdateDCGEmployeeDto employee)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // Build dynamic UPDATE query based on whether password is provided
                string sql;
                object parameters;

                if (!string.IsNullOrEmpty(employee.Password))
                {
                    // ? SERVER-SIDE VALIDATION: Reject empty passwords when updating
                    if (string.IsNullOrWhiteSpace(employee.Password))
                    {
                        _logger.LogWarning("Attempted to update DCG employee with empty password - EmpNo: {EmpNo}, EmpID: {EmpID}", 
                            employee.EmpNo, employee.EmpID);
                        throw new ArgumentException("Password cannot be empty or whitespace only when provided.", nameof(employee.Password));
                    }

                    // Update with password (plain text)
                    sql = @"UPDATE DCG_Employees
                           SET EmpID=@EmpID,
                               EmpName=@EmpName,
                               Department=@Department,
                               EmpStatus=@EmpStatus,
                               WindowsID=@WindowsID,
                               Email=@Email,
                               Password=@Password,
                               ModifiedOn=GETDATE()
                           WHERE EmpNo=@EmpNo";
                    
                    parameters = new
                    {
                        employee.EmpNo,
                        employee.EmpID,
                        employee.EmpName,
                        employee.Department,
                        employee.EmpStatus,
                        employee.WindowsID,
                        employee.Email,
                        Password = employee.Password  // CHANGED: Plain text password
                    };
                }
                else
                {
                    // Update without changing password
                    sql = @"UPDATE DCG_Employees
                           SET EmpID=@EmpID,
                               EmpName=@EmpName,
                               Department=@Department,
                               EmpStatus=@EmpStatus,
                               WindowsID=@WindowsID,
                               Email=@Email,
                               ModifiedOn=GETDATE()
                           WHERE EmpNo=@EmpNo";
                    
                    parameters = new
                    {
                        employee.EmpNo,
                        employee.EmpID,
                        employee.EmpName,
                        employee.Department,
                        employee.EmpStatus,
                        employee.WindowsID,
                        employee.Email
                    };
                }

                var rows = await connection.ExecuteAsync(sql, parameters);

                var success = rows > 0;
                _logger.LogInformation("Updated DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}, Department: {Department}, Success: {Success}, PasswordUpdated: {PasswordUpdated}", 
                    employee.EmpNo, employee.EmpID, employee.Department, success, !string.IsNullOrEmpty(employee.Password));
                return success;
            }
            catch (ArgumentException)
            {
                // Re-throw validation exceptions without logging as errors
                throw;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "UpdateDCGEmployeeAsync", $"{employee.EmpNo}|{employee.EmpID}|{employee.Department}");
                _logger.LogError(sqlEx, "SQL error updating DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}, Department: {Department}", 
                    employee.EmpNo, employee.EmpID, employee.Department);
                throw new Exception($"Database error updating DCG employee: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UpdateDCGEmployeeAsync", $"{employee.EmpNo}|{employee.EmpID}|{employee.Department}");
                _logger.LogError(ex, "Error updating DCG employee - EmpNo: {EmpNo}, EmpID: {EmpID}, Department: {Department}", 
                    employee.EmpNo, employee.EmpID, employee.Department);
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

        #region Helpers

        private static string SafeEmployeeSort(string sortBy) =>
            EmployeeSortColumns.Contains(sortBy) ? sortBy : "EmpName";

        private static string SafeOfficeSort(string sortBy) =>
            OfficeSortColumns.Contains(sortBy) ? sortBy : "State";

        /// <summary>
        /// Gets country setting from configuration - matches legacy ConfigurationManager.AppSettings["Canada"]
        /// </summary>
        private string GetCountrySetting()
        {
            var canadaSetting = _configuration.GetValue<string>("Canada");
            return canadaSetting?.Equals("Yes", StringComparison.OrdinalIgnoreCase) == true ? "CANADA" : "USA";
        }

        #endregion

        #region Authentication

        /// <summary>
        /// Authenticate employee using EmpID and password (plain text comparison)
        /// </summary>
        public async Task<DCGEmployeeDto?> AuthenticateEmployeeAsync(string empID, string password)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var employee = await connection.QueryFirstOrDefaultAsync<DCGEmployeeDto>(
                    @"SELECT EmpNo, EmpID, EmpName, Department, EmpStatus, WindowsID, Email, Country, Password, ModifiedOn
                      FROM DCG_Employees
                      WHERE EmpID = @EmpID AND EmpStatus = 'Active'",
                    new { EmpID = empID });

                // CHANGED: Simple plain text password comparison
                if (employee != null && employee.Password == password)
                {
                    _logger.LogInformation("Successfully authenticated employee: {EmpID}", empID);
                    // Don't return password in the result for security
                    employee.Password = string.Empty;
                    return employee;
                }

                _logger.LogWarning("Authentication failed for employee: {EmpID}", empID);
                return null;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "AuthenticateEmployeeAsync", empID);
                _logger.LogError(ex, "Error authenticating employee: {EmpID}", empID);
                throw;
            }
        }

        /// <summary>
        /// Change employee password (plain text)
        /// </summary>
        public async Task<bool> ChangePasswordAsync(int empNo, string currentPassword, string newPassword)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // Get current employee data
                var employee = await connection.QueryFirstOrDefaultAsync<DCGEmployeeDto>(
                    @"SELECT EmpNo, EmpID, Password FROM DCG_Employees WHERE EmpNo = @EmpNo",
                    new { EmpNo = empNo });

                if (employee == null)
                {
                    _logger.LogWarning("Employee not found for password change: {EmpNo}", empNo);
                    return false;
                }

                // CHANGED: Simple plain text password comparison
                if (employee.Password != currentPassword)
                {
                    _logger.LogWarning("Current password verification failed for employee: {EmpNo}", empNo);
                    return false;
                }

                // CHANGED: Store new password as plain text
                var rows = await connection.ExecuteAsync(
                    @"UPDATE DCG_Employees 
                      SET Password = @Password, ModifiedOn = GETDATE() 
                      WHERE EmpNo = @EmpNo",
                    new { Password = newPassword, EmpNo = empNo });

                var success = rows > 0;
                _logger.LogInformation("Password change for employee {EmpNo}: {Success}", empNo, success ? "Success" : "Failed");
                return success;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "ChangePasswordAsync", empNo.ToString());
                _logger.LogError(ex, "Error changing password for employee: {EmpNo}", empNo);
                throw;
            }
        }

        #endregion
    }
}
