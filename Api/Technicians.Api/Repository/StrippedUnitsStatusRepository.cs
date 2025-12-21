using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class StrippedUnitsStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public StrippedUnitsStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets stripped units status data using the GetStrippedUnitsStatus stored procedure
        /// </summary>
        /// <param name="request">Filter parameters for the stored procedure</param>
        /// <returns>Complete response with units data and make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsStatusAsync(StrippedUnitsStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Status", string.IsNullOrEmpty(request.Status) || request.Status == "All" ? "All" : request.Status, DbType.AnsiStringFixedLength, size: 5);
                parameters.Add("@RowIndex", request.RowIndex, DbType.Int32);

                // Execute stored procedure and get multiple result sets
                using var multi = await connection.QueryMultipleAsync("GetStrippedUnitsStatus", parameters, commandType: CommandType.StoredProcedure);

                var response = new StrippedUnitsStatusResponse();

                // First result set: Stripped units data
                response.UnitsData = (await multi.ReadAsync<StrippedUnitsStatusDto>()).ToList();

                // Second result set: Make counts (only if RowIndex is 0)
                if (request.RowIndex == 0)
                {
                    response.MakeCounts = (await multi.ReadAsync<MakeCountDto>()).ToList();
                }

                return response;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving stripped units status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets stripped units status data with default parameters (All statuses, no specific RowIndex)
        /// </summary>
        /// <returns>Complete response with all units data and make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsStatusAsync()
        {
            var defaultRequest = new StrippedUnitsStatusRequest
            {
                Status = "All",
                RowIndex = 0
            };

            return await GetStrippedUnitsStatusAsync(defaultRequest);
        }

        /// <summary>
        /// Gets a specific stripped unit by RowIndex
        /// </summary>
        /// <param name="rowIndex">The specific RowIndex to retrieve</param>
        /// <returns>Single unit data response</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitByRowIndexAsync(int rowIndex)
        {
            var request = new StrippedUnitsStatusRequest
            {
                Status = "All",
                RowIndex = rowIndex
            };

            return await GetStrippedUnitsStatusAsync(request);
        }

        /// <summary>
        /// Gets stripped units filtered by status
        /// </summary>
        /// <param name="status">Status filter (INP, NCR, MPJ, COM, Inp, Def, Wos, or All)</param>
        /// <returns>Filtered units data with make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsByStatusAsync(string status)
        {
            var request = new StrippedUnitsStatusRequest
            {
                Status = status,
                RowIndex = 0
            };

            return await GetStrippedUnitsStatusAsync(request);
        }

        /// <summary>
        /// Gets only make counts for incomplete units (status not 'Com')
        /// </summary>
        /// <returns>List of make counts</returns>
        public async Task<IEnumerable<MakeCountDto>> GetMakeCountsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM dbo.StrippedUPSUnits 
                    WHERE Status <> 'Com' AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'
                    UNION
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM DCGETechArchive.dbo.StrippedUPSUnits 
                    WHERE Status <> 'Com' AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'";

                var makeCounts = await connection.QueryAsync<MakeCountDto>(query);
                return makeCounts;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving make counts: {ex.Message}", ex);
            }
        }

       
        /// <summary>
        /// Saves or updates a stripping unit using the SaveUpdateStrippingUnit stored procedure
        /// </summary>
        /// <param name="dto">The stripping unit data to save or update</param>
        /// <returns>True if successful</returns>
        public async Task<bool> SaveUpdateStrippingUnitAsync(StrippedUnitsStatusDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@Make", dto.Make, DbType.AnsiString, size: 50);
                parameters.Add("@Model", dto.Model, DbType.AnsiString, size: 50);
                parameters.Add("@KVA", dto.KVA, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@Voltage", dto.Voltage, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@SerialNo", dto.SerialNo, DbType.AnsiString, size: 50);
                parameters.Add("@PONumber", dto.PONumber, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@ShippingPO", dto.ShippingPO, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@UnitCost", dto.UnitCost, DbType.Decimal);
                parameters.Add("@ShipCost", dto.ShipCost, DbType.Decimal);
                parameters.Add("@StrippedBy", dto.StrippedBy, DbType.AnsiString, size: 100);
                parameters.Add("@PutAwayBy", dto.PutAwayBy, DbType.AnsiString, size: 100);
                parameters.Add("@Status", dto.Status, DbType.AnsiStringFixedLength, size: 3);
                parameters.Add("@PartsLocation", dto.PartsLocation, DbType.AnsiString, size: 120);
                parameters.Add("@LastModifiedBy", dto.LastModifiedBy, DbType.AnsiString, size: 100);

                await connection.ExecuteAsync("SaveUpdateStrippingUnit", parameters, commandType: CommandType.StoredProcedure);

                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving/updating stripping unit: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Saves or updates stripped parts in unit using the SaveUpdateStrippedPartsInUnit stored procedure
        /// </summary>
        /// <param name="dto">The stripped parts in unit data to save or update</param>
        /// <returns>True if successful</returns>
        public async Task<bool> SaveUpdateStrippedPartsInUnitAsync(StrippedPartsInUnitDto dto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@MasterRowIndex", dto.MasterRowIndex, DbType.Int32);
                parameters.Add("@RowIndex", dto.RowIndex, DbType.Int32);
                parameters.Add("@DCGPartGroup", dto.DCGPartGroup, DbType.AnsiStringFixedLength, size: 30);
                parameters.Add("@DCGPartNo", dto.DCGPartNo, DbType.AnsiString, size: 50);
                parameters.Add("@PartDesc", dto.PartDesc, DbType.AnsiString, size: 500);
                parameters.Add("@KeepThrow", dto.KeepThrow, DbType.AnsiStringFixedLength, size: 10);
                parameters.Add("@StripNo", dto.StripNo, DbType.Int32);
                parameters.Add("@LastModifiedBy", dto.LastModifiedBy, DbType.AnsiString, size: 100);

                await connection.ExecuteAsync("SaveUpdateStrippedPartsInUnit", parameters, commandType: CommandType.StoredProcedure);

                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving/updating stripped parts in unit: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Maps full status names to database status codes
        /// </summary>
        /// <param name="status">Full status name or code</param>
        /// <returns>Database status code</returns>
        public string MapStatusToCode(string status)
        {
            if (string.IsNullOrEmpty(status))
                return "All";

            return status.ToLower().Trim() switch
            {
                "in progress" => "INP",
                "inp" => "INP",
                "needs components for repairs" => "NCR",
                "ncr" => "NCR",
                "missing parts from job" => "MPJ",
                "mpj" => "MPJ",
                "completed" => "COM",
                "com" => "COM",
                // Legacy status mappings for backward compatibility
                "deferred" => "Def",
                "deffered" => "Def", // Handle the typo in your SP
                "def" => "Def",
                "waiting on someone else" => "Wos",
                "wos" => "Wos",
                "all" => "All",
                _ => status // Return as-is if no mapping found
            };
        }

        /// <summary>
        /// Validates the StrippedUnitsStatusDto for save/update operations
        /// </summary>
        /// <param name="dto">DTO to validate</param>
        /// <returns>List of validation errors</returns>
        public List<string> ValidateSaveUpdateRequest(StrippedUnitsStatusDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (string.IsNullOrWhiteSpace(dto.SerialNo))
                errors.Add("SerialNo is required");

            if (string.IsNullOrWhiteSpace(dto.Make))
                errors.Add("Make is required");

            if (string.IsNullOrWhiteSpace(dto.Status))
                errors.Add("Status is required");

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                var validStatuses = new[] { "INP", "NCR", "MPJ", "COM", "Inp", "Def", "Wos" };
                if (!validStatuses.Contains(dto.Status, StringComparer.OrdinalIgnoreCase))
                {
                    errors.Add($"Invalid status. Valid values are: {string.Join(", ", validStatuses)}");
                }
            }

            if (string.IsNullOrWhiteSpace(dto.LastModifiedBy))
                errors.Add("LastModifiedBy is required");

            // Validate decimal fields if provided
            if (dto.UnitCost.HasValue && dto.UnitCost < 0)
                errors.Add("UnitCost cannot be negative");

            if (dto.ShipCost.HasValue && dto.ShipCost < 0)
                errors.Add("ShipCost cannot be negative");

            return errors;
        }

        /// <summary>
        /// Validates the StrippedPartsInUnitDto for save/update operations
        /// </summary>
        /// <param name="dto">DTO to validate</param>
        /// <returns>List of validation errors</returns>
        public List<string> ValidateStrippedPartsInUnitRequest(StrippedPartsInUnitDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (dto.MasterRowIndex <= 0)
                errors.Add("MasterRowIndex is required and must be greater than 0");

            if (string.IsNullOrWhiteSpace(dto.DCGPartGroup))
                errors.Add("DCGPartGroup is required");

            if (string.IsNullOrWhiteSpace(dto.DCGPartNo))
                errors.Add("DCGPartNo is required");

            if (string.IsNullOrWhiteSpace(dto.PartDesc))
                errors.Add("PartDesc is required");

            if (string.IsNullOrWhiteSpace(dto.KeepThrow))
                errors.Add("KeepThrow is required");

            if (!string.IsNullOrWhiteSpace(dto.KeepThrow))
            {
                var validKeepThrowValues = new[] { "Keep", "Throw", "K", "T" };
                if (!validKeepThrowValues.Contains(dto.KeepThrow, StringComparer.OrdinalIgnoreCase))
                {
                    errors.Add($"Invalid KeepThrow value. Valid values are: {string.Join(", ", validKeepThrowValues)}");
                }
            }

            if (dto.StripNo < 0)
                errors.Add("StripNo cannot be negative");

            if (string.IsNullOrWhiteSpace(dto.LastModifiedBy))
                errors.Add("LastModifiedBy is required");

            return errors;
        }

        /// <summary>
        /// Gets strip part codes for dropdown population
        /// </summary>
        /// <returns>List of strip part codes with Code and Name</returns>
        public async Task<IEnumerable<StripPartCodeDto>> GetStripPartCodesAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT RTRIM(Code) AS Code, RTRIM(Name) AS Name 
                    FROM [StripPartCodes] 
                    ORDER BY Name";

                var stripPartCodes = await connection.QueryAsync<StripPartCodeDto>(query);
                return stripPartCodes;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving strip part codes: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes an entry using the appropriate delete stored procedure based on source
        /// </summary>
        /// <param name="rowIndex">Row index of the entry to delete</param>
        /// <param name="source">Source type: PartsTest, UnitTest, OrderRequest, or other for StrippingUnit</param>
        /// <returns>Result message from the stored procedure</returns>
        public async Task<string> DeleteBySourceAsync(int rowIndex, string source)
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
                return result?.ToString() ?? "Delete operation completed successfully";
            }
            catch (Exception ex)
            {
                return $"Error Occured : <br/>{ex.Message}";
            }
        }

        /// <summary>
        /// Gets stripped parts in unit details using the GetStrippedPartsInUnit stored procedure
        /// </summary>
        /// <param name="masterRowIndex">The MasterRowIndex to retrieve parts for</param>
        /// <returns>Complete response with parts details, group counts, cost analysis, and parts location</returns>
        public async Task<StrippedPartsInUnitResponse> GetStrippedPartsInUnitAsync(int masterRowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@MasterRowIndex", masterRowIndex, DbType.Int32);

                // Execute stored procedure and get multiple result sets
                using var multi = await connection.QueryMultipleAsync("GetStrippedPartsInUnit", parameters, commandType: CommandType.StoredProcedure);

                var response = new StrippedPartsInUnitResponse
                {
                    MasterRowIndex = masterRowIndex
                };

                // First result set: Parts details
                var partsDetails = (await multi.ReadAsync<StrippedPartsDetailDto>()).ToList();
                response.PartsDetails = partsDetails;

                // Check if we have data - if the first result set has data, we expect more result sets
                response.HasData = partsDetails.Any();

                if (response.HasData)
                {
                    // Second result set: Group counts
                    response.GroupCounts = (await multi.ReadAsync<StrippedPartsGroupCountDto>()).ToList();

                    // Third result set: Cost analysis
                    var costAnalysisRaw = await multi.ReadAsync();
                    response.CostAnalysis = costAnalysisRaw.Select(row => new StrippedPartsCostAnalysisDto
                    {
                        PartPercent = Convert.ToDecimal(row.PartPercent ?? 0),
                        DollarOfTotal = Convert.ToDecimal(row.DollarOfTotal ?? 0),
                        Quantity = Convert.ToInt32(row.Quantity ?? 0),
                        DollarPerPart = Convert.ToDecimal(row.DollarPerPart ?? 0),
                        PartsStripped = Convert.ToString(row.PartsStripped ?? string.Empty)
                    }).ToList();

                    // Fourth result set: Parts location
                    response.PartsLocations = (await multi.ReadAsync<StrippedPartsLocationDto>()).ToList();
                }

                return response;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving stripped parts in unit: {ex.Message}", ex);
            }
        }


    }
}