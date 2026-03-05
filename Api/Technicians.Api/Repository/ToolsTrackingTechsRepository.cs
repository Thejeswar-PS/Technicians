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
        private readonly CommonRepository _commonRepository;
        private const string UPLOADFILETYPE = "jpg,gif,doc,bmp,xls,png,txt,xlsx,docx,pdf,jpeg";
        private const string BaseDirectory = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";

        public ToolsTrackingTechsRepository(
            IConfiguration configuration, 
            ILogger<ToolsTrackingTechsRepository> logger,
            CommonRepository commonRepository)
        {
            _configuration = configuration;
            _etechConnectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
            _defaultConnectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _commonRepository = commonRepository ?? throw new ArgumentNullException(nameof(commonRepository));
        }

        #region Public Methods - Enhanced with Role-Based Filtering

        /// <summary>
        /// Gets tools tracking technicians data using the ToolsTrackingTechs stored procedure
        /// Enhanced with role-based filtering
        /// </summary>
        public async Task<List<ToolsTrackingTechsDto>> GetToolsTrackingTechsAsync(
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var techsData = await connection.QueryAsync<ToolsTrackingTechsDto>(
                    "ToolsTrackingTechs",
                    commandType: CommandType.StoredProcedure);

                var allData = techsData.ToList();

                // Apply role-based filtering
                return await ApplyRoleBasedDataFiltering(allData, userEmpID, windowsID);
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="toolName">Tool name to filter by (use "All" for all tools)</param>
        public async Task<List<TechToolSerialNoDto>> GetTechToolSerialNosAsync(
            string toolName, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tool name
                var filteredToolName = await ApplyToolFilterByRole(toolName, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var serialNosData = await connection.QueryAsync<TechToolSerialNoDto>(
                    "GetTechToolSerialNos",
                    new { pToolName = filteredToolName },
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
        /// Enhanced with role-based filtering - implements legacy aaTechCalendar_Module logic
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
            string techFilter = "All",
            string? userEmpID = null,
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering for calendar tracking parameters
                var filteredParams = await ApplyCalendarRoleBasedFiltering(techFilter, toolName, serialNo, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                using var multi = await connection.QueryMultipleAsync(
                    "aaToolsCalendar_Tracking",
                    new
                    {
                        pStartDate = startDate,
                        pEndDate = endDate,
                        pToolName = filteredParams.ToolName,
                        pSerialNo = filteredParams.SerialNo,
                        pTechFilter = filteredParams.TechFilter
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to retrieve misc kit data for</param>
        public async Task<TechToolsMiscKitResultDto> GetTechToolsMiscKitByTechIdAsync(
            string techId, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                using var multi = await connection.QueryMultipleAsync(
                    "GetTechToolsMiscKitByTechID",
                    new { TechID = filteredTechId },
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to get count for</param>
        public async Task<int> GetToolsTrackingCountAsync(
            string techId, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var count = await connection.QuerySingleAsync<int>(
                    "GetToolsTrackingCount",
                    new { TechID = filteredTechId },
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
        /// Enhanced with role-based access validation
        /// </summary>
        /// <param name="query">SQL query to execute</param>
        public async Task<ExecuteInsertTechToolsQueryResultDto> ExecuteInsertTechToolsQueryAsync(
            string query, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based validation for query execution
                await ValidateQueryExecutionAccess(userEmpID, windowsID);

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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to delete tracking data for</param>
        public async Task<DeleteToolsTrackingResultDto> DeleteToolsTrackingAsync(
            string techId, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var rowsAffected = await connection.ExecuteAsync(
                    "DeleteToolsTracking",
                    new { TechID = filteredTechId },
                    commandType: CommandType.StoredProcedure);

                return new DeleteToolsTrackingResultDto
                {
                    RowsAffected = rowsAffected,
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 
                        ? $"Successfully deleted {rowsAffected} tools tracking record(s) for tech ID '{filteredTechId}'"
                        : $"No tools tracking records found for tech ID '{filteredTechId}'"
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to retrieve tracking data for</param>
        public async Task<List<TechToolsTrackingDto>> GetTechToolsTrackingByTechIdAsync(
            string techId, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();

                var toolsTrackingData = await connection.QueryAsync<TechToolsTrackingDto>(
                    "GetTechToolsTrackingByTechID",
                    new { TechID = filteredTechId },
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="request">Save request containing tech ID and tool tracking items</param>
        public async Task<SaveTechToolsTrackingResultDto> SaveTechToolsTrackingAsync(
            SaveTechToolsTrackingRequestDto request, 
            string? userEmpID = null, 
            string? windowsID = null)
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

                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(request.TechID, userEmpID, windowsID);
                request.TechID = filteredTechId; // Update request with filtered tech ID

                using var connection = new SqlConnection(_defaultConnectionString);
                await connection.OpenAsync();
                using var transaction = await connection.BeginTransactionAsync();
                
                try
                {
                    // Step 1: Check if records exist and delete them (legacy behavior)
                    var toolCount = await GetToolsTrackingCountAsync(filteredTechId);
                    if (toolCount > 0)
                    {
                        await connection.ExecuteAsync(
                            "DeleteToolsTracking",
                            new { TechID = filteredTechId },
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
                        strSQL += $" (SELECT '{filteredTechId}','{item.ToolName?.Replace("'", "''")}','{item.SerialNo?.Trim()?.Replace("'", "''")}','{dueDtText}','{item.NewMTracking?.Trim()?.Replace("'", "''")}','{item.OldMSerialNo?.Trim()?.Replace("'", "''")}','{item.OldMTracking?.Trim()?.Replace("'", "''")}','{receivedValue}',CURRENT_TIMESTAMP,'{request.ModifiedBy}','{item.ColumnOrder}')";
                        
                        if (i < request.ToolTrackingItems.Count - 1)
                        {
                            strSQL += " UNION ";
                        }

                        processedItems.Add($"{item.ToolName} (TechID: {filteredTechId})");
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

        #endregion

        #region File Management Methods - Enhanced with Role-Based Filtering

        /// <summary>
        /// Gets file attachments for a tech ID (legacy DisplayFile equivalent)
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to get files for</param>
        public async Task<List<ToolsTrackingFileDto>> GetFilesAsync(
            string techId, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);
                
                var dirPath = Path.Combine(BaseDirectory, filteredTechId);
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to upload file for</param>
        /// <param name="fileName">Name of the file</param>
        /// <param name="fileStream">File stream data</param>
        public async Task<FileUploadResultDto> UploadFileAsync(
            string techId, 
            string fileName, 
            Stream fileStream, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);

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

                var dirPath = Path.Combine(BaseDirectory, filteredTechId);
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
        /// Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID</param>
        /// <param name="fileName">File name to delete</param>
        public async Task<bool> DeleteFileAsync(
            string techId, 
            string fileName, 
            string? userEmpID = null, 
            string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering to tech ID
                var filteredTechId = await ApplyTechIdFiltering(techId, userEmpID, windowsID);
                
                var filePath = Path.Combine(BaseDirectory, filteredTechId, fileName);
                
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

        #endregion

        #region Role-Based Filtering Methods

        /// <summary>
        /// Applies role-based filtering to tools tracking data
        /// Technicians: Limited to their own data, disabled dropdowns
        /// Managers/Other: Can view all data and modify filters
        /// </summary>
        private async Task<List<ToolsTrackingTechsDto>> ApplyRoleBasedDataFiltering(
            List<ToolsTrackingTechsDto> allData, 
            string? userEmpID, 
            string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return allData; // No user context, return all data
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return allData;
                }

                var normalizedStatus = (employeeStatusData.Status ?? "").Trim().ToLower();
                var userEmp = (userEmpID ?? "").Trim();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // Technicians: filter to only their own data
                    return allData.Where(item => 
                        string.Equals(item.TechID?.Trim(), userEmp, StringComparison.OrdinalIgnoreCase)
                    ).ToList();
                }

                // Managers and other roles: full access
                return allData;
            }
            catch (Exception)
            {
                // If error occurs, return all data
                return allData;
            }
        }

        /// <summary>
        /// Applies role-based filtering for calendar tracking parameters
        /// </summary>
        private async Task<(string TechFilter, string ToolName, string SerialNo)> ApplyCalendarRoleBasedFiltering(
            string techFilter, string toolName, string serialNo, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return (techFilter, toolName, serialNo);
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return (techFilter, toolName, serialNo);
                }

                var normalizedStatus = (employeeStatusData.Status ?? "").Trim().ToLower();
                var userEmp = (userEmpID ?? "").Trim();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // Technicians: restrict techFilter to their own ID, but allow tool/serial filters
                    return (userEmp, toolName, serialNo);
                }

                // Managers and other roles: use original filters
                return (techFilter, toolName, serialNo);
            }
            catch (Exception)
            {
                return (techFilter, toolName, serialNo);
            }
        }

        /// <summary>
        /// Applies role-based filtering to tech ID access
        /// </summary>
        private async Task<string> ApplyTechIdFiltering(string requestedTechId, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return requestedTechId; // No user context, return as-is
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return requestedTechId;
                }

                var normalizedStatus = (employeeStatusData.Status ?? "").Trim().ToLower();
                var userEmp = (userEmpID ?? "").Trim();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // Technicians: only allow access to their own tech ID
                    if (!string.Equals(requestedTechId.Trim(), userEmp, StringComparison.OrdinalIgnoreCase))
                    {
                        throw new UnauthorizedAccessException("Access denied: You can only access your own tech tools data.");
                    }
                    return userEmp;
                }

                // Managers and other roles: full access
                return requestedTechId;
            }
            catch (UnauthorizedAccessException)
            {
                throw; // Re-throw authorization exceptions
            }
            catch (Exception)
            {
                return requestedTechId; // If error occurs, return original tech ID
            }
        }

        /// <summary>
        /// Applies role-based filtering to tool names
        /// </summary>
        private async Task<string> ApplyToolFilterByRole(string requestedToolName, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return requestedToolName;
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return requestedToolName;
                }

                var normalizedStatus = (employeeStatusData.Status ?? "").Trim().ToLower();

                // For now, allow all tool filters regardless of role
                // Could be enhanced to restrict certain tools based on role if needed
                return requestedToolName;
            }
            catch (Exception)
            {
                return requestedToolName;
            }
        }

        /// <summary>
        /// Validates if user has access to execute queries
        /// </summary>
        private async Task ValidateQueryExecutionAccess(string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return; // No user context, allow access
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return;
                }

                var normalizedStatus = (employeeStatusData.Status ?? "").Trim().ToLower();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // Technicians: block query execution for security
                    throw new UnauthorizedAccessException("Access denied: Technicians do not have permission to execute queries.");
                }

                // Managers and other roles: allow query execution
            }
            catch (UnauthorizedAccessException)
            {
                throw; // Re-throw authorization exceptions
            }
            catch (Exception)
            {
                // If error occurs, allow access (fail open for non-critical operations)
                return;
            }
        }

        private async Task<EmployeeStatusDto?> GetEmployeeStatusAsync(string windowsID)
        {
            try
            {
                var employeeStatusList = await _commonRepository.GetEmployeeStatusForJobListAsync(windowsID);
                var firstResult = employeeStatusList?.FirstOrDefault();
                
                if (firstResult != null)
                {
                    return new EmployeeStatusDto
                    {
                        EmpID = ((dynamic)firstResult).EmpID?.ToString() ?? string.Empty,
                        Status = ((dynamic)firstResult).Status?.ToString() ?? string.Empty
                    };
                }
                
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private static bool IsTechnicianRole(string normalizedStatus)
        {
            return normalizedStatus == "technician" || 
                   normalizedStatus == "techmanager" || 
                   normalizedStatus == "tech manager" || 
                   normalizedStatus.Contains("tech");
        }

        private static bool IsManagerRole(string normalizedStatus)
        {
            return normalizedStatus == "manager" || 
                   normalizedStatus == "other" || 
                   normalizedStatus.Contains("manager");
        }

        #endregion

        #region Legacy Compatibility Methods (Without Role Filtering)

        /// <summary>
        /// Gets tools tracking technicians data using the ToolsTrackingTechs stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<List<ToolsTrackingTechsDto>> GetToolsTrackingTechsAsync()
        {
            return await GetToolsTrackingTechsAsync(null, null);
        }

        /// <summary>
        /// Gets tool serial numbers using the GetTechToolSerialNos stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<List<TechToolSerialNoDto>> GetTechToolSerialNosAsync(string toolName)
        {
            return await GetTechToolSerialNosAsync(toolName, null, null);
        }

        /// <summary>
        /// Gets tools calendar tracking data using the aaToolsCalendar_Tracking stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<ToolsCalendarTrackingResultDto> GetToolsCalendarTrackingAsync(
            DateTime startDate,
            DateTime endDate,
            string toolName = "All",
            string serialNo = "All",
            string techFilter = "All")
        {
            return await GetToolsCalendarTrackingAsync(startDate, endDate, toolName, serialNo, techFilter, null, null);
        }

        /// <summary>
        /// Gets tech tools misc kit data by tech ID using the GetTechToolsMiscKitByTechID stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<TechToolsMiscKitResultDto> GetTechToolsMiscKitByTechIdAsync(string techId)
        {
            return await GetTechToolsMiscKitByTechIdAsync(techId, null, null);
        }

        /// <summary>
        /// Gets tools tracking count by tech ID using the GetToolsTrackingCount stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<int> GetToolsTrackingCountAsync(string techId)
        {
            return await GetToolsTrackingCountAsync(techId, null, null);
        }

        /// <summary>
        /// Executes insert tech tools query using the ExecuteInsertTechToolsQuery stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<ExecuteInsertTechToolsQueryResultDto> ExecuteInsertTechToolsQueryAsync(string query)
        {
            return await ExecuteInsertTechToolsQueryAsync(query, null, null);
        }

        /// <summary>
        /// Deletes tools tracking data by tech ID using the DeleteToolsTracking stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<DeleteToolsTrackingResultDto> DeleteToolsTrackingAsync(string techId)
        {
            return await DeleteToolsTrackingAsync(techId, null, null);
        }

        /// <summary>
        /// Gets tech tools tracking data by tech ID using the GetTechToolsTrackingByTechID stored procedure
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<List<TechToolsTrackingDto>> GetTechToolsTrackingByTechIdAsync(string techId)
        {
            return await GetTechToolsTrackingByTechIdAsync(techId, null, null);
        }

        /// <summary>
        /// Saves/Updates tech tools tracking data using legacy DELETE-INSERT pattern
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<SaveTechToolsTrackingResultDto> SaveTechToolsTrackingAsync(SaveTechToolsTrackingRequestDto request)
        {
            return await SaveTechToolsTrackingAsync(request, null, null);
        }

        /// <summary>
        /// Gets file attachments for a tech ID (legacy DisplayFile equivalent)
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<List<ToolsTrackingFileDto>> GetFilesAsync(string techId)
        {
            return await GetFilesAsync(techId, null, null);
        }

        /// <summary>
        /// Uploads a file for a tech ID (legacy SaveFile equivalent)
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<FileUploadResultDto> UploadFileAsync(string techId, string fileName, Stream fileStream)
        {
            return await UploadFileAsync(techId, fileName, fileStream, null, null);
        }

        /// <summary>
        /// Deletes a file for a tech ID
        /// Legacy method without role-based filtering for backward compatibility
        /// </summary>
        public async Task<bool> DeleteFileAsync(string techId, string fileName)
        {
            return await DeleteFileAsync(techId, fileName, null, null);
        }

        #endregion

        #region Private Helper Methods

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