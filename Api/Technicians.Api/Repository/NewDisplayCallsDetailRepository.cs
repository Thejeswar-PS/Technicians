using Dapper;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class NewDisplayCallsDetailRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<NewDisplayCallsDetailRepository> _logger;
        private const int DefaultMaxResults = 10000; // Configurable default max
        private const int AbsoluteMaxResults = 50000; // Hard limit to prevent system issues

        public NewDisplayCallsDetailRepository(IConfiguration configuration, ILogger<NewDisplayCallsDetailRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new InvalidOperationException("ETechGreatPlainsConnString not found");
            _logger = logger;
        }

        public async Task<NewDisplayCallsDetailResponse> GetAsync(NewDisplayCallsDetailRequest request)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                _logger.LogInformation("Starting NewDisplayCallsDetail query - DetailPage: '{DetailPage}', OffId: '{OffId}', Page: {Page}, PageSize: {PageSize}, MaxResults: {MaxResults}", 
                    request.DetailPage, request.OffId ?? "null", request.Page, request.PageSize, request.MaxResults);

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@pDetailPage", request.DetailPage);
                parameters.Add("@pOffID", request.OffId ?? string.Empty);

                _logger.LogDebug("Executing stored procedure 'NewDisplayCallsDetail' with parameters: DetailPage='{DetailPage}', OffID='{OffID}'", 
                    request.DetailPage, request.OffId ?? string.Empty);

                using var multi = await connection.QueryMultipleAsync(
                    "dbo.NewDisplayCallsDetail",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 300); // 5 minutes timeout

                var response = new NewDisplayCallsDetailResponse
                {
                    Data = new List<dynamic>(),
                    Totals = null
                };

                // Check if there are any result sets
                if (!multi.IsConsumed)
                {
                    try
                    {
                        var firstResultSet = await multi.ReadAsync();
                        var resultList = firstResultSet.ToList();
                        
                        _logger.LogDebug("First result set returned {Count} rows", resultList.Count);
                        
                        // Set total records count
                        response.TotalRecords = resultList.Count;
                        
                        // Apply result limiting/pagination logic
                        IEnumerable<dynamic> filteredData = resultList;
                        
                        // Determine max results to apply
                        int maxResults = request.MaxResults ?? DefaultMaxResults;
                        if (maxResults > AbsoluteMaxResults)
                        {
                            maxResults = AbsoluteMaxResults;
                            _logger.LogWarning("MaxResults capped at {AbsoluteMaxResults} to prevent system issues", AbsoluteMaxResults);
                        }
                        
                        // Apply pagination if requested
                        if (request.Page.HasValue && request.Page > 0)
                        {
                            // Pagination mode
                            int pageSize = request.PageSize;
                            if (pageSize <= 0) pageSize = 100;
                            if (pageSize > 1000) pageSize = 1000; // Cap page size
                            
                            int page = request.Page.Value;
                            int totalPages = (int)Math.Ceiling((double)resultList.Count / pageSize);
                            
                            filteredData = resultList
                                .Skip((page - 1) * pageSize)
                                .Take(pageSize);
                            
                            response.Page = page;
                            response.PageSize = pageSize;
                            response.TotalPages = totalPages;
                            
                            _logger.LogDebug("Applied pagination: Page {Page}/{TotalPages}, PageSize: {PageSize}", page, totalPages, pageSize);
                        }
                        else
                        {
                            // Non-pagination mode - apply max results limit
                            if (resultList.Count > maxResults)
                            {
                                filteredData = resultList.Take(maxResults);
                                response.IsLimited = true;
                                response.MaxResultsApplied = maxResults;
                                
                                _logger.LogWarning("Results limited to {MaxResults} out of {TotalRecords} total records to prevent performance issues", 
                                    maxResults, resultList.Count);
                            }
                        }
                        
                        response.Data = filteredData.ToList();
                        
                        // Check for second result set (totals)
                        if (!multi.IsConsumed)
                        {
                            try
                            {
                                var totalResultSet = await multi.ReadAsync();
                                var totalsList = totalResultSet.ToList();
                                
                                _logger.LogDebug("Second result set (totals) returned {Count} rows", totalsList.Count);
                                
                                if (totalsList.Any())
                                {
                                    response.Totals = totalsList;
                                }
                            }
                            catch (InvalidOperationException ex) when (ex.Message.Contains("No columns were selected"))
                            {
                                _logger.LogDebug("Second result set is empty or has no columns - this is normal for some detail pages");
                                response.Totals = null;
                            }
                        }
                    }
                    catch (InvalidOperationException ex) when (ex.Message.Contains("No columns were selected"))
                    {
                        _logger.LogWarning("Stored procedure returned empty result set for DetailPage: '{DetailPage}'. This may indicate an unsupported detail page or no data available.", 
                            request.DetailPage);
                        
                        // Return empty response instead of throwing
                        response.Data = new List<dynamic>();
                        response.Totals = null;
                        response.TotalRecords = 0;
                    }
                }
                else
                {
                    _logger.LogWarning("No result sets returned from stored procedure for DetailPage: '{DetailPage}'", request.DetailPage);
                    response.TotalRecords = 0;
                }

                stopwatch.Stop();
                _logger.LogInformation("NewDisplayCallsDetail query completed in {ElapsedMs}ms - DetailPage: '{DetailPage}', TotalRecords: {TotalRecords}, ReturnedRecords: {ReturnedRecords}, HasTotals: {HasTotals}, IsLimited: {IsLimited}", 
                    stopwatch.ElapsedMilliseconds, request.DetailPage, response.TotalRecords, response.Data?.Count() ?? 0, response.Totals != null, response.IsLimited);

                return response;
            }
            catch (SqlException sqlEx)
            {
                stopwatch.Stop();
                _logger.LogError(sqlEx, "SQL error in NewDisplayCallsDetail after {ElapsedMs}ms - DetailPage: '{DetailPage}', OffId: '{OffId}', SqlError: {SqlError}", 
                    stopwatch.ElapsedMilliseconds, request.DetailPage, request.OffId, sqlEx.Number);
                throw;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Unexpected error in NewDisplayCallsDetail after {ElapsedMs}ms - DetailPage: '{DetailPage}', OffId: '{OffId}'", 
                    stopwatch.ElapsedMilliseconds, request.DetailPage, request.OffId);
                throw;
            }
        }

        /// <summary>
        /// Get valid detail page options from the stored procedure logic (COMPLETE LIST)
        /// </summary>
        public List<string> GetValidDetailPages()
        {
            return new List<string>
            {
                // ===== BASIC JOB WORKFLOW =====
                "Quotes to be completed this week",
                "Jobs to be Processed this week", 
                "Jobs Processed this week",
                "Jobs to be Scheduled this week",
                "Jobs Scheduled by Account Managers this week",
                "Quotes Completed by Account Managers this week",
                "Jobs Processed by Account Managers this week", 
                "Jobs Scheduled by Scheduling Coordinator this week",
                
                // ===== JOB COMPLETION STATES =====
                "Completed Not Returned from engineer",         // Maps to: "Completed Not Returned from tech."
                "Returned for processing Acct. Mngr.",         // Maps to: "Returned from tech. for processing by Acct. Mngr."
                "Completed and Returned with Missing Data",
                "Completed Parts",                             // Maps to: "Jobs in review by Part Dep."
                "Completed Tech Review",                       // Maps to: "Jobs in Technical Review"
                "Completed Manager Review",                    // Maps to: "Jobs in Manager Review"
                "Completed Costing",                          // Maps to: "TM job Costing by accounting"
                "Completed FS Costing",                       // Maps to: "FS Job Costing"
                "Completed Non FS Costing",                   // Maps to: "T+M Jobs to be Mailed (BLB or MIS)"
                "Liebert FS Costing",                         // Maps to: "Liebert Jobs to be Invoiced (BLB or MIS)"
                
                // ===== SCHEDULING STATES =====
                "Past Due Unscheduled Jobs",
                "Jobs to to Scheduled for Next 90 Days",
                "Pending next 30 days",                      // Maps to: "Pending customer approval next 60 days"
                "Scheduled next 30 days",                    // Maps to: "Customer Confirmed next 30 days"
                "Scheduled next 60 days",                    // Maps to: "Customer Confirmed next 60 days"
                "Scheduled next 7 days",                     // Maps to: "Customer Confirmed next 7 days"
                "Scheduled next 72 hours",                   // Maps to: "Customer Confirmed next 72 hours"
                "Scheduled Today",                           // Maps to: "Jobs Today"
                
                // ===== QUOTE MANAGEMENT =====
                "Pending Quotes",
                "Open Quotes",
                "Expired Quotes",
                
                // ===== INVOICE MANAGEMENT =====
                "Current Invoices",
                "Invoices - 1 to 30 days",
                "Invoices - 31 to 60 days", 
                "Invoices - 61 to 90 days",
                "Invoices - 91+ days",
                
                // ===== CONTRACT INVOICING =====
                "Contract Invoice Month to Date",             // Maps to: "Contracts Invoiced Month to Date"
                "Liebert Contracts not billed as of yesterday",
                "Non Liebert Contracts not billed as of yesterday",
                "Liebert Contracts to be billed in next 30 days",
                "Non Liebert Contracts to be billed in next 30 days",
                "Liebert Contracts to be billed in next 60 days", 
                "Non Liebert Contracts to be billed in next 60 days",
                "Liebert Contracts to be billed in next 90 days",
                "Non Liebert Contracts to be billed in next 90 days",
                "Liebert Contracts to be billed after 90 days",
                "Non Liebert Contracts to be billed after 90 days",
                
                // ===== SERVICE CALL INVOICING =====
                "Service Call Invoiced today",               // Maps to: "Jobs Invoiced Today" 
                "Jobs Invoiced yesterday",                   // Maps to: "Jobs Invoiced Yesterday"
                "Service Call Invoice Month to Date",        // Maps to: "Jobs Invoiced Month to Date"
                
                // ===== PRIORITY SITES =====
                "Down Sites",
                "Sites with Equipment Problem",
                
                // ===== PARTS TRACKING =====
                "Jobs (To be Tracked)-Part Shipped from DC Group",
                "Jobs (To be Tracked)-Part Shipped from Vendors", 
                "CrashKit",                                  // Maps to: "Jobs - Crash kits Shipped"
                "LoadBank",                                  // Maps to: "Jobs - Load Banks Shipped"
                "PastPartReqs",                             // Maps to: "Parts Requistion to be processed - Past"
                "ReqsToProcessNextFourDays",                // Maps to: "Parts Requistion to be processed - Next Four Days"
                "TotalReqsToProcess",                       // Maps to: "Parts Requistion to be processed - All"
                
                // ===== MISCELLANEOUS =====
                "Misc",                                     // Handles: SML, EML, ONL, FIL statuses
                "Posting",
                
                // ===== SPECIAL PARAMETER FORMATS =====
                // Month-specific unscheduled (UnschedDetail + Month)
                "UnschedDetailJanuary", "UnschedDetailFebruary", "UnschedDetailMarch",
                "UnschedDetailApril", "UnschedDetailMay", "UnschedDetailJune", 
                "UnschedDetailJuly", "UnschedDetailAugust", "UnschedDetailSeptember",
                "UnschedDetailOctober", "UnschedDetailNovember", "UnschedDetailDecember",
                
                // Account manager specific (requires OffId parameter)
                "UnschedActMngrDetailPast Due",
                "UnschedActMngrDetailJanuary", "UnschedActMngrDetailFebruary", "UnschedActMngrDetailMarch",
                "UnschedActMngrDetailApril", "UnschedActMngrDetailMay", "UnschedActMngrDetailJune",
                "UnschedActMngrDetailJuly", "UnschedActMngrDetailAugust", "UnschedActMngrDetailSeptember", 
                "UnschedActMngrDetailOctober", "UnschedActMngrDetailNovember", "UnschedActMngrDetailDecember"
            };
        }

        /// <summary>
        /// Maps legacy UI names to stored procedure parameter names
        /// </summary>
        public Dictionary<string, string> GetLegacyNameMappings()
        {
            return new Dictionary<string, string>
            {
                // Legacy UI Name -> Stored Procedure Parameter
                ["Jobs Today"] = "Scheduled Today",
                ["Completed Not Returned from tech."] = "Completed Not Returned from engineer",
                ["Returned from tech. for processing by Acct. Mngr."] = "Returned for processing Acct. Mngr.", 
                ["Jobs in review by Part Dep."] = "Completed Parts",
                ["Jobs in Technical Review"] = "Completed Tech Review",
                ["Jobs in Manager Review"] = "Completed Manager Review", 
                ["TM job Costing by accounting"] = "Completed Costing",
                ["FS Job Costing"] = "Completed FS Costing",
                ["Liebert Jobs to be Invoiced (BLB or MIS)"] = "Liebert FS Costing",
                ["T+M Jobs to be Mailed (BLB or MIS)"] = "Completed Non FS Costing",
                ["Jobs Invoiced Today"] = "Service Call Invoiced today",
                ["Jobs Invoiced Yesterday"] = "Jobs Invoiced yesterday", 
                ["Jobs Invoiced Month to Date"] = "Service Call Invoice Month to Date",
                ["Contracts Invoiced Month to Date"] = "Contract Invoice Month to Date",
                ["Pending customer approval next 60 days"] = "Pending next 30 days",
                ["Customer Confirmed next 30 days"] = "Scheduled next 30 days",
                ["Customer Confirmed next 60 days"] = "Scheduled next 60 days", 
                ["Customer Confirmed next 7 days"] = "Scheduled next 7 days",
                ["Customer Confirmed next 72 hours"] = "Scheduled next 72 hours"
            };
        }

        /// <summary>
        /// Converts legacy UI parameter name to stored procedure parameter name
        /// </summary>
        public string MapLegacyParameterName(string legacyName)
        {
            var mappings = GetLegacyNameMappings();
            return mappings.ContainsKey(legacyName) ? mappings[legacyName] : legacyName;
        }
    }
}