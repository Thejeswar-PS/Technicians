using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface ITestEngineerJobsRepository
    {
        Task<TestEngineerJobsResponse> GetTestEngineerJobsAsync(TestEngineerJobsRequestDto request);
        Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request);
        Task<IEnumerable<EngineerDto>> GetEngineersAsync();
        Task<TestEngineerJobsEntryResponse> GetTestEngineerJobByIdAsync(int id);
        Task<TestEngineerJobsEntryResponse> CreateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request);
        Task<TestEngineerJobsEntryResponse> UpdateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request);
        Task<TestEngineerJobsEntryResponse> DeleteTestEngineerJobAsync(int id);
        Task<NextRowIdResponse> GetNextRowIdAsync();
        Task<EmployeeDepartmentResponse> GetEmployeeDeptByUserIdAsync(string adUserId);

        // ADDED: File management methods
        Task<FileOperationResponse> UploadFileAsync(FileUploadRequestDto request);
        Task<FileOperationResponse> GetJobFilesAsync(int jobId, string jobNumber);
        Task<FileDownloadResponse> DownloadFileAsync(string filePath);
        Task<FileOperationResponse> DeleteFileAsync(string filePath);
    }

    public class TestEngineerJobsRepository : ITestEngineerJobsRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<TestEngineerJobsRepository> _logger;
        private readonly ErrorLogRepository _errorLog;
        private readonly IConfiguration _configuration;

        private const string LoggerName = "Technicians.TestEngineerJobsRepository";

        // ADDED: File upload constants matching legacy implementation
        private const string UPLOAD_FILE_TYPES = "jpg,gif,doc,bmp,xls,png,txt,xlsx,docx,pdf,jpeg";
        private const long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        private readonly string _fileUploadBasePath;

        public TestEngineerJobsRepository(
            IConfiguration configuration,
            ILogger<TestEngineerJobsRepository> logger,
            ErrorLogRepository errorLog)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");

            _logger = logger;
            _errorLog = errorLog;
            _configuration = configuration;

            // ADDED: Get file upload path from configuration or use legacy default
            _fileUploadBasePath = _configuration.GetValue<string>("FileUploadBasePath") 
                ?? @"\\dcg-file-v\home$\Parts Testing\TestCommon";
        }

        #region GET ALL (GRID)

        public async Task<TestEngineerJobsResponse> GetTestEngineerJobsAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // Fixed query based on actual database schema from debug output
                var sql = $@"
                    SELECT
                        RowId as RowID,
                        JobNumber,
                        AssignedEngineer,
                        Status,
                        Location,
                        WorkType,
                        ProjectedDate,
                        CompletedDate,
                        EmergencyETA,
                        CreatedOn,
                        DescriptionNotes AS Description,
                        '' as Customer,
                        QC_Cleaned,
                        QC_Torque,
                        QC_Inspected
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer IS NULL OR @Engineer = '' OR AssignedEngineer = @Engineer)
                    AND (@Status IS NULL OR @Status = '' OR Status = @Status)
                    AND (@Location IS NULL OR @Location = '' OR Location = @Location)
                    AND (
                        @Search IS NULL OR @Search = '' OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    ORDER BY {GetSafeSortColumn(request.SortColumn)} {GetSafeSortDirection(request.SortDirection)}";

                var parameters = new
                {
                    Engineer = string.IsNullOrWhiteSpace(request.Engineer) ? "" : request.Engineer,
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "" : request.Status,
                    Location = string.IsNullOrWhiteSpace(request.Location) ? "" : request.Location,
                    Search = string.IsNullOrWhiteSpace(request.Search) ? "" : request.Search
                };

                _logger.LogInformation("Executing SQL: {SQL}", sql);
                _logger.LogInformation("Parameters: Engineer='{Engineer}', Status='{Status}', Location='{Location}', Search='{Search}'", 
                    parameters.Engineer, parameters.Status, parameters.Location, parameters.Search);

                var jobs = (await connection.QueryAsync<TestEngineerJobDto>(sql, parameters)).ToList();

                _logger.LogInformation("Query returned {Count} records", jobs.Count);

                // Compute UI fields and legacy logic
                foreach (var job in jobs)
                {
                    // CHANGED: JobNumber now gets the formatted RowID value (000001, 000002, etc.)
                    var originalJobNumber = job.JobNumber; // Store original job number
                    job.JobNumber = job.RowID.ToString("000000"); // JobNumber now shows formatted RowID
                    job.SerialNo = originalJobNumber; // SerialNo keeps the original JobNumber from database
                    
                    // COMMENTED OUT: JobNumberFormatted is no longer set
                    // job.JobNumberFormatted = job.RowID.ToString("000000");

                    var isClosed = job.Status?.Equals("Closed", StringComparison.OrdinalIgnoreCase) == true;

                    var isOverdue =
                        !isClosed &&
                        job.ProjectedDate.HasValue &&
                        job.ProjectedDate.Value.Date < DateTime.Today;

                    var isEmergency =
                        job.WorkType?.Equals("Emergency", StringComparison.OrdinalIgnoreCase) == true;

                    job.IsOverdue = isOverdue;
                    job.IsEmergency = isEmergency && !isOverdue;
                }

                return new TestEngineerJobsResponse
                {
                    Success = true,
                    Data = jobs,
                    TotalRecords = jobs.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving TestEngineerJobs: {Message}", ex.Message);
                return new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = $"Failed to retrieve test engineer jobs: {ex.Message}",
                    Data = new List<TestEngineerJobDto>(),
                    TotalRecords = 0
                };
            }
        }

        #endregion

        #region EMPLOYEE DEPARTMENT LOOKUP

        /// <summary>
        /// Gets employee department information by Active Directory/Windows user ID
        /// Uses GetEmployeeDeptByUserID stored procedure for Test Engineer Jobs authorization
        /// Returns employee ID and department if found, or the provided user ID with 'Other' department if not found
        /// </summary>
        public async Task<EmployeeDepartmentResponse> GetEmployeeDeptByUserIdAsync(string adUserId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                parameters.Add("@ADUserID", adUserId, DbType.String, size: 100);

                var result = await connection.QueryFirstOrDefaultAsync<EmployeeDepartmentDto>(
                    "GetEmployeeDeptByUserID",
                    parameters,
                    commandType: CommandType.StoredProcedure);

                if (result != null)
                {
                    _logger.LogInformation("Retrieved employee department for AD User: {ADUserID} - EmpID: {EmpID}, Department: {Department}", 
                        adUserId, result.EmpID, result.Department);
                    
                    return new EmployeeDepartmentResponse
                    {
                        Success = true,
                        Data = result,
                        Message = $"Successfully retrieved department information for user: {adUserId}"
                    };
                }

                // If no result from stored procedure, return fallback (should not happen due to SP logic, but safety check)
                var fallback = new EmployeeDepartmentDto
                {
                    EmpID = adUserId,
                    Department = "Other"
                };

                _logger.LogInformation("No employee found for AD User: {ADUserID}, returning fallback with 'Other' department", adUserId);
                
                return new EmployeeDepartmentResponse
                {
                    Success = true,
                    Data = fallback,
                    Message = $"User not found in employee database, assigned 'Other' department: {adUserId}"
                };
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetEmployeeDeptByUserIdAsync", adUserId);
                _logger.LogError(sqlEx, "SQL error retrieving employee department for AD User: {ADUserID}", adUserId);
                
                return new EmployeeDepartmentResponse
                {
                    Success = false,
                    Message = $"Database error retrieving employee department: {sqlEx.Message}"
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetEmployeeDeptByUserIdAsync", adUserId);
                _logger.LogError(ex, "Error retrieving employee department for AD User: {ADUserID}", adUserId);
                
                return new EmployeeDepartmentResponse
                {
                    Success = false,
                    Message = $"Error retrieving employee department: {ex.Message}"
                };
            }
        }

        #endregion

        #region GET BY ID

        public async Task<TestEngineerJobsEntryResponse> GetTestEngineerJobByIdAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT
                        RowId as RowID,
                        JobNumber,
                        WorkType,
                        AssignedEngineer,
                        Status,
                        ProjectedDate,
                        CompletedDate,
                        EmergencyETA,
                        DescriptionNotes,
                        Location,
                        QC_Cleaned,
                        QC_Torque,
                        QC_Inspected,
                        CreatedOn,
                        ModifiedOn,
                        CreatedBy,
                        ModifiedBy
                    FROM TestEngineerJobs
                    WHERE RowId = @Id";

                var job = await connection.QuerySingleOrDefaultAsync<TestEngineerJobsEntryDto>(sql, new { Id = id });

                if (job == null)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Data = job
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving TestEngineerJob by ID: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error retrieving record: {ex.Message}"
                };
            }
        }

        #endregion

        #region CREATE

        public async Task<TestEngineerJobsEntryResponse> CreateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // FIXED: Get current user for audit fields - matches legacy LP.getUID()
                var currentUser = GetCurrentWindowsUserId();

                var sql = @"
                    INSERT INTO TestEngineerJobs
                    (JobNumber, WorkType, EmergencyETA, AssignedEngineer, Location,
                     ProjectedDate, CompletedDate, DescriptionNotes, Status,
                     QC_Cleaned, QC_Torque, QC_Inspected,
                     CreatedBy, CreatedOn, ModifiedBy, ModifiedOn)
                    VALUES
                    (@JobNumber, @WorkType, @EmergencyETA, @AssignedEngineer, @Location,
                     @ProjectedDate, @CompletedDate, @DescriptionNotes, @Status,
                     @QCCleaned, @QCTorque, @QCInspected,
                     @CreatedBy, GETDATE(), @ModifiedBy, GETDATE());

                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                var parameters = new
                {
                    request.JobNumber,
                    request.WorkType,
                    request.EmergencyETA,
                    request.AssignedEngineer,
                    request.Location,
                    request.ProjectedDate,
                    request.CompletedDate,
                    request.DescriptionNotes,
                    request.Status,
                    request.QCCleaned,
                    request.QCTorque,
                    request.QCInspected,
                    CreatedBy = currentUser,     
                    ModifiedBy = currentUser     
                };

                var newId = await connection.QuerySingleAsync<int>(sql, parameters);

                _logger.LogInformation("Created TestEngineerJob with ID {NewId} by user {User}", newId, currentUser);

                return await GetTestEngineerJobByIdAsync(newId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error creating record: {ex.Message}"
                };
            }
        }

        #endregion

        #region UPDATE

        public async Task<TestEngineerJobsEntryResponse> UpdateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var currentUser = GetCurrentWindowsUserId();


                var sql = @"
                    UPDATE TestEngineerJobs
                    SET
                        JobNumber = @JobNumber,
                        WorkType = @WorkType,
                        EmergencyETA = @EmergencyETA,
                        AssignedEngineer = @AssignedEngineer,
                        Location = @Location,
                        ProjectedDate = @ProjectedDate,
                        CompletedDate = @CompletedDate,
                        DescriptionNotes = @DescriptionNotes,
                        Status = @Status,
                        QC_Cleaned = @QCCleaned,
                        QC_Torque = @QCTorque,
                        QC_Inspected = @QCInspected,
                        ModifiedBy = @ModifiedBy,
                        ModifiedOn = GETDATE()
                    WHERE RowId = @RowID";

                var parameters = new
                {
                    request.RowID,
                    request.JobNumber,
                    request.WorkType,
                    request.EmergencyETA,
                    request.AssignedEngineer,
                    request.Location,
                    request.ProjectedDate,
                    request.CompletedDate,
                    request.DescriptionNotes,
                    request.Status,
                    request.QCCleaned,
                    request.QCTorque,
                    request.QCInspected,
                    ModifiedBy = currentUser     
                };

                var rows = await connection.ExecuteAsync(sql, parameters);

                if (rows == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return await GetTestEngineerJobByIdAsync(request.RowID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error updating record: {ex.Message}"
                };
            }
        }

        #endregion

        #region DELETE

        public async Task<TestEngineerJobsEntryResponse> DeleteTestEngineerJobAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = "DELETE FROM TestEngineerJobs WHERE RowId = @Id";

                var rows = await connection.ExecuteAsync(sql, new { Id = id });

                if (rows == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Message = "Deleted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error deleting record: {ex.Message}"
                };
            }
        }

        #endregion

        #region NEXT ROW ID

        public async Task<NextRowIdResponse> GetNextRowIdAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            var nextId = await connection.QuerySingleAsync<int>(
                "SELECT ISNULL(MAX(RowId),0) + 1 FROM TestEngineerJobs");

            return new NextRowIdResponse
            {
                Success = true,
                NextRowId = nextId,
                FormattedRowId = nextId.ToString("000000")
            };
        }

        #endregion

        #region CHART DATA

        public async Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT AssignedEngineer, Status, COUNT(*) AS JobCount
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer IS NULL OR @Engineer = '' OR AssignedEngineer = @Engineer)
                    AND (@Status IS NULL OR @Status = '' OR Status = @Status)
                    AND (@Location IS NULL OR @Location = '' OR Location = @Location)
                    AND (
                        @Search IS NULL OR @Search = '' OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    GROUP BY AssignedEngineer, Status";

                var parameters = new
                {
                    Engineer = string.IsNullOrWhiteSpace(request.Engineer) ? "" : request.Engineer,
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "" : request.Status,
                    Location = string.IsNullOrWhiteSpace(request.Location) ? "" : request.Location,
                    Search = string.IsNullOrWhiteSpace(request.Search) ? "" : request.Search
                };

                var results = await connection.QueryAsync(sql, parameters);

                var engineerData = results.Select(row => new EngineerChartDto
                {
                    Engineer = row.AssignedEngineer?.ToString() ?? "",
                    Status = row.Status?.ToString() ?? "",
                    Count = Convert.ToInt32(row.JobCount)
                }).ToList();

                var statusData = engineerData
                    .GroupBy(e => e.Status)
                    .Select(g => new StatusChartDto
                    {
                        Status = g.Key,
                        Count = g.Sum(e => e.Count)
                    }).ToList();

                return new TestEngineerJobsChartsResponse
                {
                    EngineerData = engineerData,
                    StatusData = statusData
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChartDataAsync: {Message}", ex.Message);
                return new TestEngineerJobsChartsResponse();
            }
        }

        #endregion

        #region ENGINEERS

        /// <summary>
        /// Gets engineers using updated GetEmployeeNamesByDept stored procedure
        /// Updated to handle new SP logic with WindowsID field and enhanced Testing department support
        /// </summary>
        public async Task<IEnumerable<EngineerDto>> GetEngineersAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                // UPDATED: Use "Testing" instead of "T" to match the enhanced SP logic
                // This will now return employees from Testing, Test Manager, and Board Repair departments
                parameters.Add("@Department", "Testing", DbType.String, size: 50);

                _logger.LogInformation("Calling GetEmployeeNamesByDept SP with 'Testing' department parameter");

                var dynamicResults = await connection.QueryAsync(
                    "GetEmployeeNamesByDept",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 30
                );

                var engineers = dynamicResults.Select(row =>
                {
                    var rowDict = (IDictionary<string, object>)row;
                    return new EngineerDto
                    {
                        EmpID = GetSafeStringValue(rowDict, "EmpID"),       // NEW: From updated SP
                        EmpName = GetSafeStringValue(rowDict, "EmpName"),     // Existing
                        Email = GetSafeStringValue(rowDict, "Email"),       // NEW: From updated SP  
                        WindowsID = GetSafeStringValue(rowDict, "WindowsID")   // NEW: From updated SP
                    };
                }).ToList();

                _logger.LogInformation("Retrieved {Count} engineers from GetEmployeeNamesByDept SP (Testing department)", engineers.Count);
                _logger.LogInformation("Engineers from SP: {Engineers}", string.Join(", ", engineers.Select(e => e.EmpName)));

                // Add hardcoded engineers like in legacy 
                engineers.Add(new EngineerDto { EmpName = "Senthil Munuswamy" });
                engineers.Add(new EngineerDto { EmpName = "Bharathi Mathivanan" });
                engineers.Add(new EngineerDto { EmpName = "Raja Ranganathan" });

                _logger.LogInformation("Total engineers after adding hardcoded entries: {Count}", engineers.Count);

                return engineers.Distinct().ToList(); // Remove duplicates if any
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetEngineersAsync: {Message}", ex.Message);
                
                // ENHANCED: Return hardcoded fallback list if SP fails
                var fallbackEngineers = new List<EngineerDto>
                {
                    new() { EmpName = "Senthil Munuswamy" },
                    new() { EmpName = "Bharathi Mathivanan" },
                    new() { EmpName = "Raja Ranganathan" },
                    new() { EmpName = "Samuel Gubbi" }
                };

                _logger.LogWarning("Using fallback engineer list due to SP error. Count: {Count}", fallbackEngineers.Count);
                return fallbackEngineers;
            }
        }

        #endregion

        #region SAFE SORT

        private static string GetSafeSortColumn(string? column)
        {
            var allowed = new[]
            {
                "RowId",
                "JobNumber",
                "AssignedEngineer",
                "Status",
                "Location",
                "WorkType",
                "ProjectedDate",
                "CreatedOn"
            };

            return allowed.Contains(column, StringComparer.OrdinalIgnoreCase)
                ? column!
                : "RowId";
        }

        private static string GetSafeSortDirection(string? direction)
        {
            return direction?.ToUpper() == "ASC" ? "ASC" : "DESC";
        }

        #endregion

        #region HELPER METHODS

        private static string GetSafeStringValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                return value.ToString() ?? string.Empty;
            }
            return string.Empty;
        }

        /// <summary>
        /// Gets current Windows user ID - equivalent to legacy LP.getUID() method
        /// Matches the pattern used in PartsTestRepository and DCGEmployeeRepository
        /// </summary>
        private string GetCurrentWindowsUserId()
        {
            try
            {
                // Try to get from Windows Identity first
                if (System.Security.Principal.WindowsIdentity.GetCurrent()?.Name != null)
                {
                    var windowsName = System.Security.Principal.WindowsIdentity.GetCurrent().Name;
                    // Extract username from DOMAIN\username format - matches legacy LP.getUID()
                    return windowsName.Contains('\\') ? windowsName.Split('\\')[1] : windowsName;
                }

                // Fallback to Environment user
                return Environment.UserName ?? "SYSTEM";
            }
            catch
            {
                // Ultimate fallback
                return Environment.UserName ?? "SYSTEM";
            }
        }

        #endregion

        #region FILE MANAGEMENT

        /// <summary>
        /// Uploads a file for a Test Engineer Job - matches legacy SaveFile() functionality
        /// </summary>
        public async Task<FileOperationResponse> UploadFileAsync(FileUploadRequestDto request)
        {
            try
            {
                // Validate file
                if (request.File == null || request.File.Length == 0)
                {
                    return new FileOperationResponse
                    {
                        Success = false,
                        Message = "No file selected for upload"
                    };
                }

                // Validate file size
                if (request.File.Length > MAX_FILE_SIZE)
                {
                    return new FileOperationResponse
                    {
                        Success = false,
                        Message = $"File size exceeds maximum limit of {MAX_FILE_SIZE / 1024 / 1024}MB"
                    };
                }

                // Validate file type - matches legacy UPLOADFILETYPE
                var fileName = request.File.FileName;
                var fileExtension = Path.GetExtension(fileName)?.TrimStart('.').ToLower();
                var allowedTypes = UPLOAD_FILE_TYPES.Split(',');

                if (string.IsNullOrEmpty(fileExtension) || !allowedTypes.Contains(fileExtension))
                {
                    return new FileOperationResponse
                    {
                        Success = false,
                        Message = $"File type not allowed. Supported types: {UPLOAD_FILE_TYPES}"
                    };
                }

                // Create job-specific directory - matches legacy logic
                var jobFolderPath = Path.Combine(_fileUploadBasePath, request.JobNumber);
                var filePath = Path.Combine(jobFolderPath, fileName);

                // Create directory if it doesn't exist
                if (!Directory.Exists(jobFolderPath))
                {
                    Directory.CreateDirectory(jobFolderPath);
                    _logger.LogInformation("Created directory for job {JobNumber}: {Path}", request.JobNumber, jobFolderPath);
                }

                // Check if file already exists
                if (File.Exists(filePath))
                {
                    return new FileOperationResponse
                    {
                        Success = false,
                        Message = "A file with the same name already exists"
                    };
                }

                // Save file to network share
                using var fileStream = new FileStream(filePath, FileMode.Create);
                await request.File.CopyToAsync(fileStream);

                _logger.LogInformation("File uploaded successfully: {FileName} for job {JobNumber}", fileName, request.JobNumber);

                // Return updated file list
                return await GetJobFilesAsync(request.JobId, request.JobNumber);
            }
            catch (UnauthorizedAccessException ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UploadFileAsync", request.JobNumber);
                _logger.LogError(ex, "Access denied when uploading file for job {JobNumber}", request.JobNumber);
                
                return new FileOperationResponse
                {
                    Success = false,
                    Message = "Access denied to file storage location. Please contact administrator."
                };
            }
            catch (DirectoryNotFoundException ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UploadFileAsync", request.JobNumber);
                _logger.LogError(ex, "Directory not found when uploading file for job {JobNumber}", request.JobNumber);
                
                return new FileOperationResponse
                {
                    Success = false,
                    Message = "File storage location not accessible. Please contact administrator."
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UploadFileAsync", request.JobNumber);
                _logger.LogError(ex, "Error uploading file for job {JobNumber}", request.JobNumber);
                
                return new FileOperationResponse
                {
                    Success = false,
                    Message = $"Error uploading file: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Gets all files for a specific job - matches legacy LoadFiles() functionality
        /// </summary>
        public async Task<FileOperationResponse> GetJobFilesAsync(int jobId, string jobNumber)
        {
            try
            {
                var jobFolderPath = Path.Combine(_fileUploadBasePath, jobNumber);
                var files = new List<TestEngineerJobFileDto>();

                if (Directory.Exists(jobFolderPath))
                {
                    var fileInfos = new DirectoryInfo(jobFolderPath).GetFiles();

                    files = fileInfos.Select(fi => new TestEngineerJobFileDto
                    {
                        FileName = fi.Name,
                        FilePath = fi.FullName,
                        FileSize = fi.Length,
                        UploadedOn = fi.CreationTime,
                        UploadedBy = "" // Could be enhanced to track uploader
                    })
                    .OrderByDescending(f => f.UploadedOn)
                    .ToList();

                    _logger.LogInformation("Retrieved {Count} files for job {JobNumber}", files.Count, jobNumber);
                }

                return new FileOperationResponse
                {
                    Success = true,
                    Files = files,
                    Message = $"Retrieved {files.Count} files for job {jobNumber}"
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetJobFilesAsync", jobNumber);
                _logger.LogError(ex, "Error getting files for job {JobNumber}", jobNumber);
                
                return new FileOperationResponse
                {
                    Success = false,
                    Message = $"Error retrieving files: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Downloads a file - matches legacy DownloadFile functionality
        /// </summary>
        public async Task<FileDownloadResponse> DownloadFileAsync(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    return new FileDownloadResponse
                    {
                        Success = false,
                        Message = "File not found"
                    };
                }

                var fileName = Path.GetFileName(filePath);
                var fileBytes = await File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(fileName);

                _logger.LogInformation("File downloaded: {FileName}, Size: {Size} bytes", fileName, fileBytes.Length);

                return new FileDownloadResponse
                {
                    Success = true,
                    FileContent = fileBytes,
                    FileName = fileName,
                    ContentType = contentType,
                    Message = "File retrieved successfully"
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DownloadFileAsync", filePath);
                _logger.LogError(ex, "Error downloading file {FilePath}", filePath);
                
                return new FileDownloadResponse
                {
                    Success = false,
                    Message = $"Error downloading file: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Deletes a file from the job folder
        /// </summary>
        public async Task<FileOperationResponse> DeleteFileAsync(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    return new FileOperationResponse
                    {
                        Success = false,
                        Message = "File not found"
                    };
                }

                var fileName = Path.GetFileName(filePath);
                var jobNumber = Path.GetFileName(Path.GetDirectoryName(filePath));

                File.Delete(filePath);

                _logger.LogInformation("File deleted: {FileName} from job {JobNumber}", fileName, jobNumber);

                // Return updated file list
                var jobId = 0; // You might need to get this from the job number
                return await GetJobFilesAsync(jobId, jobNumber ?? "");
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "DeleteFileAsync", filePath);
                _logger.LogError(ex, "Error deleting file {FilePath}", filePath);
                
                return new FileOperationResponse
                {
                    Success = false,
                    Message = $"Error deleting file: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Gets MIME content type for file download
        /// </summary>
        private static string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName)?.ToLower();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                _ => "application/octet-stream"
            };
        }

        #endregion
    }
}