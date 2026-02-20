using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsTestRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public PartsTestRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets parts test list data using the appropriate stored procedure based on source
        /// </summary>
        /// <param name="rowIndex">Row index parameter for the stored procedure</param>
        /// <param name="source">Source type: "PartsTest", "OrderRequest", or other for "GetNewUniTestList"</param>
        /// <returns>DataSet containing the results</returns>
        public async Task<DataSet> GetPartsTestListAsync(int rowIndex, string source)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Determine stored procedure name based on source
                string storedProcedureName = source switch
                {
                    "PartsTest" => "GetPartsTestList",
                    "OrderRequest" => "GetOrderRequestList",
                    _ => "GetNewUniTestList"
                };

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", rowIndex, DbType.Int32);

                using var command = new SqlCommand(storedProcedureName, connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@RowIndex", rowIndex);

                using var adapter = new SqlDataAdapter(command);
                var dataSet = new DataSet();
                adapter.Fill(dataSet);

                return dataSet;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving parts test list for source '{source}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets parts test list data with default row index
        /// </summary>
        /// <param name="source">Source type: "PartsTest", "OrderRequest", or other for "GetNewUniTestList"</param>
        /// <returns>DataSet containing the results</returns>
        public async Task<DataSet> GetPartsTestListAsync(string source)
        {
            return await GetPartsTestListAsync(0, source);
        }

        /// <summary>
        /// Gets the maximum test row index from PartsTestList table
        /// </summary>
        /// <returns>The next available row index (max + 1, or 1 if no records exist)</returns>
        public async Task<int> GetMaxTestRowIndexAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                string cmdText = "SELECT ISNULL(MAX(RowIndex) + 1, 1) FROM PartsTestList";
                using var command = new SqlCommand(cmdText, connection);
                
                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving maximum test row index: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Saves or updates a parts test list entry using the SaveUpdatePartsTestList stored procedure
        /// </summary>
        /// <param name="dto">The parts test data to save or update</param>
        /// <returns>Task representing the async operation</returns>
        public async Task SaveUpdatePartsTestListAsync(SaveUpdatePartsTestDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@JobFrom", dto.JobFrom, DbType.String, size: 12);
                parameters.Add("@CallNbr", dto.CallNbr, DbType.String, size: 21);
                parameters.Add("@SiteID", dto.SiteID, DbType.String, size: 50);
                parameters.Add("@Make", dto.Make, DbType.String, size: 50);
                parameters.Add("@Model", dto.Model, DbType.String, size: 50);
                parameters.Add("@ManufPartNo", dto.ManufPartNo, DbType.String, size: 50);
                parameters.Add("@DCGPartNo", dto.DCGPartNo, DbType.String, size: 50);
                parameters.Add("@SerialNo", dto.SerialNo, DbType.String, size: 50);
                parameters.Add("@Quantity", dto.Quantity, DbType.Int32);
                parameters.Add("@WorkType", dto.WorkType, DbType.String, size: 500);
                parameters.Add("@Description", dto.Description, DbType.String, size: 500);
                parameters.Add("@Priority", dto.Priority, DbType.AnsiStringFixedLength, size: 15);
                parameters.Add("@AssignedTo", dto.AssignedTo, DbType.String, size: 50);
                parameters.Add("@DueDate", dto.DueDate, DbType.DateTime);
                parameters.Add("@KVA", dto.KVA, DbType.String, size: 10);
                parameters.Add("@Voltage", dto.Voltage, DbType.String, size: 10);
                parameters.Add("@ProblemNotes", dto.ProblemNotes, DbType.String, size: 500);
                parameters.Add("@ResolveNotes", dto.ResolveNotes, DbType.String, size: 500);
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@BoardStatus", dto.BoardStatus, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@CompWorkDone", dto.CompWorkDone, DbType.String, size: 20);
                parameters.Add("@CompWorkStatus", dto.CompWorkStatus, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@TestWorkDone", dto.TestWorkDone, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@TestWorkStatus", dto.TestWorkStatus, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@CompletedBy", dto.CompletedBy, DbType.String, size: 50);
                parameters.Add("@ReviewedBy", dto.ReviewedBy, DbType.String, size: 50);
                parameters.Add("@IsPassed", dto.IsPassed, DbType.Boolean);
                parameters.Add("@AssyWorkDone", dto.AssyWorkDone, DbType.AnsiStringFixedLength, size: 20);
                parameters.Add("@AssyProcFollowed", dto.AssyProcFollowed, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@AssyWorkStatus", dto.AssyWorkStatus, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@QCWorkDone", dto.QCWorkDone, DbType.String, size: 50);
                parameters.Add("@QCProcFollowed", dto.QCProcFollowed, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@QCApproved", dto.QCApproved, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@QCWorkStatus", dto.QCWorkStatus, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@CreatedBy", dto.CreatedBy, DbType.String, size: 50);
                parameters.Add("@Approved", dto.Approved, DbType.Boolean);
                parameters.Add("@LastModifiedBy", dto.LastModifiedBy, DbType.String, size: 50);

                await connection.ExecuteAsync("SaveUpdatePartsTestList", parameters, commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving/updating parts test list for RowIndex {dto.RowIndex}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets employee names by department using GetEmployeeNamesByDept stored procedure
        /// </summary>
        /// <param name="department">Department code (T=Technicians, A=Admin, AM=Asset Management, etc.)</param>
        /// <returns>List of employees in the specified department</returns>
        public async Task<IEnumerable<EmployeeDto>> GetEmployeeNamesByDeptAsync(string department)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Department", department, DbType.String, size: 2);

                var employees = await connection.QueryAsync<EmployeeDto>(
                    "GetEmployeeNamesByDept", 
                    parameters, 
                    commandType: CommandType.StoredProcedure);

                return employees;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving employees for department '{department}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes parts test list entry using the appropriate delete stored procedure based on source
        /// </summary>
        /// <param name="rowIndex">Row index of the entry to delete</param>
        /// <param name="source">Source type: PartsTest, UnitTest, OrderRequest, or other for StrippingUnit</param>
        /// <returns>Result message from the stored procedure</returns>
        public async Task<string> DeletePartsTestListAsync(int rowIndex, string source)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Determine stored procedure name based on source
                string storedProcedureName = source switch
                {
                    "PartsTest" => "DeletePartsTestList",
                    "UnitTest" => "DeleteNewUnitTest",
                    "OrderRequest" => "DeleteOrderRequest",
                    _ => "DeleteStrippingUnit"
                };

                using var command = new SqlCommand(storedProcedureName, connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@RowIndex", rowIndex);

                var result = await command.ExecuteScalarAsync();
                return result?.ToString() ?? "Delete operation completed";
            }
            catch (Exception ex)
            {
                return $"Error Occured : <br/>{ex.Message}";
            }
        }

        /// <summary>
        /// Check if job exists in Part_Logs_Job tables
        /// </summary>
        public async Task<bool> CheckJobExistsAsync(string jobNo)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT 1 FROM Part_Logs_Job WHERE Service_Call_ID = @Service_Call_ID 
                    UNION ALL 
                    SELECT 1 FROM dcgetechca.dbo.Part_Logs_Job WHERE Service_Call_ID = @Service_Call_ID";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Service_Call_ID", jobNo.Trim());

                var result = await command.ExecuteScalarAsync();
                return result != null;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking job existence for {jobNo}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Load submitted date for job from Part_Logs_Job tables
        /// </summary>
        public async Task<string> LoadSubmittedDateAsync(string jobNo)
        {
            try
            {
                if (string.IsNullOrEmpty(jobNo))
                    return "NA";

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT COALESCE(plj.RequestedDate, pljCA.RequestedDate) AS SubmittedOn
                    FROM dbo.Part_Logs_Job plj
                    LEFT JOIN dcgetechca.dbo.Part_Logs_Job pljCA 
                        ON plj.Service_Call_ID = pljCA.Service_Call_ID
                    WHERE plj.Service_Call_ID = @Service_Call_ID";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Service_Call_ID", jobNo.Trim());

                var result = await command.ExecuteScalarAsync();
                
                if (result != null && DateTime.TryParse(result.ToString(), out DateTime dt))
                    return dt.ToString();
                    
                return "NA";
            }
            catch (Exception ex)
            {
                throw new Exception($"Error loading submitted date for {jobNo}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Archive parts test record (Final Approval functionality)
        /// </summary>
        public async Task<bool> ArchivePartsTestRecordAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    UPDATE dbo.PartsTestList
                    SET Archive = 1,
                        LastModifiedOn = GETDATE(),
                        LastModifiedBy = @User
                    WHERE RowIndex = @RowIndex";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@RowIndex", rowIndex);
                command.Parameters.AddWithValue("@User", "System"); // You can pass this as parameter

                int rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error archiving record {rowIndex}: {ex.Message}", ex);
            }
        }
    }
}