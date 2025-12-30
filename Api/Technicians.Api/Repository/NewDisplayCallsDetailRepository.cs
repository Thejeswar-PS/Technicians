using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    // Interface
    public interface IDisplayCallsDetailRepository
    {
        Task<DisplayCallsDetailResponse> GetDisplayCallsDetailsAsync(
            string pDetailPage,
            string pOffID = ""
        );
    }

    // ============================
    // Implementation
    // ============================
    public class NewDisplayCallsDetailRepository : IDisplayCallsDetailRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<NewDisplayCallsDetailRepository> _logger;

        public NewDisplayCallsDetailRepository(
            IConfiguration configuration,
            ILogger<NewDisplayCallsDetailRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");

            _logger = logger;
        }

        /// <summary>
        /// Executes the NewDisplayCallsDetail stored procedure
        /// </summary>
        public async Task<DisplayCallsDetailResponse> GetDisplayCallsDetailsAsync(
            string pDetailPage,
            string pOffID = "")
        {
            var response = new DisplayCallsDetailResponse();

            try
            {
                using var connection = new SqlConnection(_connectionString);

                _logger.LogInformation(
                    "Executing NewDisplayCallsDetail | DetailPage={DetailPage} | OffID={OffID}",
                    pDetailPage,
                    pOffID
                );

                var parameters = new DynamicParameters();
                parameters.Add("@pDetailPage", pDetailPage, DbType.String);
                parameters.Add("@pOffID", pOffID ?? string.Empty, DbType.String);

                using var multi = await connection.QueryMultipleAsync(
                    "dbo.NewDisplayCallsDetail",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 1000
                );

                // ============================
                // Result set #1 : Detail rows
                // ============================
                var rows = await multi.ReadAsync<dynamic>();

                foreach (var row in rows)
                {
                    var dict = (IDictionary<string, object>)row;

                    DateTime? startDt =
                        dict.TryGetValue("Start Dt", out var sd)
                            ? ParseDate(sd)
                            : null;

                    if (startDt == null && dict.TryGetValue("Last Modified", out var lm))
                    {
                        startDt = ParseDate(lm);
                    }

                    DateTime? endDt =
                        dict.TryGetValue("Last Modified", out var lm2)
                            ? ParseDate(lm2)
                            : null;

                    response.Details.Add(new DisplayCallsDetailDTO
                    {
                        JobNo = dict.TryGetValue("Job No", out var v1) ? v1?.ToString()?.Trim() : null,
                        CustomerNo = dict.TryGetValue("Customer No", out var v2) ? v2?.ToString()?.Trim() : null,
                        CustomerName = dict.TryGetValue("Customer Name", out var v3) ? v3?.ToString()?.Trim() : null,
                        Status = dict.TryGetValue("Status", out var v4) ? v4?.ToString()?.Trim() : null,
                        AcctMngr = dict.TryGetValue("Acct Mgr", out var v5) ? v5?.ToString()?.Trim() : null,

                        StartDt = startDt,
                        EndDt = endDt,

                        DueInDays = dict.TryGetValue("Due In(Days)", out var v8) && v8 != DBNull.Value
                            ? Convert.ToInt32(v8)
                            : null,

                        Class = dict.TryGetValue("Class", out var v9) ? v9?.ToString()?.Trim() : null,
                        City = dict.TryGetValue("City", out var v10) ? v10?.ToString()?.Trim() : null,
                        State = dict.TryGetValue("State", out var v11) ? v11?.ToString()?.Trim() : null
                    });
                }

                // ============================
                // Result set #2 : Totals (optional)
                // ============================
                if (!multi.IsConsumed)
                {
                    response.TotalAmount =
                        await multi.ReadFirstOrDefaultAsync<decimal?>();
                }

                // Optional: order by Start Date
                response.Details = response.Details
                    .OrderBy(d => d.StartDt)
                    .ToList();

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error executing NewDisplayCallsDetail | DetailPage={DetailPage} | OffID={OffID}",
                    pDetailPage,
                    pOffID
                );
                throw;
            }
        }
        private static DateTime? ParseDate(object value)
        {
            if (value == null || value == DBNull.Value)
                return null;

            if (value is DateTime dt)
                return dt.Date;

            if (DateTime.TryParse(value.ToString(), out var parsed))
                return parsed.Date;

            return null;
        }

    }
}



//using Dapper;
//using Microsoft.Data.SqlClient;
//using System.Data;
//using Technicians.Api.Models;

//namespace Technicians.Api.Repository
//{
//    public class NewDisplayCallsDetailRepository
//    {
//        private readonly string _connectionString;
//        private readonly ILogger<NewDisplayCallsDetailRepository> _logger;

//        public NewDisplayCallsDetailRepository(
//            IConfiguration configuration, 
//            ILogger<NewDisplayCallsDetailRepository> logger)
//        {
//            _connectionString = configuration.GetConnectionString("ETechConnString")
//                ?? throw new InvalidOperationException("ETechConnString not found");
//            _logger = logger;
//        }

//        /// <summary>
//        /// Executes the NewDisplayCallsDetail stored procedure with proper parameter binding
//        /// </summary>
//        public async Task<NewDisplayCallsDetailResponseDto> GetCallsDetailAsync(NewDisplayCallsDetailRequestDto request)
//        {
//            using var connection = new SqlConnection(_connectionString);

//            try
//            {
//                _logger.LogInformation("Executing NewDisplayCallsDetail with pDetailPage: '{DetailPage}', pOffID: '{OfficeId}'", 
//                    request.PDetailPage, request.POffID);

//                // ✅ FIX #1: Use DynamicParameters with exact SQL parameter names
//                var parameters = new DynamicParameters();
//                parameters.Add("@pDetailPage", request.PDetailPage);
//                parameters.Add("@pOffID", request.POffID);

//                // Use QueryMultipleAsync to get multiple result sets
//                using var multi = await connection.QueryMultipleAsync(
//                    "dbo.NewDisplayCallsDetail",
//                    parameters,
//                    commandType: CommandType.StoredProcedure,
//                    commandTimeout: 120
//                );

//                var response = new NewDisplayCallsDetailResponseDto
//                {
//                    Success = true,
//                    DetailPage = request.PDetailPage,
//                    OfficeId = request.POffID,
//                    Message = "Data retrieved successfully"
//                };

//                // Read the first result set as dynamic objects first
//                var dynamicResults = await multi.ReadAsync<dynamic>();
//                _logger.LogInformation("Retrieved {Count} records from first result set", dynamicResults.Count());

//                // Convert to strongly typed objects based on the detail page
//                response.Data = ConvertDynamicResults(dynamicResults, request.PDetailPage);

//                // Check if there's a second result set (for totals)
//                if (!multi.IsConsumed)
//                {
//                    var totalResults = await multi.ReadAsync<dynamic>();
//                    response.TotalData = totalResults.FirstOrDefault();
//                    _logger.LogInformation("Retrieved total data from second result set");
//                }

//                return response;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error executing NewDisplayCallsDetail stored procedure");
//                return new NewDisplayCallsDetailResponseDto
//                {
//                    Success = false,
//                    Message = $"Error processing results: {ex.Message}",
//                    DetailPage = request.PDetailPage,
//                    OfficeId = request.POffID
//                };
//            }
//        }

//        /// <summary>
//        /// Convert dynamic results to strongly typed objects based on detail page type
//        /// </summary>
//        private object ConvertDynamicResults(IEnumerable<dynamic> dynamicResults, string detailPage)
//        {
//            if (!dynamicResults.Any())
//            {
//                _logger.LogWarning("No data returned for detail page: {DetailPage}", detailPage);
//                return new List<object>();
//            }

//            try
//            {
//                // Log the first record to see what columns are available
//                var firstRecord = dynamicResults.FirstOrDefault();
//                if (firstRecord != null)
//                {
//                    var dict = (IDictionary<string, object>)firstRecord;
//                    _logger.LogInformation("Available columns for {DetailPage}: {Columns}", 
//                        detailPage, string.Join(", ", dict.Keys));
//                }

//                return detailPage.ToLower() switch
//                {
//                    "contract invoice month to date" => ConvertToContractInvoice(dynamicResults),

//                    // Quote related pages
//                    var page when page.Contains("quote") => ConvertToQuoteDetail(dynamicResults),

//                    // Job related pages - more specific matching
//                    var page when page.Contains("job") || page.Contains("scheduled") || page.Contains("processed") => 
//                        ConvertToJobDetail(dynamicResults),

//                    // Invoice related pages
//                    var page when page.Contains("invoice") => ConvertToInvoiceDetail(dynamicResults),

//                    // Unscheduled details
//                    var page when page.StartsWith("unscheddetail") || page.StartsWith("unschedactmngrdetail") => 
//                        ConvertToUnscheduledJobDetail(dynamicResults),

//                    // Site status pages
//                    "down sites" or "sites with equipment problem" => ConvertToSiteStatus(dynamicResults),

//                    // Contract billing pages
//                    var page when page.Contains("liebert contracts") || page.Contains("non liebert contracts") => 
//                        ConvertToContractBilling(dynamicResults),

//                    // Default - return as dynamic list
//                    _ => dynamicResults.ToList()
//                };
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error converting results for detail page: {DetailPage}", detailPage);
//                return dynamicResults.ToList(); // Return as dynamic if conversion fails
//            }
//        }

//        #region Result Conversion Methods

//        private List<ContractInvoiceDto> ConvertToContractInvoice(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new ContractInvoiceDto
//            {
//                ReferenceNo = GetStringValue(r, "Reference No") ?? "",
//                InvoiceDate = GetDateTimeValue(r, "Invoice Date"),
//                InvoiceAmount = GetDecimalValue(r, "Invoice Amount")
//            }).ToList();
//        }

//        private List<QuoteDetailDto> ConvertToQuoteDetail(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new QuoteDetailDto
//            {
//                JobNo = GetStringValue(r, "Job No") ?? "",
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                Status = GetStringValue(r, "Status") ?? "",
//                AccountMgr = GetStringValue(r, "Account Mgr") ?? GetStringValue(r, "Acct Mgr") ?? "",
//                LastChanged = GetStringValue(r, "Last Changed") ?? "",
//                StartDt = GetStringValue(r, "Start Dt") ?? "",
//                QuotedAmount = GetDecimalValue(r, "Quoted Amount")
//            }).ToList();
//        }

//        private List<JobDetailDto> ConvertToJobDetail(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new JobDetailDto
//            {
//                JobNo = GetStringValue(r, "Job No") ?? "",
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                Status = GetStringValue(r, "Status") ?? "",
//                AcctMgr = GetStringValue(r, "Acct Mgr") ?? "",
//                StartDt = GetStringValue(r, "Start Dt") ?? "",
//                EndDt = GetStringValue(r, "End Dt") ?? "",
//                LastChanged = GetStringValue(r, "Last Changed") ?? "",
//                ConfirmedOn = GetStringValue(r, "Confirmed On") ?? "",
//                FinalConfirmedBy = GetStringValue(r, "Final Confirmed By") ?? "",
//                City = GetStringValue(r, "City") ?? "",
//                State = GetStringValue(r, "State") ?? "",
//                ReturnedOn = GetStringValue(r, "Returned On") ?? "",
//                TechName = GetStringValue(r, "TechName") ?? GetStringValue(r, "Tech Name") ?? "",
//                Class = GetStringValue(r, "Class") ?? GetStringValue(r, "Class ID") ?? "",
//                CustomerName = GetStringValue(r, "Customer Name") ?? "",
//                ContractNo = GetStringValue(r, "Contract No") ?? "",
//                DueInDays = GetIntValue(r, "Due In(Days)"),
//                LastModified = GetStringValue(r, "Last Modified") ?? "",
//                JobType = GetStringValue(r, "JobType") ?? "",
//                QuotedAmount = GetDecimalValue(r, "Quoted Amount"),
//                ChangeAge = GetIntValue(r, "ChangeAge"),
//                Description = GetStringValue(r, "Description") ?? "",
//                Amount = GetDecimalValue(r, "Amount"),
//                InvoicedOn = GetStringValue(r, "Invoiced On") ?? "",
//                BilledAmount = GetDecimalValue(r, "Billed Amount"),
//                JobCost = GetDecimalValue(r, "Job Cost"),
//                TotalAmount = GetDecimalValue(r, "TotalAmount") ?? GetDecimalValue(r, "Total Amount")
//            }).ToList();
//        }

//        private List<InvoiceDetailDto> ConvertToInvoiceDetail(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new InvoiceDetailDto
//            {
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                Name = GetStringValue(r, "Name") ?? "",
//                InvoiceNo = GetStringValue(r, "Invoice No") ?? "",
//                InvoiceDt = GetStringValue(r, "Invoice Dt") ?? "",
//                Amount = GetDecimalValue(r, "Amount"),
//                DueOn = GetStringValue(r, "Due On") ?? "",
//                ReferenceNo = GetStringValue(r, "Reference No") ?? "",
//                ChangeAge = GetIntValue(r, "ChangeAge")
//            }).ToList();
//        }

//        private List<UnscheduledJobDetailDto> ConvertToUnscheduledJobDetail(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new UnscheduledJobDetailDto
//            {
//                JobNo = GetStringValue(r, "Job No") ?? "",
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                Status = GetStringValue(r, "Status") ?? "",
//                AcctMgr = GetStringValue(r, "Acct Mgr") ?? "",
//                StartDt = GetStringValue(r, "Start Dt") ?? "",
//                EndDt = GetStringValue(r, "End Dt") ?? "",
//                JobType = GetStringValue(r, "JobType") ?? "",
//                ContractNo = GetStringValue(r, "Contract No") ?? "",
//                Description = GetStringValue(r, "Description") ?? "",
//                TotalAmount = GetDecimalValue(r, "TotalAmount") ?? GetDecimalValue(r, "Total Amount")
//            }).ToList();
//        }

//        private List<SiteStatusDto> ConvertToSiteStatus(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new SiteStatusDto
//            {
//                JobNo = GetStringValue(r, "Job No") ?? "",
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                Level = GetIntValue(r, "Level"),
//                StartDt = GetStringValue(r, "Start Dt") ?? "",
//                CustomerName = GetStringValue(r, "Customer Name") ?? "",
//                City = GetStringValue(r, "City") ?? "",
//                State = GetStringValue(r, "State") ?? "",
//                TechName = GetStringValue(r, "Tech Name") ?? "",
//                AcctMgr = GetStringValue(r, "Acct Mgr") ?? "",
//                LastModified = GetStringValue(r, "Last Modified") ?? "",
//                ChangeAge = GetIntValue(r, "ChangeAge"),
//                Class = GetStringValue(r, "Class") ?? ""
//            }).ToList();
//        }

//        private List<ContractBillingDto> ConvertToContractBilling(IEnumerable<dynamic> results)
//        {
//            return results.Select(r => new ContractBillingDto
//            {
//                CustomerNo = GetStringValue(r, "Customer No") ?? "",
//                CustomerName = GetStringValue(r, "Customer Name") ?? "",
//                Address = GetStringValue(r, "Address") ?? "",
//                SalesPerson = GetStringValue(r, "SalesPerson") ?? "",
//                ContractNo = GetStringValue(r, "Contract No") ?? "",
//                Type = GetStringValue(r, "Type") ?? "",
//                InvoicedOn = GetStringValue(r, "Invoiced On") ?? "",
//                Amount = GetDecimalValue(r, "Amount"),
//                MailingDt = GetStringValue(r, "Mailing Dt") ?? "",
//                PORDNMBR = GetStringValue(r, "PORDNMBR") ?? ""
//            }).ToList();
//        }

//        #endregion

//        #region Helper Methods for Safe Value Extraction

//        private string? GetStringValue(dynamic record, string columnName)
//        {
//            try
//            {
//                var dict = (IDictionary<string, object>)record;
//                if (dict.TryGetValue(columnName, out var value))
//                {
//                    return value?.ToString()?.Trim();
//                }
//                return null;
//            }
//            catch
//            {
//                return null;
//            }
//        }

//        private decimal GetDecimalValue(dynamic record, string columnName)
//        {
//            try
//            {
//                var dict = (IDictionary<string, object>)record;
//                if (dict.TryGetValue(columnName, out var value))
//                {
//                    if (value != null && decimal.TryParse(value.ToString(), out decimal result))
//                    {
//                        return result;
//                    }
//                }
//                return 0;
//            }
//            catch
//            {
//                return 0;
//            }
//        }

//        private int GetIntValue(dynamic record, string columnName)
//        {
//            try
//            {
//                var dict = (IDictionary<string, object>)record;
//                if (dict.TryGetValue(columnName, out var value))
//                {
//                    if (value != null && int.TryParse(value.ToString(), out int result))
//                    {
//                        return result;
//                    }
//                }
//                return 0;
//            }
//            catch
//            {
//                return 0;
//            }
//        }

//        private DateTime GetDateTimeValue(dynamic record, string columnName)
//        {
//            try
//            {
//                var dict = (IDictionary<string, object>)record;
//                if (dict.TryGetValue(columnName, out var value))
//                {
//                    if (value is DateTime dateTime)
//                    {
//                        return dateTime;
//                    }
//                    if (value != null && DateTime.TryParse(value.ToString(), out DateTime result))
//                    {
//                        return result;
//                    }
//                }
//                return DateTime.MinValue;
//            }
//            catch
//            {
//                return DateTime.MinValue;
//            }
//        }

//        #endregion

//        /// <summary>
//        /// Get quotes to be completed data - with proper office ID handling
//        /// </summary>
//        public async Task<IEnumerable<QuoteDetailDto>> GetQuotesToBeCompletedAsync(string? officeId = null)
//        {
//            var detailPage = string.IsNullOrWhiteSpace(officeId) ? "Quotes to be Completed" : "Quotes to be completed this week";

//            var request = new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = detailPage,
//                POffID = officeId ?? ""
//            };

//            var result = await GetCallsDetailAsync(request);

//            if (result.Data is List<QuoteDetailDto> quotes)
//            {
//                return quotes;
//            }

//            return Enumerable.Empty<QuoteDetailDto>();
//        }

//        // Keep all other methods but simplify them to use the main method
//        public async Task<IEnumerable<ContractInvoiceDto>> GetContractInvoiceMonthToDateAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Contract Invoice Month to Date",
//                POffID = ""
//            });

//            return result.Data as List<ContractInvoiceDto> ?? Enumerable.Empty<ContractInvoiceDto>();
//        }

//        public async Task<IEnumerable<JobDetailDto>> GetJobsToBeProcessedThisWeekAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Jobs to be Processed this week",
//                POffID = ""
//            });

//            return result.Data as List<JobDetailDto> ?? Enumerable.Empty<JobDetailDto>();
//        }

//        public async Task<IEnumerable<JobDetailDto>> GetJobsProcessedThisWeekAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Jobs Processed this week",
//                POffID = ""
//            });

//            return result.Data as List<JobDetailDto> ?? Enumerable.Empty<JobDetailDto>();
//        }

//        public async Task<IEnumerable<JobDetailDto>> GetJobsScheduledByAccountManagersThisWeekAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Jobs Scheduled by Account Managers this week",
//                POffID = ""
//            });

//            return result.Data as List<JobDetailDto> ?? Enumerable.Empty<JobDetailDto>();
//        }

//        public async Task<IEnumerable<QuoteDetailDto>> GetPendingQuotesAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Pending Quotes",
//                POffID = ""
//            });

//            return result.Data as List<QuoteDetailDto> ?? Enumerable.Empty<QuoteDetailDto>();
//        }

//        public async Task<IEnumerable<QuoteDetailDto>> GetOpenQuotesAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Open Quotes",
//                POffID = ""
//            });

//            return result.Data as List<QuoteDetailDto> ?? Enumerable.Empty<QuoteDetailDto>();
//        }

//        public async Task<IEnumerable<QuoteDetailDto>> GetExpiredQuotesAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Expired Quotes",
//                POffID = ""
//            });

//            return result.Data as List<QuoteDetailDto> ?? Enumerable.Empty<QuoteDetailDto>();
//        }

//        public async Task<IEnumerable<InvoiceDetailDto>> GetCurrentInvoicesAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Current Invoices",
//                POffID = ""
//            });

//            return result.Data as List<InvoiceDetailDto> ?? Enumerable.Empty<InvoiceDetailDto>();
//        }

//        public async Task<IEnumerable<InvoiceDetailDto>> GetInvoicesByAgeAsync(string ageRange)
//        {
//            var detailPage = ageRange switch
//            {
//                "1-30" => "Invoices - 1 to 30 days",
//                "31-60" => "Invoices - 31 to 60 days",
//                "61-90" => "Invoices - 61 to 90 days",
//                "91+" => "Invoices - 91+ days",
//                _ => "Current Invoices"
//            };

//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = detailPage,
//                POffID = ""
//            });

//            return result.Data as List<InvoiceDetailDto> ?? Enumerable.Empty<InvoiceDetailDto>();
//        }

//        public async Task<IEnumerable<UnscheduledJobDetailDto>> GetUnscheduledDetailsByMonthAsync(string month)
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = $"UnschedDetail{month}",
//                POffID = ""
//            });

//            return result.Data as List<UnscheduledJobDetailDto> ?? Enumerable.Empty<UnscheduledJobDetailDto>();
//        }

//        public async Task<IEnumerable<UnscheduledJobDetailDto>> GetUnscheduledAccountManagerDetailsAsync(string month, string officeId)
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = $"UnschedActMngrDetail{month}",
//                POffID = officeId
//            });

//            return result.Data as List<UnscheduledJobDetailDto> ?? Enumerable.Empty<UnscheduledJobDetailDto>();
//        }

//        public async Task<IEnumerable<SiteStatusDto>> GetDownSitesAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Down Sites",
//                POffID = ""
//            });

//            return result.Data as List<SiteStatusDto> ?? Enumerable.Empty<SiteStatusDto>();
//        }

//        public async Task<IEnumerable<SiteStatusDto>> GetSitesWithEquipmentProblemsAsync()
//        {
//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = "Sites with Equipment Problem",
//                POffID = ""
//            });

//            return result.Data as List<SiteStatusDto> ?? Enumerable.Empty<SiteStatusDto>();
//        }

//        public async Task<(IEnumerable<ContractBillingDto> Data, TotalAmountDto? Total)> GetContractBillingAsync(string contractType, string timeframe)
//        {
//            var detailPage = $"{contractType} Contracts {timeframe}";

//            var result = await GetCallsDetailAsync(new NewDisplayCallsDetailRequestDto
//            {
//                PDetailPage = detailPage,
//                POffID = ""
//            });

//            var data = result.Data as List<ContractBillingDto> ?? new List<ContractBillingDto>();
//            var total = result.TotalData as TotalAmountDto;

//            return (data, total);
//        }

//        public static List<string> GetAvailableDetailPages()
//        {
//            return new List<string>
//            {
//                "Contract Invoice Month to Date",
//                "Quotes to be completed this week",
//                "Quotes to be Completed", // Added this variant
//                "Jobs to be Processed this week",
//                "Jobs Processed this week",
//                "Jobs to be Scheduled this week",
//                "Jobs Scheduled by Account Managers this week",
//                "Quotes Completed by Account Managers this week",
//                "Jobs Processed by Account Managers this week",
//                "Jobs Scheduled by Scheduling Coordinator this week",
//                "Pending Quotes",
//                "Open Quotes",
//                "Expired Quotes",
//                "Current Invoices",
//                "Invoices - 1 to 30 days",
//                "Invoices - 31 to 60 days",
//                "Invoices - 61 to 90 days",
//                "Invoices - 91+ days",
//                "Down Sites",
//                "Sites with Equipment Problem",
//                "Liebert Contracts not billed as of yesterday",
//                "Non Liebert Contracts not billed as of yesterday",
//                "Liebert Contracts to be billed in next 30 days",
//                "Non Liebert Contracts to be billed in next 30 days",
//                "Liebert Contracts to be billed in next 60 days",
//                "Non Liebert Contracts to be billed in next 60 days",
//                "Liebert Contracts to be billed in next 90 days",
//                "Non Liebert Contracts to be billed in next 90 days",
//                "Liebert Contracts to be billed after 90 days",
//                "Non Liebert Contracts to be billed after 90 days"
//            };
//        }
//    }
//}