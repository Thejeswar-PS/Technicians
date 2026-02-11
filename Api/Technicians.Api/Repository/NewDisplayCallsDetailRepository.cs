using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repositories
{
    /// <summary>
    /// Interface for NewDisplayCallsDetail repository operations
    /// </summary>
    public interface IDisplayCallsDetailRepository
    {
        // Main method to handle all report types
        Task<object> GetDisplayCallsDetailAsync(string detailPage, string officeId = "");

        // Contract Reports
        Task<ReportResponseDto<ContractInvoiceDto>> GetContractInvoiceMonthToDateAsync();

        // Quote Reports
        Task<ReportResponseDto<QuoteDto>> GetQuotesToBeCompletedThisWeekAsync(string officeId = "");
        Task<ReportResponseDto<CompleteQuoteDto>> GetQuotesToBeCompletedAsync(string officeId = "");
        Task<ReportResponseDto<QuoteManagementDto>> GetPendingQuotesAsync();
        Task<ReportResponseDto<QuoteManagementDto>> GetOpenQuotesAsync();
        Task<ReportResponseDto<QuoteManagementDto>> GetExpiredQuotesAsync();

        // Job Processing Reports
        Task<ReportResponseDto<JobProcessingDto>> GetJobsToBeProcessedThisWeekAsync();
        Task<ReportResponseDto<JobProcessingDto>> GetJobsProcessedThisWeekAsync();
        Task<ReportResponseDto<JobProcessingDto>> GetJobsProcessedByAccountManagersThisWeekAsync();

        // Job Scheduling Reports
        Task<ReportResponseDto<JobSchedulingDto>> GetJobsToBeScheduledThisWeekAsync();
        Task<ReportResponseDto<JobProcessingDto>> GetJobsScheduledByAccountManagersThisWeekAsync();
        Task<ReportResponseDto<JobProcessingDto>> GetJobsScheduledBySchedulingCoordinatorThisWeekAsync();

        // Quote Completion Reports
        Task<ReportResponseDto<CompleteQuoteDto>> GetQuotesCompletedByAccountManagersThisWeekAsync();

        // Invoice Reports
        Task<ReportResponseDto<InvoiceDto>> GetCurrentInvoicesAsync();
        Task<ReportResponseDto<InvoiceDto>> GetInvoices1To30DaysAsync();
        Task<ReportResponseDto<InvoiceDto>> GetInvoices31To60DaysAsync();
        Task<ReportResponseDto<InvoiceDto>> GetInvoices61To90DaysAsync();
        Task<ReportResponseDto<InvoiceDto>> GetInvoices91PlusDaysAsync();

        // Contract Billing Reports
        Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsNotBilledAsOfYesterdayAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsNotBilledAsOfYesterdayAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext30DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext30DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext60DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext60DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext90DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext90DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledAfter90DaysAsync();
        Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledAfter90DaysAsync();

        // Parts Tracking Reports
        Task<ReportResponseDto<PartsTrackingDto>> GetJobsToBeTrackedPartShippedFromDCGroupAsync();
        Task<ReportResponseDto<PartsTrackingDto>> GetJobsToBeTrackedPartShippedFromVendorsAsync();
        Task<ReportResponseDto<PartsRequestDto>> GetCrashKitAsync();
        Task<ReportResponseDto<PartsRequestDto>> GetLoadBankAsync();
        Task<ReportResponseDto<PartsRequestDto>> GetPastPartReqsAsync();
        Task<ReportResponseDto<PartsRequestDto>> GetReqsToProcessNextFourDaysAsync();
        Task<ReportResponseDto<PartsRequestDto>> GetTotalReqsToProcessAsync();

        // Site Status Reports
        Task<ReportResponseDto<SiteStatusDto>> GetDownSitesAsync();
        Task<ReportResponseDto<SiteStatusDto>> GetSitesWithEquipmentProblemAsync();

        // Unscheduled Reports
        Task<ReportResponseDto<JobStatusDetailDto>> GetUnscheduledDetailAsync(string month);
        Task<ReportResponseDto<JobStatusDetailDto>> GetUnscheduledActMngrDetailAsync(string month, string officeId);

        // Job Status Reports
        Task<ReportResponseDto<JobPerformanceDto>> GetPastDueUnscheduledJobsAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetJobsToBeScheduledForNext90DaysAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetPendingNext30DaysAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext30DaysAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext60DaysAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext7DaysAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext72HoursAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetScheduledTodayAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedNotReturnedFromEngineerAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetReturnedForProcessingAcctMngrAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedAndReturnedWithMissingDataAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedPartsAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedTechReviewAsync();
        Task<ReportResponseDto<ManagerReviewDto>> GetCompletedManagerReviewAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedCostingAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedFSCostingAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetMiscAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetPostingAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetLiebertFSCostingAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetCompletedNonFSCostingAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetJobsInvoicedYesterdayAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetServiceCallInvoicedTodayAsync();
        Task<ReportResponseDto<JobPerformanceDto>> GetServiceCallInvoiceMonthToDateAsync();

        // Office-specific Reports
        Task<ReportResponseDto<JobPerformanceDto>> GetOfficeSpecificReportAsync(string officeId);

        // Technician-specific Reports
        Task<ReportResponseDto<JobPerformanceDto>> GetTechnicianFCDReportAsync(string technicianName);
        Task<ReportResponseDto<JobPerformanceDto>> GetTechnicianMISReportAsync(string technicianName);
    }

    /// <summary>
    /// Implementation of DisplayCallsDetail repository using Dapper
    /// </summary>
    public class DisplayCallsDetailRepository : IDisplayCallsDetailRepository
    {
        private readonly string _connectionString;
        private readonly string _eTechConnectionString;
        private readonly ILogger<DisplayCallsDetailRepository> _logger;

        public DisplayCallsDetailRepository(IConfiguration configuration, ILogger<DisplayCallsDetailRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new ArgumentNullException(nameof(configuration), "Connection string 'ETechConnString' not found.");

            _eTechConnectionString = configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new ArgumentNullException(nameof(configuration), "Connection string 'ETechGreatPlainsConnString' not found.");

            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Main method to handle all report types by calling the stored procedure
        /// </summary>
        public async Task<object> GetDisplayCallsDetailAsync(string detailPage, string officeId = "")
        {
            try
            {
                _logger.LogInformation("Executing NewDisplayCallsDetail for detailPage: {DetailPage}, officeId: {OfficeId}",
                    detailPage, officeId);

                using var connection = new SqlConnection(_eTechConnectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@pDetailPage", detailPage);
                parameters.Add("@pOffID", officeId);

                // Use QueryMultiple to handle multiple result sets
                using var multi = await connection.QueryMultipleAsync(
                    "NewDisplayCallsDetail",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                // Route to specific method based on detail page
                return detailPage switch
                {
                    "Contract Invoice Month to Date" => await HandleContractInvoiceResponse(multi),
                    "Quotes to be completed this week" => await HandleQuoteResponse(multi),
                    "Jobs to be Processed this week" => await HandleJobProcessingResponse(multi),
                    "Jobs Processed this week" => await HandleJobProcessingResponse(multi),
                    "Jobs to be Scheduled this week" => await HandleJobSchedulingResponse(multi),
                    "Jobs Scheduled by Account Managers this week" => await HandleJobProcessingResponse(multi),
                    "Quotes Completed by Account Managers this week" => await HandleCompleteQuoteResponse(multi),
                    "Jobs Processed by Account Managers this week" => await HandleJobProcessingResponse(multi),
                    "Jobs Scheduled by Scheduling Coordinator this week" => await HandleJobProcessingResponse(multi),
                    "Pending Quotes" => await HandleQuoteManagementResponse(multi),
                    "Open Quotes" => await HandleQuoteManagementResponse(multi),
                    "Expired Quotes" => await HandleQuoteManagementResponse(multi),
                    "Current Invoices" => await HandleInvoiceResponse(multi),
                    "Invoices - 1 to 30 days" => await HandleInvoiceResponse(multi),
                    "Invoices - 31 to 60 days" => await HandleInvoiceResponse(multi),
                    "Invoices - 61 to 90 days" => await HandleInvoiceResponse(multi),
                    "Invoices - 91+ days" => await HandleInvoiceResponse(multi),
                    "Liebert Contracts not billed as of yesterday" => await HandleContractBillingResponse(multi),
                    "Non Liebert Contracts not billed as of yesterday" => await HandleContractBillingResponse(multi),
                    "Liebert Contracts to be billed in next 30 days" => await HandleContractBillingResponse(multi),
                    "Non Liebert Contracts to be billed in next 30 days" => await HandleContractBillingResponse(multi),
                    "Liebert Contracts to be billed in next 60 days" => await HandleContractBillingResponse(multi),
                    "Non Liebert Contracts to be billed in next 60 days" => await HandleContractBillingResponse(multi),
                    "Liebert Contracts to be billed in next 90 days" => await HandleContractBillingResponse(multi),
                    "Non Liebert Contracts to be billed in next 90 days" => await HandleContractBillingResponse(multi),
                    "Liebert Contracts to be billed after 90 days" => await HandleContractBillingResponse(multi),
                    "Non Liebert Contracts to be billed after 90 days" => await HandleContractBillingResponse(multi),
                    "Jobs (To be Tracked)-Part Shipped from DC Group" => await HandlePartsTrackingResponse(multi),
                    "Jobs (To be Tracked)-Part Shipped from Vendors" => await HandlePartsTrackingResponse(multi),
                    "CrashKit" => await HandlePartsRequestResponse(multi),
                    "LoadBank" => await HandlePartsRequestResponse(multi),
                    "PastPartReqs" => await HandlePartsRequestResponse(multi),
                    "ReqsToProcessNextFourDays" => await HandlePartsRequestResponse(multi),
                    "TotalReqsToProcess" => await HandlePartsRequestResponse(multi),
                    "Down Sites" => await HandleSiteStatusResponse(multi),
                    "Sites with Equipment Problem" => await HandleSiteStatusResponse(multi),
                    "Quotes to be Completed" => await HandleCompleteQuoteResponse(multi),
                    "Past Due Unscheduled Jobs" => await HandleJobPerformanceResponse(multi),
                    "Jobs to to Scheduled for Next 90 Days" => await HandleJobPerformanceResponse(multi),
                    "Pending next 30 days" => await HandleJobPerformanceResponse(multi),
                    "Scheduled next 30 days" => await HandleJobPerformanceResponse(multi),
                    "Scheduled next 60 days" => await HandleJobPerformanceResponse(multi),
                    "Scheduled next 7 days" => await HandleJobPerformanceResponse(multi),
                    "Scheduled next 72 hours" => await HandleJobPerformanceResponse(multi),
                    "Scheduled Today" => await HandleJobPerformanceResponse(multi),
                    "Completed Not Returned from engineer" => await HandleJobPerformanceResponse(multi),
                    "Returned for processing Acct. Mngr." => await HandleJobPerformanceResponse(multi),
                    "Completed and Returned with Missing Data" => await HandleJobPerformanceResponse(multi),
                    "Completed Parts" => await HandleJobPerformanceResponse(multi),
                    "Completed Tech Review" => await HandleJobPerformanceResponse(multi),
                    "Completed Manager Review" => await HandleManagerReviewResponse(multi),
                    "Completed Costing" => await HandleJobPerformanceResponse(multi),
                    "Completed FS Costing" => await HandleJobPerformanceResponse(multi),
                    "Misc" => await HandleJobPerformanceResponse(multi),
                    "Posting" => await HandleJobPerformanceResponse(multi),
                    "Liebert FS Costing" => await HandleJobPerformanceResponse(multi),
                    "Completed Non FS Costing" => await HandleJobPerformanceResponse(multi),
                    "Jobs Invoiced yesterday" => await HandleJobPerformanceResponse(multi),
                    "Service Call Invoiced today" => await HandleJobPerformanceResponse(multi),
                    "Service Call Invoice Month to Date" => await HandleJobPerformanceResponse(multi),

                    // Handle dynamic cases
                    _ when detailPage.StartsWith("UnschedDetail") => await HandleJobStatusDetailResponse(multi),
                    _ when detailPage.StartsWith("UnschedActMngrDetail") => await HandleJobStatusDetailResponse(multi),
                    _ when detailPage.EndsWith("FCD") => await HandleJobPerformanceResponse(multi),
                    _ when detailPage.EndsWith("MIS") => await HandleJobPerformanceResponse(multi),

                    // Default case - office specific or generic
                    _ => await HandleJobPerformanceResponse(multi)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing NewDisplayCallsDetail for detailPage: {DetailPage}", detailPage);
                throw;
            }
        }

        #region Response Handlers

        private async Task<ReportResponseDto<ContractInvoiceDto>> HandleContractInvoiceResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<ContractInvoiceDto>()).ToList();
            decimal? totalAmount = null;

            if (!multi.IsConsumed)
            {
                var totalResult = await multi.ReadFirstOrDefaultAsync<decimal?>();
                totalAmount = totalResult;
            }

            return new ReportResponseDto<ContractInvoiceDto>
            {
                Data = data,
                TotalAmount = totalAmount,
                ReportType = "Contract Invoice",
                GeneratedAt = DateTime.UtcNow,
                HasMultipleResultSets = totalAmount.HasValue
            };
        }

        private async Task<ReportResponseDto<QuoteDto>> HandleQuoteResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<QuoteDto>()).ToList();

            return new ReportResponseDto<QuoteDto>
            {
                Data = data,
                ReportType = "Quote",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<JobProcessingDto>> HandleJobProcessingResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<JobProcessingDto>()).ToList();

            return new ReportResponseDto<JobProcessingDto>
            {
                Data = data,
                ReportType = "Job Processing",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<JobSchedulingDto>> HandleJobSchedulingResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<JobSchedulingDto>()).ToList();

            return new ReportResponseDto<JobSchedulingDto>
            {
                Data = data,
                ReportType = "Job Scheduling",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<QuoteManagementDto>> HandleQuoteManagementResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<QuoteManagementDto>()).ToList();

            return new ReportResponseDto<QuoteManagementDto>
            {
                Data = data,
                ReportType = "Quote Management",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<InvoiceDto>> HandleInvoiceResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<InvoiceDto>()).ToList();

            return new ReportResponseDto<InvoiceDto>
            {
                Data = data,
                ReportType = "Invoice",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<ContractBillingDto>> HandleContractBillingResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<ContractBillingDto>()).ToList();
            decimal? totalAmount = null;

            if (!multi.IsConsumed)
            {
                var totalResult = await multi.ReadFirstOrDefaultAsync<decimal?>();
                totalAmount = totalResult;
            }

            return new ReportResponseDto<ContractBillingDto>
            {
                Data = data,
                TotalAmount = totalAmount,
                ReportType = "Contract Billing",
                GeneratedAt = DateTime.UtcNow,
                HasMultipleResultSets = totalAmount.HasValue
            };
        }

        private async Task<ReportResponseDto<PartsTrackingDto>> HandlePartsTrackingResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<PartsTrackingDto>()).ToList();

            return new ReportResponseDto<PartsTrackingDto>
            {
                Data = data,
                ReportType = "Parts Tracking",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<PartsRequestDto>> HandlePartsRequestResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<PartsRequestDto>()).ToList();

            return new ReportResponseDto<PartsRequestDto>
            {
                Data = data,
                ReportType = "Parts Request",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<SiteStatusDto>> HandleSiteStatusResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<SiteStatusDto>()).ToList();

            return new ReportResponseDto<SiteStatusDto>
            {
                Data = data,
                ReportType = "Site Status",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<JobStatusDetailDto>> HandleJobStatusDetailResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<JobStatusDetailDto>()).ToList();

            return new ReportResponseDto<JobStatusDetailDto>
            {
                Data = data,
                ReportType = "Job Status Detail",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<JobPerformanceDto>> HandleJobPerformanceResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<JobPerformanceDto>()).ToList();
            decimal? totalAmount = null;

            if (!multi.IsConsumed)
            {
                var totalResult = await multi.ReadFirstOrDefaultAsync<decimal?>();
                totalAmount = totalResult;
            }

            return new ReportResponseDto<JobPerformanceDto>
            {
                Data = data,
                TotalAmount = totalAmount,
                ReportType = "Job Performance",
                GeneratedAt = DateTime.UtcNow,
                HasMultipleResultSets = totalAmount.HasValue
            };
        }

        private async Task<ReportResponseDto<CompleteQuoteDto>> HandleCompleteQuoteResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<CompleteQuoteDto>()).ToList();

            return new ReportResponseDto<CompleteQuoteDto>
            {
                Data = data,
                ReportType = "Complete Quote",
                GeneratedAt = DateTime.UtcNow
            };
        }

        private async Task<ReportResponseDto<ManagerReviewDto>> HandleManagerReviewResponse(SqlMapper.GridReader multi)
        {
            var data = (await multi.ReadAsync<ManagerReviewDto>()).ToList();

            return new ReportResponseDto<ManagerReviewDto>
            {
                Data = data,
                ReportType = "Manager Review",
                GeneratedAt = DateTime.UtcNow
            };
        }

        #endregion

        #region Individual Report Methods

        public async Task<ReportResponseDto<ContractInvoiceDto>> GetContractInvoiceMonthToDateAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Contract Invoice Month to Date");
            return (ReportResponseDto<ContractInvoiceDto>)result;
        }

        public async Task<ReportResponseDto<QuoteDto>> GetQuotesToBeCompletedThisWeekAsync(string officeId = "")
        {
            var result = await GetDisplayCallsDetailAsync("Quotes to be completed this week", officeId);
            return (ReportResponseDto<QuoteDto>)result;
        }

        public async Task<ReportResponseDto<CompleteQuoteDto>> GetQuotesToBeCompletedAsync(string officeId = "")
        {
            var result = await GetDisplayCallsDetailAsync("Quotes to be Completed", officeId);
            return (ReportResponseDto<CompleteQuoteDto>)result;
        }

        public async Task<ReportResponseDto<QuoteManagementDto>> GetPendingQuotesAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Pending Quotes");
            return (ReportResponseDto<QuoteManagementDto>)result;
        }

        public async Task<ReportResponseDto<QuoteManagementDto>> GetOpenQuotesAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Open Quotes");
            return (ReportResponseDto<QuoteManagementDto>)result;
        }

        public async Task<ReportResponseDto<QuoteManagementDto>> GetExpiredQuotesAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Expired Quotes");
            return (ReportResponseDto<QuoteManagementDto>)result;
        }

        public async Task<ReportResponseDto<JobProcessingDto>> GetJobsToBeProcessedThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs to be Processed this week");
            return (ReportResponseDto<JobProcessingDto>)result;
        }

        public async Task<ReportResponseDto<JobProcessingDto>> GetJobsProcessedThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs Processed this week");
            return (ReportResponseDto<JobProcessingDto>)result;
        }

        public async Task<ReportResponseDto<JobProcessingDto>> GetJobsProcessedByAccountManagersThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs Processed by Account Managers this week");
            return (ReportResponseDto<JobProcessingDto>)result;
        }

        public async Task<ReportResponseDto<JobSchedulingDto>> GetJobsToBeScheduledThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs to be Scheduled this week");
            return (ReportResponseDto<JobSchedulingDto>)result;
        }

        public async Task<ReportResponseDto<JobProcessingDto>> GetJobsScheduledByAccountManagersThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs Scheduled by Account Managers this week");
            return (ReportResponseDto<JobProcessingDto>)result;
        }

        public async Task<ReportResponseDto<JobProcessingDto>> GetJobsScheduledBySchedulingCoordinatorThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs Scheduled by Scheduling Coordinator this week");
            return (ReportResponseDto<JobProcessingDto>)result;
        }

        public async Task<ReportResponseDto<CompleteQuoteDto>> GetQuotesCompletedByAccountManagersThisWeekAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Quotes Completed by Account Managers this week");
            return (ReportResponseDto<CompleteQuoteDto>)result;
        }

        public async Task<ReportResponseDto<InvoiceDto>> GetCurrentInvoicesAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Current Invoices");
            return (ReportResponseDto<InvoiceDto>)result;
        }

        public async Task<ReportResponseDto<InvoiceDto>> GetInvoices1To30DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Invoices - 1 to 30 days");
            return (ReportResponseDto<InvoiceDto>)result;
        }

        public async Task<ReportResponseDto<InvoiceDto>> GetInvoices31To60DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Invoices - 31 to 60 days");
            return (ReportResponseDto<InvoiceDto>)result;
        }

        public async Task<ReportResponseDto<InvoiceDto>> GetInvoices61To90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Invoices - 61 to 90 days");
            return (ReportResponseDto<InvoiceDto>)result;
        }

        public async Task<ReportResponseDto<InvoiceDto>> GetInvoices91PlusDaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Invoices - 91+ days");
            return (ReportResponseDto<InvoiceDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsNotBilledAsOfYesterdayAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert Contracts not billed as of yesterday");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsNotBilledAsOfYesterdayAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Non Liebert Contracts not billed as of yesterday");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext30DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert Contracts to be billed in next 30 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext30DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Non Liebert Contracts to be billed in next 30 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext60DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert Contracts to be billed in next 60 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext60DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Non Liebert Contracts to be billed in next 60 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledInNext90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert Contracts to be billed in next 90 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledInNext90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Non Liebert Contracts to be billed in next 90 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetLiebertContractsToBeBilledAfter90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert Contracts to be billed after 90 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<ContractBillingDto>> GetNonLiebertContractsToBeBilledAfter90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Non Liebert Contracts to be billed after 90 days");
            return (ReportResponseDto<ContractBillingDto>)result;
        }

        public async Task<ReportResponseDto<PartsTrackingDto>> GetJobsToBeTrackedPartShippedFromDCGroupAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs (To be Tracked)-Part Shipped from DC Group");
            return (ReportResponseDto<PartsTrackingDto>)result;
        }

        public async Task<ReportResponseDto<PartsTrackingDto>> GetJobsToBeTrackedPartShippedFromVendorsAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs (To be Tracked)-Part Shipped from Vendors");
            return (ReportResponseDto<PartsTrackingDto>)result;
        }

        public async Task<ReportResponseDto<PartsRequestDto>> GetCrashKitAsync()
        {
            var result = await GetDisplayCallsDetailAsync("CrashKit");
            return (ReportResponseDto<PartsRequestDto>)result;
        }

        public async Task<ReportResponseDto<PartsRequestDto>> GetLoadBankAsync()
        {
            var result = await GetDisplayCallsDetailAsync("LoadBank");
            return (ReportResponseDto<PartsRequestDto>)result;
        }

        public async Task<ReportResponseDto<PartsRequestDto>> GetPastPartReqsAsync()
        {
            var result = await GetDisplayCallsDetailAsync("PastPartReqs");
            return (ReportResponseDto<PartsRequestDto>)result;
        }

        public async Task<ReportResponseDto<PartsRequestDto>> GetReqsToProcessNextFourDaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("ReqsToProcessNextFourDays");
            return (ReportResponseDto<PartsRequestDto>)result;
        }

        public async Task<ReportResponseDto<PartsRequestDto>> GetTotalReqsToProcessAsync()
        {
            var result = await GetDisplayCallsDetailAsync("TotalReqsToProcess");
            return (ReportResponseDto<PartsRequestDto>)result;
        }

        public async Task<ReportResponseDto<SiteStatusDto>> GetDownSitesAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Down Sites");
            return (ReportResponseDto<SiteStatusDto>)result;
        }

        public async Task<ReportResponseDto<SiteStatusDto>> GetSitesWithEquipmentProblemAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Sites with Equipment Problem");
            return (ReportResponseDto<SiteStatusDto>)result;
        }

        public async Task<ReportResponseDto<JobStatusDetailDto>> GetUnscheduledDetailAsync(string month)
        {
            var result = await GetDisplayCallsDetailAsync($"UnschedDetail{month}");
            return (ReportResponseDto<JobStatusDetailDto>)result;
        }

        public async Task<ReportResponseDto<JobStatusDetailDto>> GetUnscheduledActMngrDetailAsync(string month, string officeId)
        {
            var result = await GetDisplayCallsDetailAsync($"UnschedActMngrDetail{month}", officeId);
            return (ReportResponseDto<JobStatusDetailDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetPastDueUnscheduledJobsAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Past Due Unscheduled Jobs");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetJobsToBeScheduledForNext90DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs to to Scheduled for Next 90 Days");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetPendingNext30DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Pending next 30 days");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext30DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Scheduled next 30 days");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext60DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Scheduled next 60 days");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext7DaysAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Scheduled next 7 days");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetScheduledNext72HoursAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Scheduled next 72 hours");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetScheduledTodayAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Scheduled Today");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedNotReturnedFromEngineerAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Not Returned from engineer");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetReturnedForProcessingAcctMngrAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Returned for processing Acct. Mngr.");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedAndReturnedWithMissingDataAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed and Returned with Missing Data");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedPartsAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Parts");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedTechReviewAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Tech Review");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<ManagerReviewDto>> GetCompletedManagerReviewAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Manager Review");
            return (ReportResponseDto<ManagerReviewDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedCostingAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Costing");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedFSCostingAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed FS Costing");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetMiscAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Misc");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetPostingAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Posting");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetLiebertFSCostingAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Liebert FS Costing");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetCompletedNonFSCostingAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Completed Non FS Costing");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetJobsInvoicedYesterdayAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Jobs Invoiced yesterday");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetServiceCallInvoicedTodayAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Service Call Invoiced today");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetServiceCallInvoiceMonthToDateAsync()
        {
            var result = await GetDisplayCallsDetailAsync("Service Call Invoice Month to Date");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetOfficeSpecificReportAsync(string officeId)
        {
            var result = await GetDisplayCallsDetailAsync(officeId);
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetTechnicianFCDReportAsync(string technicianName)
        {
            var result = await GetDisplayCallsDetailAsync($"{technicianName}FCD");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        public async Task<ReportResponseDto<JobPerformanceDto>> GetTechnicianMISReportAsync(string technicianName)
        {
            var result = await GetDisplayCallsDetailAsync($"{technicianName}MIS");
            return (ReportResponseDto<JobPerformanceDto>)result;
        }

        #endregion
    }
}


//old code below

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