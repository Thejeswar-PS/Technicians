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
        /// Gets parts test list data using the GetPartsTestList stored procedure
        /// Updated to focus on PartsTest operations specifically
        /// </summary>
        /// <param name="rowIndex">Row index parameter for the stored procedure</param>
        /// <param name="source">Source type: "PartsTest", "OrderRequest", or other</param>
        /// <returns>DataSet containing the results with AutoGenID calculated field</returns>
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

                using var command = new SqlCommand(storedProcedureName, connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@RowIndex", rowIndex);

                using var adapter = new SqlDataAdapter(command);
                var dataSet = new DataSet();
                adapter.Fill(dataSet);

                // Log for debugging - matches legacy error handling pattern
                if (dataSet.Tables.Count == 0 || dataSet.Tables[0].Rows.Count == 0)
                {
                    // Return empty dataset but don't throw error (matches legacy behavior)
                    return dataSet;
                }

                return dataSet;
            }
            catch (Exception ex)
            {
                // Match legacy error handling - return empty dataset
                var emptyDataSet = new DataSet();
                // You might want to log the error instead of throwing
                // Legacy code sets ErrMsg but continues processing
                throw new Exception($"Error retrieving parts test list for source '{source}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets parts test status data with filtering - LEGACY FUNCTIONALITY
        /// </summary>
        /// <param name="jobType">Job type filter</param>
        /// <param name="priority">Priority filter (All, Urgent, etc.)</param>
        /// <param name="archive">Archive filter (0=Active, 1=Archived)</param>
        /// <param name="make">Make filter</param>
        /// <param name="model">Model filter</param>
        /// <param name="assignedTo">Assigned To filter</param>
        /// <returns>Complete dataset with parts data, filters, and chart data</returns>
        public async Task<DataSet> GetPartsTestStatusAsync(string jobType = "", string priority = "All", string archive = "0", string make = "", string model = "", string assignedTo = "")
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("GetPartsTestStatus", connection);
                command.CommandType = CommandType.StoredProcedure;
                
                // Add parameters exactly like legacy
                command.Parameters.AddWithValue("@JobType", string.IsNullOrEmpty(jobType) ? "" : jobType);
                command.Parameters.AddWithValue("@Priority", priority == "All" ? "" : priority);
                command.Parameters.AddWithValue("@Archive", archive);
                command.Parameters.AddWithValue("@Make", string.IsNullOrEmpty(make) ? "" : make);
                command.Parameters.AddWithValue("@Model", string.IsNullOrEmpty(model) ? "" : model);
                command.Parameters.AddWithValue("@AssignedTo", string.IsNullOrEmpty(assignedTo) ? "" : assignedTo);

                using var adapter = new SqlDataAdapter(command);
                var dataSet = new DataSet();
                adapter.Fill(dataSet);

                return dataSet;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving parts test status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets dashboard chart data for Parts Test Status - LEGACY FUNCTIONALITY
        /// </summary>
        /// <param name="jobType">Job type filter</param>
        /// <param name="priority">Priority filter</param>
        /// <param name="archive">Archive filter</param>
        /// <param name="make">Make filter</param>
        /// <param name="model">Model filter</param>
        /// <param name="assignedTo">Assigned To filter</param>
        /// <returns>Chart data for status counts and job type distribution</returns>
        public async Task<PartsTestDashboardDto> GetPartsTestDashboardAsync(string jobType = "", string priority = "All", string archive = "0", string make = "", string model = "", string assignedTo = "")
        {
            try
            {
                var dataSet = await GetPartsTestStatusAsync(jobType, priority, archive, make, model, assignedTo);
                var dashboard = new PartsTestDashboardDto();

                if (dataSet.Tables.Count >= 5)
                {
                    // Chart 1: Status counts (from table index 4 like legacy)
                    if (dataSet.Tables[4].Rows.Count > 0)
                    {
                        var row = dataSet.Tables[4].Rows[0];
                        dashboard.StatusCounts = new PartsTestStatusCountsDto
                        {
                            EmergencyCount = Convert.ToInt32(row["EmergencyCount"] ?? 0),
                            OverdueCount = Convert.ToInt32(row["OverdueCount"] ?? 0),
                            SameDayCount = Convert.ToInt32(row["SameDayCount"] ?? 0),
                            CurrentWeekCount = Convert.ToInt32(row["CurrentWeekCount"] ?? 0)
                        };
                    }

                    // Chart 2: Job type distribution (from table index 5 like legacy)
                    if (dataSet.Tables.Count > 5 && dataSet.Tables[5].Rows.Count > 0)
                    {
                        dashboard.JobTypeDistribution = new List<JobTypeCountDto>();
                        foreach (DataRow row in dataSet.Tables[5].Rows)
                        {
                            dashboard.JobTypeDistribution.Add(new JobTypeCountDto
                            {
                                JobType = row["JobType"]?.ToString() ?? "",
                                TotalCount = Convert.ToInt32(row["TotalCount"] ?? 0)
                            });
                        }
                    }
                }

                return dashboard;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving dashboard data: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets parts test status with business logic applied - LEGACY FUNCTIONALITY
        /// </summary>
        //public async Task<PartsTestStatusResponseDto> GetPartsTestStatusWithLogicAsync(PartsTestStatusRequestDto request)
        //{
        //    try
        //    {
        //        var dataSet = await GetPartsTestStatusAsync(
        //            request.JobType, 
        //            request.Priority, 
        //            request.Archive, 
        //            request.Make, 
        //            request.Model, 
        //            request.AssignedTo);

        //        var response = new PartsTestStatusResponseDto();

        //        if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0)
        //        {
        //            // Main data with business logic applied
        //            var partsData = new List<PartsTestStatusItemDto>();
                    
        //            foreach (DataRow row in dataSet.Tables[0].Rows)
        //            {
        //                var item = new PartsTestStatusItemDto
        //                {
        //                    CallNbr = row["CallNbr"]?.ToString() ?? "",
        //                    SiteID = row["SiteID"]?.ToString() ?? "",
        //                    Make = row["Make"]?.ToString() ?? "",
        //                    Model = row["Model"]?.ToString() ?? "",
        //                    ManufPartNo = row["ManufPartNo"]?.ToString() ?? "",
        //                    DCGPartNo = row["DCGPartNo"]?.ToString() ?? "",
        //                    SerialNo = row["SerialNo"]?.ToString() ?? "",
        //                    Quantity = Convert.ToInt32(row["Quantity"] ?? 0),
        //                    Description = row["Description"]?.ToString() ?? "",
        //                    Priority = row["Priority"]?.ToString() ?? "",
        //                    AssignedTo = row["AssignedTo"]?.ToString() ?? "",
        //                    DueDate = row["DueDate"] == DBNull.Value ? null : Convert.ToDateTime(row["DueDate"]),
        //                    QCWorkStatus = row["QCWorkStatus"]?.ToString() ?? "",
        //                    AssyWorkStatus = row["AssyWorkStatus"]?.ToString() ?? "",
        //                    IsPassed = Convert.ToBoolean(row["IsPassed"] ?? false),
        //                    ProblemNotes = row["ProblemNotes"]?.ToString() ?? "",
        //                    ResolveNotes = row["ResolveNotes"]?.ToString() ?? "",
        //                    RowIndex = Convert.ToInt32(row["RowIndex"] ?? 0),
        //                    CreatedBy = row["CreatedBy"]?.ToString() ?? "",
        //                    CreatedOn = row["CreatedOn"] == DBNull.Value ? null : Convert.ToDateTime(row["CreatedOn"]),
        //                    LastModifiedBy = row["LastModifiedBy"]?.ToString() ?? "",
        //                    LastModifiedOn = row["LastModifiedOn"] == DBNull.Value ? null : Convert.ToDateTime(row["LastModifiedOn"])
        //                };

        //                // Apply business logic like legacy
        //                ApplyBusinessLogic(item);
        //                partsData.Add(item);
        //            }

        //            // Apply legacy sorting: Urgent first, then by due date
        //            response.PartsData = partsData
        //                .OrderBy(p => p.Priority?.Equals("Urgent", StringComparison.OrdinalIgnoreCase) == true ? 0 : 1)
        //                .ThenBy(p => p.DueDate)
        //                .ToList();

        //            // Filter options (tables 1, 2, 3 like legacy)
        //            if (dataSet.Tables.Count > 1)
        //            {
        //                response.Makes = dataSet.Tables[1].AsEnumerable()
        //                    .Select(row => row["Make"]?.ToString() ?? "")
        //                    .Where(make => !string.IsNullOrEmpty(make))
        //                    .Distinct()
        //                    .ToList();
        //            }

        //            if (dataSet.Tables.Count > 2)
        //            {
        //                response.Models = dataSet.Tables[2].AsEnumerable()
        //                    .Select(row => row["Model"]?.ToString() ?? "")
        //                    .Where(model => !string.IsNullOrEmpty(model))
        //                    .Distinct()
        //                    .ToList();
        //            }

        //            if (dataSet.Tables.Count > 3)
        //            {
        //                response.AssignedToOptions = dataSet.Tables[3].AsEnumerable()
        //                    .Select(row => row["AssignedTo"]?.ToString() ?? "")
        //                    .Where(assignedTo => !string.IsNullOrEmpty(assignedTo))
        //                    .Distinct()
        //                    .ToList();
        //            }
        //        }

        //        return response;
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error retrieving parts test status with logic: {ex.Message}", ex);
        //    }
        //}

        /// <summary>
        /// Apply business logic like legacy system
        /// </summary>
        private void ApplyBusinessLogic(PartsTestStatusItemDto item)
        {
            if (item.DueDate.HasValue)
            {
                var daysUntilDue = (item.DueDate.Value - DateTime.Today).TotalDays;
                
                // Set status flags like legacy
                item.IsOverdue = daysUntilDue <= 0;
                item.IsDueSoon = daysUntilDue > 0 && daysUntilDue <= 7;
                item.IsUrgent = item.Priority?.Equals("Urgent", StringComparison.OrdinalIgnoreCase) == true;
                
                // Set CSS class like legacy
                if (item.IsOverdue)
                    item.CssClass = "overdue-row";
                else if (item.IsDueSoon)
                    item.CssClass = "week-row";
                else if (item.IsUrgent)
                    item.CssClass = "urgent-row";
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

       
        public async Task SaveUpdatePartsTestAsync(PartsTestDto dto)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            using var command = new SqlCommand("SaveUpdatePartsTestList", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            try
            {
                var currentUser = GetCurrentWindowsUserId();
                string inventorySpecialist = !string.IsNullOrEmpty(dto.InvUserID) ? dto.InvUserID : currentUser;


                // EXACT 37 parameters in the EXACT order from your stored procedure:
                command.Parameters.Add("@JobFrom", SqlDbType.VarChar, 12).Value = dto.JobFrom ?? "";
                command.Parameters.Add("@CallNbr", SqlDbType.VarChar, 21).Value = dto.CallNbr ?? "";
                command.Parameters.Add("@SiteID", SqlDbType.VarChar, 50).Value = dto.SiteID ?? "";
                command.Parameters.Add("@Make", SqlDbType.VarChar, 50).Value = dto.Make ?? "";
                command.Parameters.Add("@Model", SqlDbType.VarChar, 50).Value = dto.Model ?? "";
                command.Parameters.Add("@ManufPartNo", SqlDbType.VarChar, 50).Value = dto.ManufPartNo ?? "";
                command.Parameters.Add("@DCGPartNo", SqlDbType.VarChar, 50).Value = dto.DCGPartNo ?? "";
                command.Parameters.Add("@SerialNo", SqlDbType.VarChar, 50).Value = dto.SerialNo ?? "";
                command.Parameters.Add("@Quantity", SqlDbType.Int).Value = dto.Quantity;
                command.Parameters.Add("@WorkType", SqlDbType.VarChar, 500).Value = dto.WorkType ?? "";
                command.Parameters.Add("@Description", SqlDbType.VarChar, 500).Value = dto.Description ?? "";
                command.Parameters.Add("@Priority", SqlDbType.Char, 15).Value = dto.Priority ?? "";
                command.Parameters.Add("@AssignedTo", SqlDbType.VarChar, 50).Value = dto.AssignedTo ?? "";
                command.Parameters.Add("@DueDate", SqlDbType.DateTime).Value = dto.DueDate ?? (object)DBNull.Value;
                command.Parameters.Add("@KVA", SqlDbType.NChar, 10).Value = dto.KVA ?? "";
                command.Parameters.Add("@Voltage", SqlDbType.NChar, 10).Value = dto.Voltage ?? "";
                command.Parameters.Add("@ProblemNotes", SqlDbType.VarChar, 500).Value = dto.ProblemNotes ?? "";
                command.Parameters.Add("@ResolveNotes", SqlDbType.VarChar, 500).Value = dto.ResolveNotes ?? "";
                command.Parameters.Add("@RowIndex", SqlDbType.Int).Value = dto.RowIndex;
                command.Parameters.Add("@BoardStatus", SqlDbType.Char, 1).Value = dto.BoardStatus ?? "0";
                command.Parameters.Add("@CompWorkDone", SqlDbType.VarChar, 20).Value = dto.CompWorkDone ?? "";
                command.Parameters.Add("@CompWorkStatus", SqlDbType.Char, 1).Value = dto.CompWorkStatus ?? "0";
                command.Parameters.Add("@TestWorkDone", SqlDbType.Char, 10).Value = dto.TestWorkDone ?? "";
                command.Parameters.Add("@TestWorkStatus", SqlDbType.Char, 1).Value = dto.TestWorkStatus ?? "0";

                // Legacy Mapping
                string completedBy = !string.IsNullOrEmpty(dto.TestedBy) ? dto.TestedBy : dto.CompletedBy ?? "";
                string reviewedBy = !string.IsNullOrEmpty(dto.VerifiedBy) ? dto.VerifiedBy : dto.ReviewedBy ?? "";
                string createdBy = !string.IsNullOrEmpty(dto.CreatedBy) ? dto.CreatedBy : currentUser;
                string lastModifiedBy = !string.IsNullOrEmpty(dto.LastModifiedBy) ? dto.LastModifiedBy : currentUser; 

                command.Parameters.Add("@CompletedBy", SqlDbType.VarChar, 50).Value = completedBy;
                command.Parameters.Add("@ReviewedBy", SqlDbType.VarChar, 50).Value = reviewedBy;
                command.Parameters.Add("@IsPassed", SqlDbType.Bit).Value = dto.IsPassed;
                command.Parameters.Add("@AssyWorkDone", SqlDbType.Char, 20).Value = dto.AssyWorkDone ?? "";
                command.Parameters.Add("@AssyProcFollowed", SqlDbType.Char, 1).Value = dto.AssyProcFollowed ?? "0";
                command.Parameters.Add("@AssyWorkStatus", SqlDbType.Char, 1).Value = dto.AssyWorkStatus ?? "0";
                command.Parameters.Add("@QCWorkDone", SqlDbType.VarChar, 50).Value = dto.QCWorkDone ?? "";
                command.Parameters.Add("@QCProcFollowed", SqlDbType.Char, 1).Value = dto.QCProcFollowed ?? "0";
                command.Parameters.Add("@QCApproved", SqlDbType.Char, 1).Value = dto.QCApproved ?? "0";
                command.Parameters.Add("@QCWorkStatus", SqlDbType.Char, 1).Value = dto.QCWorkStatus ?? "0";
                command.Parameters.Add("@CreatedBy", SqlDbType.VarChar, 50).Value = createdBy;

                // ? ADD: The parameters that were missing at the END of the SP signature
                command.Parameters.Add("@QCPassed", SqlDbType.Bit).Value = dto.QCPassed;
                command.Parameters.Add("@QCApprovedBy", SqlDbType.VarChar, 50).Value = dto.QCApprovedBy ?? "";
                command.Parameters.Add("@LastModifiedBy", SqlDbType.VarChar, 50).Value = dto.LastModifiedBy ?? "";

                await command.ExecuteNonQueryAsync();
            }
            catch (SqlException ex)
            {
                throw new Exception($"SQL Error saving parts test for RowIndex {dto.RowIndex}: {ex.Message}", ex);
            }
        }

        /// Query to find exact stored procedure parameters
        //public async Task<string> GetStoredProcedureDefinitionAsync()
        //{
        //    try
        //    {
        //        using var connection = new SqlConnection(_connectionString);
        //        await connection.OpenAsync();

        //        // Get the actual stored procedure definition
        //        var query = @"
        //    SELECT 
        //        ROUTINE_DEFINITION 
        //    FROM INFORMATION_SCHEMA.ROUTINES 
        //    WHERE ROUTINE_NAME = 'SaveUpdatePartsTestList'";

        //        using var command = new SqlCommand(query, connection);
        //        var definition = await command.ExecuteScalarAsync();

        //        return definition?.ToString() ?? "Stored procedure not found";
        //    }
        //    catch (Exception ex)
        //    {
        //        return $"Error: {ex.Message}";
        //    }
        //}

        /// Gets employee names by department using GetEmployeeNamesByDept stored procedure
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
        /// Archive parts test record with Final Approval validation
        /// Enhanced version that combines archive + final approval validation
        /// </summary>
        public async Task<(bool Success, string Message, List<string> ValidationErrors)> ArchivePartsTestRecordAsync(int rowIndex, bool validateFinalApproval = true)
        {
            var validationErrors = new List<string>();

            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Step 1: Check if record exists and get data for validation
                const string checkQuery = @"
                    SELECT Archive, IsPassed, QCPassed, QCWorkStatus, AssyWorkStatus, WorkType, 
                           ReviewedBy, QCApprovedBy, AssyWorkDone, QCWorkDone, AssyProcFollowed, 
                           QCProcFollowed, QCApproved
                    FROM dbo.PartsTestList 
                    WHERE RowIndex = @RowIndex";

                using var checkCommand = new SqlCommand(checkQuery, connection);
                checkCommand.Parameters.AddWithValue("@RowIndex", rowIndex);

                using var reader = await checkCommand.ExecuteReaderAsync();
                
                if (!await reader.ReadAsync())
                {
                    return (false, $"Record with RowIndex {rowIndex} does not exist", new List<string> { "Record not found" });
                }

                // Check if already archived
                var isArchived = Convert.ToBoolean(reader["Archive"]);
                if (isArchived)
                {
                    return (false, "Record is already archived", new List<string> { "Already archived" });
                }

                // Step 2: Perform Final Approval validation if requested
                if (validateFinalApproval)
                {
                    var workType = reader["WorkType"]?.ToString() ?? "";
                    var workTypes = workType.Split(',');
                    var isAssemblyJob = workTypes.Any(wt => wt.Trim() == "3" || wt.Trim() == "7" || wt.Trim() == "8");

                    // Assembly validation (for assembly job types)
                    if (isAssemblyJob)
                    {
                        var assyWorkStatus = reader["AssyWorkStatus"]?.ToString();
                        var reviewedBy = reader["ReviewedBy"]?.ToString();
                        var isPassed = Convert.ToBoolean(reader["IsPassed"] ?? false);
                        var assyWorkDone = reader["AssyWorkDone"]?.ToString();
                        var assyProcFollowed = reader["AssyProcFollowed"]?.ToString();

                        if (assyWorkStatus != "1")
                            validationErrors.Add("Assembly Status must be 'Completed' before Final Approval");
                        
                        if (string.IsNullOrWhiteSpace(reviewedBy) || reviewedBy == "PS" || reviewedBy == "0")
                            validationErrors.Add("Please select a valid 'Reviewed By' person for Assembly");
                        
                        if (!isPassed)
                            validationErrors.Add("Assembly must be marked as 'Passed' before Final Approval");
                        
                        if (string.IsNullOrWhiteSpace(assyWorkDone))
                            validationErrors.Add("At least one Assembly Work Done must be selected");
                        
                        if (string.IsNullOrWhiteSpace(assyProcFollowed) || assyProcFollowed == "0")
                            validationErrors.Add("Assembly Procedure Followed must be selected");
                    }

                    // Quality validation (required for ALL job types)
                    var qcWorkStatus = reader["QCWorkStatus"]?.ToString();
                    var qcApprovedBy = reader["QCApprovedBy"]?.ToString();
                    var qcPassed = Convert.ToBoolean(reader["QCPassed"] ?? false);
                    var qcWorkDone = reader["QCWorkDone"]?.ToString();
                    var qcProcFollowed = reader["QCProcFollowed"]?.ToString();
                    var qcApproved = reader["QCApproved"]?.ToString();

                    if (qcWorkStatus != "1")
                        validationErrors.Add("Quality Status must be 'Completed' before Final Approval");
                    
                    if (string.IsNullOrWhiteSpace(qcApprovedBy) || qcApprovedBy == "PS" || qcApprovedBy == "0")
                        validationErrors.Add("Please select a valid 'Quality Approved By' person");
                    
                    if (!qcPassed)
                        validationErrors.Add("Quality must be marked as 'Passed' before Final Approval");
                    
                    if (string.IsNullOrWhiteSpace(qcWorkDone))
                        validationErrors.Add("At least one Quality Work Done must be selected");
                    
                    if (string.IsNullOrWhiteSpace(qcProcFollowed) || qcProcFollowed == "0")
                        validationErrors.Add("Quality Procedure Followed must be selected");
                    
                    if (string.IsNullOrWhiteSpace(qcApproved) || qcApproved == "0")
                        validationErrors.Add("Quality Approved status must be selected");

                    // If validation failed, return errors
                    if (validationErrors.Any())
                    {
                        return (false, "Final Approval validation failed: " + string.Join("; ", validationErrors), validationErrors);
                    }
                }

                reader.Close(); // Close reader before next command

                // Step 3: Archive the record
                var currentUser = GetCurrentWindowsUserId();

                const string updateQuery = @"
                    UPDATE dbo.PartsTestList
                    SET Archive = 1,
                        LastModifiedOn = GETDATE(),
                        LastModifiedBy = @User
                    WHERE RowIndex = @RowIndex";

                using var command = new SqlCommand(updateQuery, connection);
                command.Parameters.AddWithValue("@RowIndex", rowIndex);
                command.Parameters.AddWithValue("@User", currentUser);

                int rowsAffected = await command.ExecuteNonQueryAsync();
                
                if (rowsAffected > 0)
                {
                    return (true, "Final Approval Successful", new List<string>());
                }
                else
                {
                    return (false, "Failed to archive record", new List<string> { "Archive failed" });
                }
            }
            catch (Exception ex)
            {
                return (false, $"Error during final approval: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Debug method to check what records exist in the database
        /// </summary>
        public async Task<(bool RecordExists, object RecordDetails, List<int> AvailableRowIndexes)> DebugCheckRecordAsync(int rowIndex)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Check if specific record exists
                const string checkSpecificQuery = @"
                    SELECT RowIndex, CallNbr, SiteID, Make, Model, ManufPartNo, DCGPartNo, Archive, 
                           CreatedOn, CreatedBy, LastModifiedOn, LastModifiedBy
                    FROM dbo.PartsTestList 
                    WHERE RowIndex = @RowIndex";

                using var checkCommand = new SqlCommand(checkSpecificQuery, connection);
                checkCommand.Parameters.AddWithValue("@RowIndex", rowIndex);

                object recordDetails = null;
                using var reader = await checkCommand.ExecuteReaderAsync();
                
                if (await reader.ReadAsync())
                {
                    recordDetails = new
                    {
                        RowIndex = reader["RowIndex"],
                        CallNbr = reader["CallNbr"]?.ToString(),
                        SiteID = reader["SiteID"]?.ToString(),
                        Make = reader["Make"]?.ToString(),
                        Model = reader["Model"]?.ToString(),
                        ManufPartNo = reader["ManufPartNo"]?.ToString(),
                        DCGPartNo = reader["DCGPartNo"]?.ToString(),
                        Archive = reader["Archive"],
                        CreatedOn = reader["CreatedOn"],
                        CreatedBy = reader["CreatedBy"]?.ToString(),
                        LastModifiedOn = reader["LastModifiedOn"],
                        LastModifiedBy = reader["LastModifiedBy"]?.ToString()
                    };
                }
                
                reader.Close();

                // Get list of available RowIndexes (last 20 records)
                const string availableQuery = @"
                    SELECT TOP 20 RowIndex 
                    FROM dbo.PartsTestList 
                    ORDER BY RowIndex DESC";

                using var availableCommand = new SqlCommand(availableQuery, connection);
                var availableRowIndexes = new List<int>();
                
                using var availableReader = await availableCommand.ExecuteReaderAsync();
                while (await availableReader.ReadAsync())
                {
                    availableRowIndexes.Add(Convert.ToInt32(availableReader["RowIndex"]));
                }

                return (recordDetails != null, recordDetails, availableRowIndexes);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking record {rowIndex}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get record count and max RowIndex for debugging
        /// </summary>
        public async Task<(int TotalRecords, int MaxRowIndex, int MinRowIndex)> GetTableStatsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string statsQuery = @"
                    SELECT 
                        COUNT(*) as TotalRecords,
                        ISNULL(MAX(RowIndex), 0) as MaxRowIndex,
                        ISNULL(MIN(RowIndex), 0) as MinRowIndex
                    FROM dbo.PartsTestList";

                using var command = new SqlCommand(statsQuery, connection);
                using var reader = await command.ExecuteReaderAsync();
                
                if (await reader.ReadAsync())
                {
                    return (
                        Convert.ToInt32(reader["TotalRecords"]),
                        Convert.ToInt32(reader["MaxRowIndex"]),
                        Convert.ToInt32(reader["MinRowIndex"])
                    );
                }

                return (0, 0, 0);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error getting table stats: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets current Windows user ID - equivalent to legacy da.getUID() / LP.getUID()
        /// </summary>
        private string GetCurrentWindowsUserId()
        {
            try
            {
                // Try to get from Windows Identity first
                if (System.Security.Principal.WindowsIdentity.GetCurrent()?.Name != null)
                {
                    var windowsName = System.Security.Principal.WindowsIdentity.GetCurrent().Name;
                    // Extract username from DOMAIN\username format
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

    }
}