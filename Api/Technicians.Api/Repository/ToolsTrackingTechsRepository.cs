using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class ToolsTrackingTechsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _etechConnectionString;
        private readonly string _defaultConnectionString;
        private readonly ILogger<ToolsTrackingTechsRepository> _logger;
        private const string UPLOADFILETYPE = "jpg,gif,doc,bmp,xls,png,txt,xlsx,docx,pdf,jpeg";
        private const string BaseDirectory = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";

        public ToolsTrackingTechsRepository(IConfiguration configuration, ILogger<ToolsTrackingTechsRepository> logger)
        {
            _configuration = configuration;
            _etechConnectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
            _defaultConnectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // Methods that use ETechConnString (DCG database)
        /// <summary>
        /// Gets tools tracking technicians data using the ToolsTrackingTechs stored procedure
        /// </summary>
        public async Task<List<ToolsTrackingTechsDto>> GetToolsTrackingTechsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var techsData = await connection.QueryAsync<ToolsTrackingTechsDto>(
                    "ToolsTrackingTechs",
                    commandType: CommandType.StoredProcedure);

                return techsData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools tracking techs data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools tracking techs data: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tool serial numbers using the GetTechToolSerialNos stored procedure
        /// </summary>
        /// <param name="toolName">Tool name to filter by (use "All" for all tools)</param>
        public async Task<List<TechToolSerialNoDto>> GetTechToolSerialNosAsync(string toolName)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var serialNosData = await connection.QueryAsync<TechToolSerialNoDto>(
                    "GetTechToolSerialNos",
                    new { pToolName = toolName },
                    commandType: CommandType.StoredProcedure);

                return serialNosData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tool serial numbers for tool '{toolName}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tool serial numbers for tool '{toolName}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tools calendar tracking data using the aaToolsCalendar_Tracking stored procedure
        /// </summary>
        /// <param name="startDate">Start date for filtering</param>
        /// <param name="endDate">End date for filtering</param>
        /// <param name="toolName">Tool name to filter by (use "All" for all tools)</param>
        /// <param name="serialNo">Serial number to filter by (use "All" for all serial numbers)</param>
        /// <param name="techFilter">Tech filter (use "All" or "0" or "1" for all techs)</param>
        public async Task<ToolsCalendarTrackingResultDto> GetToolsCalendarTrackingAsync(
            DateTime startDate,
            DateTime endDate,
            string toolName = "All",
            string serialNo = "All",
            string techFilter = "All")
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                using var multi = await connection.QueryMultipleAsync(
                    "aaToolsCalendar_Tracking",
                    new
                    {
                        pStartDate = startDate,
                        pEndDate = endDate,
                        pToolName = toolName,
                        pSerialNo = serialNo,
                        pTechFilter = techFilter
                    },
                    commandType: CommandType.StoredProcedure);

                // Read first result set - tracking data
                var trackingData = (await multi.ReadAsync<ToolsCalendarTrackingDto>()).ToList();

                // Read second result set - due counts
                var dueCounts = await multi.ReadFirstOrDefaultAsync<ToolsCalendarDueCountsDto>() 
                    ?? new ToolsCalendarDueCountsDto();

                return new ToolsCalendarTrackingResultDto
                {
                    TrackingData = trackingData,
                    DueCounts = dueCounts
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools calendar tracking data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools calendar tracking data: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tech tools misc kit data by tech ID using the GetTechToolsMiscKitByTechID stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to retrieve misc kit data for</param>
        public async Task<TechToolsMiscKitResultDto> GetTechToolsMiscKitByTechIdAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                using var multi = await connection.QueryMultipleAsync(
                    "GetTechToolsMiscKitByTechID",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                // Read first result set - tool kit data
                var toolKitData = (await multi.ReadAsync<TechToolsMiscKitDto>()).ToList();

                // Read second result set - tech info data
                var techInfo = await multi.ReadFirstOrDefaultAsync<TechsInfoDto>() 
                    ?? new TechsInfoDto();

                return new TechToolsMiscKitResultDto
                {
                    ToolKitData = toolKitData,
                    TechInfo = techInfo
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tech tools misc kit data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tech tools misc kit data for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tools tracking count by tech ID using the GetToolsTrackingCount stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to get count for</param>
        public async Task<int> GetToolsTrackingCountAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var count = await connection.QuerySingleAsync<int>(
                    "GetToolsTrackingCount",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return count;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools tracking count for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools tracking count for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Executes insert tech tools query using the ExecuteInsertTechToolsQuery stored procedure
        /// </summary>
        /// <param name="query">SQL query to execute</param>
        public async Task<ExecuteInsertTechToolsQueryResultDto> ExecuteInsertTechToolsQueryAsync(string query)
        {
            try
            {
                using var connection = new SqlConnection(_etechConnectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Query", query);
                parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

                await connection.ExecuteAsync(
                    "ExecuteInsertTechToolsQuery",
                    parameters,
                    commandType: CommandType.StoredProcedure);

                var returnValue = parameters.Get<int>("@ReturnValue");

                return new ExecuteInsertTechToolsQueryResultDto
                {
                    Success = returnValue == 1,
                    ReturnValue = returnValue,
                    Message = returnValue == 1 ? "Query executed successfully" : "Query execution failed"
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error executing insert tech tools query: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error executing insert tech tools query: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes tools tracking data by tech ID using the DeleteToolsTracking stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to delete tracking data for</param>
        public async Task<DeleteToolsTrackingResultDto> DeleteToolsTrackingAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var rowsAffected = await connection.ExecuteAsync(
                    "DeleteToolsTracking",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return new DeleteToolsTrackingResultDto
                {
                    RowsAffected = rowsAffected,
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 
                        ? $"Successfully deleted {rowsAffected} tools tracking record(s) for tech ID '{techId}'"
                        : $"No tools tracking records found for tech ID '{techId}'"
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error deleting tools tracking data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting tools tracking data for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tech tools tracking data by tech ID using the GetTechToolsTrackingByTechID stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to retrieve tracking data for</param>
        public async Task<List<TechToolsTrackingDto>> GetTechToolsTrackingByTechIdAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var toolsTrackingData = await connection.QueryAsync<TechToolsTrackingDto>(
                    "GetTechToolsTrackingByTechID",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return toolsTrackingData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tech tools tracking data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tech tools tracking data for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Saves/Updates tech tools tracking data using legacy DELETE-INSERT pattern
        /// Replicates the exact behavior of legacy DeleteInsertTechToolsData() method
        /// </summary>
        /// <param name="request">Save request containing tech ID and tool tracking items</param>
        public async Task<SaveTechToolsTrackingResultDto> SaveTechToolsTrackingAsync(SaveTechToolsTrackingRequestDto request)
        {
            try
            {
                if (!request.ToolTrackingItems.Any())
                {
                    return new SaveTechToolsTrackingResultDto
                    {
                        Success = false,
                        Message = "No tool tracking items provided",
                        RecordsProcessed = 0
                    };
                }

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();
                using var transaction = await connection.BeginTransactionAsync();
                
                try
                {
                    // Step 1: Check if records exist and delete them (legacy behavior)
                    var toolCount = await GetToolsTrackingCountAsync(request.TechID);
                    if (toolCount > 0)
                    {
                        await connection.ExecuteAsync(
                            "DeleteToolsTracking",
                            new { TechID = request.TechID },
                            transaction,
                            commandType: CommandType.StoredProcedure);
                    }

                    // Step 2: Build and execute INSERT query (replicates legacy string building)
                    var insertedCount = 0;
                    var processedItems = new List<string>();

                    string strSQL = " INSERT INTO DBO.[ToolTracking] ";
                    strSQL += "(TechID,ToolName,SerialNo,DueDt,NewMTracking,OldMSerialNo,OldMTracking,Received,ModifiedOn,ModifiedBy,ColumnOrder)";

                    for (int i = 0; i < request.ToolTrackingItems.Count; i++)
                    {
                        var item = request.ToolTrackingItems[i];
                        
                        // Handle empty due date like legacy (default to 1/1/1900)
                        var dueDtText = item.DueDt == DateTime.MinValue || item.DueDt.Year < 1900 
                            ? "1/1/1900" 
                            : item.DueDt.ToString("M/d/yyyy");

                        // Convert boolean received to string like legacy
                        var receivedValue = "False";
                        if (!string.IsNullOrEmpty(item.Received))
                        {
                            if (item.Received.Equals("True", StringComparison.OrdinalIgnoreCase) || 
                                item.Received.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                                item.Received.Equals("true", StringComparison.OrdinalIgnoreCase))
                            {
                                receivedValue = "True";
                            }
                        }

                        // Build SQL exactly like legacy code
                        strSQL += $" (SELECT '{request.TechID}','{item.ToolName?.Replace("'", "''")}','{item.SerialNo?.Trim()?.Replace("'", "''")}','{dueDtText}','{item.NewMTracking?.Trim()?.Replace("'", "''")}','{item.OldMSerialNo?.Trim()?.Replace("'", "''")}','{item.OldMTracking?.Trim()?.Replace("'", "''")}','{receivedValue}',CURRENT_TIMESTAMP,'{request.ModifiedBy}','{item.ColumnOrder}')";
                        
                        if (i < request.ToolTrackingItems.Count - 1)
                        {
                            strSQL += " UNION ";
                        }

                        processedItems.Add($"{item.ToolName} (TechID: {request.TechID})");
                    }

                    // Execute the generated query
                    insertedCount = await connection.ExecuteAsync(strSQL, transaction: transaction);

                    await transaction.CommitAsync();

                    return new SaveTechToolsTrackingResultDto
                    {
                        Success = insertedCount > 0,
                        Message = insertedCount > 0 ? 
                            $"Update Successful - Processed {insertedCount} tool tracking records: {string.Join(", ", processedItems)}" : 
                            "No records were processed",
                        RecordsProcessed = insertedCount,
                        GeneratedQuery = strSQL
                    };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error saving tech tools tracking data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving tech tools tracking data: {ex.Message}", ex);
            }
        }

        #region File Management Methods (Legacy DisplayFile, SaveFile equivalent)

        /// <summary>
        /// Gets file attachments for a tech ID (legacy DisplayFile equivalent)
        /// </summary>
        /// <param name="techId">Tech ID to get files for</param>
        public async Task<List<ToolsTrackingFileDto>> GetFilesAsync(string techId)
        {
            try
            {
                await Task.CompletedTask; // Make method async compatible
                
                var dirPath = Path.Combine(BaseDirectory, techId);
                var files = new List<ToolsTrackingFileDto>();

                if (!Directory.Exists(dirPath))
                    return files;

                var fileInfos = new DirectoryInfo(dirPath).GetFiles();
                
                foreach (var fileInfo in fileInfos)
                {
                    files.Add(new ToolsTrackingFileDto
                    {
                        FileName = fileInfo.Name,
                        FileSizeKB = fileInfo.Length / 1024,
                        UploadedOn = fileInfo.CreationTime.ToString("yyyy-MM-dd HH:mm:ss"),
                        FilePath = fileInfo.FullName
                    });
                }

                return files.OrderBy(f => f.FileName).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving files for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Uploads a file for a tech ID (legacy SaveFile equivalent)
        /// </summary>
        /// <param name="techId">Tech ID to upload file for</param>
        /// <param name="fileName">Name of the file</param>
        /// <param name="fileStream">File stream data</param>
        public async Task<FileUploadResultDto> UploadFileAsync(string techId, string fileName, Stream fileStream)
        {
            try
            {
                // Validate file extension (legacy IsValidFile equivalent)
                if (!IsValidFile(fileName))
                {
                    return new FileUploadResultDto
                    {
                        Success = false,
                        Message = $"Invalid file format. File must be of format {UPLOADFILETYPE}",
                        FileName = fileName
                    };
                }

                var dirPath = Path.Combine(BaseDirectory, techId);
                var filePath = Path.Combine(dirPath, fileName);

                // Create directory if it doesn't exist
                if (!Directory.Exists(dirPath))
                {
                    Directory.CreateDirectory(dirPath);
                }

                // Check if file already exists
                if (File.Exists(filePath))
                {
                    return new FileUploadResultDto
                    {
                        Success = false,
                        Message = $"File '{fileName}' already exists in destination folder",
                        FileName = fileName
                    };
                }

                // Save the file
                using var fileStreamOutput = new FileStream(filePath, FileMode.Create);
                await fileStream.CopyToAsync(fileStreamOutput);

                return new FileUploadResultDto
                {
                    Success = true,
                    Message = $"File '{fileName}' uploaded successfully",
                    FileName = fileName,
                    FilePath = filePath
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error uploading file '{fileName}' for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes a file for a tech ID
        /// </summary>
        /// <param name="techId">Tech ID</param>
        /// <param name="fileName">File name to delete</param>
        public async Task<bool> DeleteFileAsync(string techId, string fileName)
        {
            try
            {
                await Task.CompletedTask; // Make method async compatible
                
                var filePath = Path.Combine(BaseDirectory, techId, fileName);
                
                if (!File.Exists(filePath))
                    return false;

                File.Delete(filePath);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting file '{fileName}' for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates file extension (legacy IsValidFile equivalent)
        /// </summary>
        /// <param name="fileName">File name to validate</param>
        private static bool IsValidFile(string fileName)
        {
            var fileExtension = GetFileExtension(fileName);
            var validExtensions = UPLOADFILETYPE.Split(new char[] { ',' });

            return validExtensions.Any(ext => 
                string.Equals(ext, fileExtension, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Gets file extension (legacy GetFileExtension equivalent)
        /// </summary>
        /// <param name="fileName">File name</param>
        private static string GetFileExtension(string fileName)
        {
            var lastIndex = fileName.LastIndexOf(".");
            return lastIndex >= 0 ? fileName.Substring(lastIndex + 1) : string.Empty;
        }

        #endregion
    }
}