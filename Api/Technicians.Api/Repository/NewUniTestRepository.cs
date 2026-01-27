using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class NewUniTestRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public NewUniTestRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets new unit test list data based on the GetNewUniTestList stored procedure
        /// Returns UPSTestStatusDto to reuse existing DTO structure
        /// </summary>
        /// <param name="rowIndex">Row index to filter by (0 returns all records ordered by LastModifiedOn)</param>
        /// <returns>NewUniTestResponse containing the unit test data using existing UPSTestStatusDto</returns>
        public async Task<NewUniTestResponse> GetNewUniTestListAsync(int rowIndex = 0)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", rowIndex, DbType.Int32);

                // Reuse UPSTestStatusDto since both come from same table structure
                var unitsData = await connection.QueryAsync<UPSTestStatusDto>(
                    "GetNewUniTestList", 
                    parameters, 
                    commandType: CommandType.StoredProcedure);

                var response = new NewUniTestResponse
                {
                    UnitsData = unitsData.ToList(),
                    IsFiltered = rowIndex > 0,
                    FilteredRowIndex = rowIndex
                };

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving new unit test list: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving new unit test list: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets a specific unit test record by row index
        /// </summary>
        /// <param name="rowIndex">The row index to retrieve</param>
        /// <returns>Single UPSTestStatusDto or null if not found</returns>
        public async Task<UPSTestStatusDto?> GetNewUniTestByRowIndexAsync(int rowIndex)
        {
            try
            {
                var response = await GetNewUniTestListAsync(rowIndex);
                return response.UnitsData.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving unit test for RowIndex {rowIndex}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets all unit test records (equivalent to calling with RowIndex = 0)
        /// </summary>
        /// <returns>All unit test records ordered by LastModifiedOn</returns>
        public async Task<NewUniTestResponse> GetAllNewUniTestsAsync()
        {
            return await GetNewUniTestListAsync(0);
        }

        /// <summary>
        /// Validates the request for GetNewUniTestList
        /// </summary>
        public List<string> ValidateRequest(NewUniTestRequest request)
        {
            var errors = new List<string>();

            if (request == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (request.RowIndex < 0)
            {
                errors.Add("RowIndex cannot be negative");
            }

            return errors;
        }

        /// <summary>
        /// Gets summary statistics for the unit tests
        /// Reuses MakeCountDto from existing models
        /// </summary>
        public async Task<Dictionary<string, object>> GetNewUniTestSummaryAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var summary = new Dictionary<string, object>();

                // Get total count
                const string totalCountQuery = "SELECT COUNT(*) FROM dbo.UPSTestUnits";
                var totalCount = await connection.QuerySingleAsync<int>(totalCountQuery);
                summary["TotalUnits"] = totalCount;

                // Get count by status
                const string statusCountQuery = @"
                    SELECT 
                        ISNULL(NULLIF(RTRIM(Status), ''), 'Unknown') as Status,
                        COUNT(*) as Count
                    FROM dbo.UPSTestUnits 
                    GROUP BY Status
                    ORDER BY Status";
                var statusCounts = await connection.QueryAsync(statusCountQuery);
                summary["StatusCounts"] = statusCounts.ToDictionary(
                    row => (string)row.Status, 
                    row => row.Count);

                // Get count by make - reuse existing MakeCountDto
                const string makeCountQuery = @"
                    SELECT 
                        ISNULL(NULLIF(RTRIM(Make), ''), 'Unknown') as Make,
                        COUNT(*) as MakeCount
                    FROM dbo.UPSTestUnits 
                    WHERE Make IS NOT NULL AND Make <> 'NULL'
                    GROUP BY Make
                    ORDER BY MakeCount DESC";
                var makeCounts = await connection.QueryAsync<MakeCountDto>(makeCountQuery);
                summary["MakeCounts"] = makeCounts;

                // Get units with stripped parts
                const string strippedCountQuery = @"
                    SELECT COUNT(DISTINCT u.RowIndex) 
                    FROM dbo.UPSTestUnits u 
                    INNER JOIN dbo.StrippedUPSUnits s ON u.RowIndex = s.RowIndex";
                var strippedCount = await connection.QuerySingleAsync<int>(strippedCountQuery);
                summary["UnitsWithStrippedParts"] = strippedCount;

                return summary;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving new unit test summary: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Checks if a unit test exists for the given row index
        /// </summary>
        public async Task<bool> UnitTestExistsAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = "SELECT COUNT(1) FROM dbo.UPSTestUnits WHERE RowIndex = @RowIndex";
                var count = await connection.QuerySingleAsync<int>(query, new { RowIndex = rowIndex });
                
                return count > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking if unit test exists for RowIndex {rowIndex}: {ex.Message}", ex);
            }
        }

        #region MoveUnitToStripping Functionality

        /// <summary>
        /// Moves a unit to stripping using the MoveUnitToStripping stored procedure
        /// </summary>
        /// <param name="dto">The unit data to move to stripping</param>
        /// <returns>Response indicating success or failure with result message</returns>
        public async Task<MoveUnitToStrippingResponse> MoveUnitToStrippingAsync(MoveUnitToStrippingDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@Make", dto.Make, DbType.AnsiString, size: 100);        // Updated: 50-100 chars
                parameters.Add("@Model", dto.Model, DbType.AnsiString, size: 100);      // Updated: 50-100 chars  
                parameters.Add("@KVA", dto.KVA, DbType.AnsiStringFixedLength, size: 3); // Updated: 3 chars
                parameters.Add("@Voltage", dto.Voltage, DbType.AnsiString, size: 50);     // Updated: 20-50 chars
                parameters.Add("@SerialNo", dto.SerialNo, DbType.AnsiString, size: 100);  // Updated: 50-100 chars
                parameters.Add("@PONumber", dto.PONumber, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@ShippingPO", dto.ShippingPO, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@UnitCost", dto.UnitCost ?? 0, DbType.Decimal);
                parameters.Add("@ShipCost", dto.ShipCost ?? 0, DbType.Decimal);
                parameters.Add("@CreatedBy", dto.CreatedBy, DbType.AnsiString, size: 120);

                // Execute the stored procedure and get the result
                var result = await connection.QuerySingleOrDefaultAsync<string>(
                    "MoveUnitToStripping", 
                    parameters, 
                    commandType: CommandType.StoredProcedure);

                var response = new MoveUnitToStrippingResponse
                {
                    RowIndex = dto.RowIndex,
                    Make = dto.Make,
                    Result = result ?? "Operation completed"
                };

                // Determine success based on result message
                response.Success = !string.IsNullOrEmpty(result) && 
                                 result.Contains("moved to Stripping Successfully", StringComparison.OrdinalIgnoreCase);

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error moving unit to stripping: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error moving unit to stripping: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates the MoveUnitToStrippingDto for the move operation
        /// Updated with correct field length constraints
        /// </summary>
        /// <param name="dto">DTO to validate</param>
        /// <returns>List of validation errors</returns>
        public List<string> ValidateMoveRequest(MoveUnitToStrippingDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (dto.RowIndex <= 0)
                errors.Add("RowIndex must be greater than 0");

            if (string.IsNullOrWhiteSpace(dto.Make))
                errors.Add("Make is required");

            if (string.IsNullOrWhiteSpace(dto.Model))
                errors.Add("Model is required");

            if (string.IsNullOrWhiteSpace(dto.SerialNo))
                errors.Add("SerialNo is required");

            if (string.IsNullOrWhiteSpace(dto.CreatedBy))
                errors.Add("CreatedBy is required");

            // Validate decimal fields if provided
            if (dto.UnitCost.HasValue && dto.UnitCost < 0)
                errors.Add("UnitCost cannot be negative");

            if (dto.ShipCost.HasValue && dto.ShipCost < 0)
                errors.Add("ShipCost cannot be negative");

            // Updated field length validations based on database schema
            if (!string.IsNullOrEmpty(dto.Make) && dto.Make.Length > 100)
                errors.Add("Make cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.Model) && dto.Model.Length > 100)
                errors.Add("Model cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.KVA) && dto.KVA.Length > 3)
                errors.Add("KVA cannot exceed 3 characters");

            if (!string.IsNullOrEmpty(dto.Voltage) && dto.Voltage.Length > 50)
                errors.Add("Voltage cannot exceed 50 characters");

            if (!string.IsNullOrEmpty(dto.SerialNo) && dto.SerialNo.Length > 100)
                errors.Add("SerialNo cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.PONumber) && dto.PONumber.Length > 10)
                errors.Add("PONumber cannot exceed 10 characters");

            if (!string.IsNullOrEmpty(dto.ShippingPO) && dto.ShippingPO.Length > 10)
                errors.Add("ShippingPO cannot exceed 10 characters");

            if (!string.IsNullOrEmpty(dto.CreatedBy) && dto.CreatedBy.Length > 120)
                errors.Add("CreatedBy cannot exceed 120 characters");

            return errors;
        }

        /// <summary>
        /// Checks if a unit already exists in stripping by RowIndex
        /// </summary>
        /// <param name="rowIndex">The RowIndex to check</param>
        /// <returns>True if unit exists in stripping</returns>
        public async Task<bool> UnitExistsInStrippingAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT COUNT(1) 
                    FROM dbo.StrippedUPSUnits 
                    WHERE RowIndex = @RowIndex";

                var count = await connection.QuerySingleAsync<int>(query, new { RowIndex = rowIndex });
                return count > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking if unit exists in stripping: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets unit information from stripping by RowIndex
        /// </summary>
        /// <param name="rowIndex">The RowIndex to retrieve</param>
        /// <returns>Unit data or null if not found</returns>
        public async Task<StrippedUnitsStatusDto?> GetStrippedUnitByRowIndexAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT Make, Model, SerialNo, KVA, Voltage, PONumber, ShippingPO, 
                           UnitCost, ShipCost, StrippedBy, PutAwayBy, Status, CreatedOn, RowIndex
                    FROM dbo.StrippedUPSUnits 
                    WHERE RowIndex = @RowIndex";

                var unit = await connection.QuerySingleOrDefaultAsync<StrippedUnitsStatusDto>(
                    query, new { RowIndex = rowIndex });

                return unit;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving stripped unit by RowIndex: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Saves or updates a new unit test using the SaveUpdateNewUnitTest stored procedure
        /// Updated with correct field length constraints
        /// </summary>
        public async Task<bool> SaveUpdateNewUnitTestAsync(SaveUpdateNewUnitTestDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@Make", dto.Make, DbType.AnsiString, size: 100);          // Updated: 50-100 chars
                parameters.Add("@Model", dto.Model, DbType.AnsiString, size: 100);        // Updated: 50-100 chars
                parameters.Add("@KVA", dto.KVA, DbType.AnsiStringFixedLength, size: 3);   // Updated: 3 chars
                parameters.Add("@Voltage", dto.Voltage, DbType.AnsiString, size: 50);     // Updated: 20-50 chars
                parameters.Add("@SerialNo", dto.SerialNo, DbType.AnsiString, size: 100);  // Updated: 50-100 chars
                parameters.Add("@Priority", dto.Priority, DbType.AnsiStringFixedLength, size: 15);
                parameters.Add("@AssignedTo", dto.AssignedTo, DbType.AnsiString, size: 50);
                parameters.Add("@DueDate", dto.DueDate, DbType.DateTime);
                parameters.Add("@ProblemNotes", dto.ProblemNotes, DbType.AnsiString, size: 1000); // Updated: 1000+ chars
                parameters.Add("@Approved", dto.Approved, DbType.Boolean);
                parameters.Add("@Archive", dto.Archive, DbType.Boolean);
                parameters.Add("@LastModifiedBy", dto.LastModifiedBy, DbType.AnsiString, size: 125);

                await connection.ExecuteAsync("SaveUpdateNewUnitTest", parameters, commandType: CommandType.StoredProcedure);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving/updating unit test: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates the SaveUpdateNewUnitTestDto with correct field length constraints
        /// </summary>
        public List<string> ValidateSaveUpdateRequest(SaveUpdateNewUnitTestDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (string.IsNullOrWhiteSpace(dto.Make))
                errors.Add("Make is required");

            if (string.IsNullOrWhiteSpace(dto.Model))
                errors.Add("Model is required");

            if (string.IsNullOrWhiteSpace(dto.SerialNo))
                errors.Add("SerialNo is required");

            if (string.IsNullOrWhiteSpace(dto.LastModifiedBy))
                errors.Add("LastModifiedBy is required");

            // Updated field length validations based on database schema
            if (!string.IsNullOrEmpty(dto.Make) && dto.Make.Length > 100)
                errors.Add("Make cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.Model) && dto.Model.Length > 100)
                errors.Add("Model cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.KVA) && dto.KVA.Length > 3)
                errors.Add("KVA cannot exceed 3 characters");

            if (!string.IsNullOrEmpty(dto.Voltage) && dto.Voltage.Length > 50)
                errors.Add("Voltage cannot exceed 50 characters");

            if (!string.IsNullOrEmpty(dto.SerialNo) && dto.SerialNo.Length > 100)
                errors.Add("SerialNo cannot exceed 100 characters");

            if (!string.IsNullOrEmpty(dto.Priority) && dto.Priority.Length > 15)
                errors.Add("Priority cannot exceed 15 characters");

            if (!string.IsNullOrEmpty(dto.AssignedTo) && dto.AssignedTo.Length > 50)
                errors.Add("AssignedTo cannot exceed 50 characters");

            if (!string.IsNullOrEmpty(dto.ProblemNotes) && dto.ProblemNotes.Length > 1000)
                errors.Add("ProblemNotes cannot exceed 1000 characters");

            if (!string.IsNullOrEmpty(dto.LastModifiedBy) && dto.LastModifiedBy.Length > 125)
                errors.Add("LastModifiedBy cannot exceed 125 characters");

            return errors;
        }

        #endregion

        #region SaveUpdateNewUnitResult Functionality

        /// <summary>
        /// Updates unit test result using the SaveUpdateNewUnitResult stored procedure
        /// Updated with correct field length constraints
        /// </summary>
        /// <param name="dto">The unit test result data to update</param>
        /// <returns>True if successful</returns>
        public async Task<bool> SaveUpdateNewUnitResultAsync(SaveUpdateNewUnitResultDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@Status", dto.Status, DbType.AnsiStringFixedLength, size: 5);
                parameters.Add("@ResolveNotes", dto.ResolveNotes, DbType.AnsiString, size: 1000); // Updated: 1000+ chars for Inspection Notes
                parameters.Add("@TestProcedures", dto.TestProcedures, DbType.AnsiStringFixedLength, size: 1);
                parameters.Add("@TestedBy", dto.TestedBy, DbType.AnsiString, size: 100);          // Updated: 50-100 chars for Test Engineer

                await connection.ExecuteAsync("SaveUpdateNewUnitResult", parameters, commandType: CommandType.StoredProcedure);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating unit test result: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates the SaveUpdateNewUnitResultDto with correct field length constraints
        /// </summary>
        /// <param name="dto">DTO to validate</param>
        /// <returns>List of validation errors</returns>
        public List<string> ValidateUpdateResultRequest(SaveUpdateNewUnitResultDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (dto.RowIndex <= 0)
                errors.Add("RowIndex must be greater than 0");

            if (string.IsNullOrWhiteSpace(dto.Status))
                errors.Add("Status is required");

            // Updated field length validations based on database schema
            if (!string.IsNullOrEmpty(dto.Status) && dto.Status.Length > 5)
                errors.Add("Status cannot exceed 5 characters");

            if (!string.IsNullOrEmpty(dto.ResolveNotes) && dto.ResolveNotes.Length > 1000)
                errors.Add("ResolveNotes (Inspection Notes) cannot exceed 1000 characters");

            if (!string.IsNullOrEmpty(dto.TestProcedures) && dto.TestProcedures.Length > 1)
                errors.Add("TestProcedures must be a single character");

            if (!string.IsNullOrEmpty(dto.TestedBy) && dto.TestedBy.Length > 100)
                errors.Add("TestedBy (Test Engineer) cannot exceed 100 characters");

            return errors;
        }

        #endregion

        #region DeleteNewUnitTest Functionality

        /// <summary>
        /// Deletes a unit test using the DeleteNewUnitTest stored procedure
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the unit test to delete</param>
        /// <returns>Response indicating success or failure with result message</returns>
        public async Task<DeleteNewUnitTestResponse> DeleteNewUnitTestAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", rowIndex, DbType.Int32);

                // Execute the stored procedure and get the result
                var result = await connection.QuerySingleOrDefaultAsync<string>(
                    "DeleteNewUnitTest", 
                    parameters, 
                    commandType: CommandType.StoredProcedure);

                var response = new DeleteNewUnitTestResponse
                {
                    RowIndex = rowIndex,
                    Result = result ?? "Operation completed"
                };

                // Determine success based on result message
                response.Success = !string.IsNullOrEmpty(result) && 
                                 result.Contains("Unit Deleted Successfully", StringComparison.OrdinalIgnoreCase);

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error deleting unit test: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting unit test: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates the delete request
        /// </summary>
        /// <param name="rowIndex">RowIndex to validate</param>
        /// <returns>List of validation errors</returns>
        public List<string> ValidateDeleteRequest(int rowIndex)
        {
            var errors = new List<string>();

            if (rowIndex <= 0)
                errors.Add("RowIndex must be greater than 0");

            return errors;
        }

        #endregion
    }
}