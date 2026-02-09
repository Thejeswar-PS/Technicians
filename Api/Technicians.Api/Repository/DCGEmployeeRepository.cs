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

        public DCGEmployeeRepository(IConfiguration configuration)
        {
            _configuration = configuration;

            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");

            _gpConnectionString =
                configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new InvalidOperationException("ETechGreatPlainsConnString not found");
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
            var safeSort = SafeEmployeeSort(sortBy);

            using var connection = new SqlConnection(_connectionString);

            var sql = $@"
                SELECT EmpNo, EmpID, EmpName, EmpStatus, WindowsID, Email, Country
                FROM DCG_Employees
                ORDER BY {safeSort}";

            var data = await connection.QueryAsync<DCGEmployeeDto>(sql);
            return data.ToList();
        }

        public async Task<DCGEmployeeDto?> GetDCGEmployeeByIdAsync(int empNo)
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryFirstOrDefaultAsync<DCGEmployeeDto>(
                @"SELECT EmpNo, EmpID, EmpName, EmpStatus, WindowsID, Email, Country
                  FROM DCG_Employees
                  WHERE EmpNo = @EmpNo",
                new { EmpNo = empNo });
        }

        public async Task<int> CreateDCGEmployeeAsync(CreateDCGEmployeeDto employee)
        {
            using var connection = new SqlConnection(_connectionString);

            var country = _configuration.GetValue<string>("Canada") == "Yes"
                ? "CANADA"
                : "USA";

            return await connection.QuerySingleAsync<int>(
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
        }

        public async Task<bool> UpdateDCGEmployeeAsync(UpdateDCGEmployeeDto employee)
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

            return rows > 0;
        }

        public async Task<bool> DeleteDCGEmployeeAsync(int empNo)
        {
            using var connection = new SqlConnection(_connectionString);

            var rows = await connection.ExecuteAsync(
                "DELETE FROM DCG_Employees WHERE EmpNo=@EmpNo",
                new { EmpNo = empNo });

            return rows > 0;
        }

        #endregion

        #region Office State Assignments

        public async Task<List<OfficeStateAssignmentDto>> GetOfficeStateAssignmentsAsync(string sortBy)
        {
            var safeSort = SafeOfficeSort(sortBy);

            using var connection = new SqlConnection(_gpConnectionString);

            var sql = $@"
                SELECT State, StateName, OffID, InvUserID, SubRegion
                FROM aaOfficeIDStateAssignments
                ORDER BY {safeSort}";

            var data = await connection.QueryAsync<OfficeStateAssignmentDto>(sql);
            return data.ToList();
        }

        public async Task<OfficeStateAssignmentDto?> GetOfficeStateAssignmentByStateAsync(string state)
        {
            using var connection = new SqlConnection(_gpConnectionString);

            return await connection.QueryFirstOrDefaultAsync<OfficeStateAssignmentDto>(
                @"SELECT State, StateName, OffID, InvUserID, SubRegion
                  FROM aaOfficeIDStateAssignments
                  WHERE State = @State",
                new { State = state });
        }

        public async Task<bool> CreateOfficeStateAssignmentAsync(CreateOfficeStateAssignmentDto assignment)
        {
            using var connection = new SqlConnection(_gpConnectionString);

            // Check if state already exists
            var existingRecord = await GetOfficeStateAssignmentByStateAsync(assignment.State);
            if (existingRecord != null)
            {
                throw new InvalidOperationException($"Office state assignment for state '{assignment.State}' already exists. Use update instead.");
            }

            var rows = await connection.ExecuteAsync(
                @"INSERT INTO aaOfficeIDStateAssignments
                  (State, StateName, OffID, InvUserID, SubRegion)
                  VALUES (@State, @StateName, @OffID, @InvUserID, '0')",
                assignment);

            return rows > 0;
        }

        public async Task<bool> UpdateOfficeStateAssignmentAsync(UpdateOfficeStateAssignmentDto assignment)
        {
            using var connection = new SqlConnection(_gpConnectionString);

            var rows = await connection.ExecuteAsync(
                @"UPDATE aaOfficeIDStateAssignments
                  SET StateName=@StateName,
                      OffID=@OffID,
                      InvUserID=@InvUserID
                  WHERE State=@State",
                assignment);

            return rows > 0;
        }

        public async Task<bool> DeleteOfficeStateAssignmentAsync(string state)
        {
            using var connection = new SqlConnection(_gpConnectionString);

            var rows = await connection.ExecuteAsync(
                "DELETE FROM aaOfficeIDStateAssignments WHERE State=@State",
                new { State = state });

            return rows > 0;
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
                response.OfficeAssignments =
                    await GetOfficeStateAssignmentsAsync(sortBy);
                response.SortBy = SafeOfficeSort(sortBy);
            }
            else
            {
                response.Employees =
                    await GetDCGEmployeesAsync(sortBy);
                response.SortBy = SafeEmployeeSort(sortBy);
            }

            return response;
        }

        #endregion
    }
}
