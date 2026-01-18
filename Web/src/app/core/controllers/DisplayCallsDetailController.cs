using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using Technicians.Api.Models;
using Technicians.Api.Repositories;

namespace Technicians.Api.Controllers
{
    /// <summary>
    /// Controller for handling NewDisplayCallsDetail reports and analytics
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Add authorization as needed
    public class DisplayCallsDetailController : ControllerBase
    {
        private readonly IDisplayCallsDetailRepository _repository;
        private readonly ILogger<DisplayCallsDetailController> _logger;

        public DisplayCallsDetailController(
            IDisplayCallsDetailRepository repository, 
            ILogger<DisplayCallsDetailController> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Generic endpoint to handle any report type dynamically
        /// </summary>
        /// <param name="request">The request containing detail page and office ID</param>
        /// <returns>Dynamic report data based on the requested type</returns>
        [HttpPost("report")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetReport([FromBody] NewDisplayCallsDetailRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Processing report request for detailPage: {DetailPage}, officeId: {OfficeId}", 
                    request.PDetailPage, request.POffID);

                var result = await _repository.GetDisplayCallsDetailAsync(request.PDetailPage, request.POffID);

                return Ok(new NewDisplayCallsDetailResponseDto
                {
                    Success = true,
                    DetailPage = request.PDetailPage,
                    OfficeId = request.POffID,
                    Data = result,
                    GeneratedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing report for detailPage: {DetailPage}", request.PDetailPage);
                return StatusCode(500, new NewDisplayCallsDetailResponseDto
                {
                    Success = false,
                    Message = "An error occurred while processing the report",
                    DetailPage = request.PDetailPage,
                    OfficeId = request.POffID
                });
            }
        }

        /// <summary>
        /// Alternative GET endpoint for simple report requests
        /// </summary>
        /// <param name="detailPage">The type of report to generate</param>
        /// <param name="officeId">Optional office ID filter</param>
        /// <returns>Dynamic report data</returns>
        [HttpGet("{detailPage}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetReportByPath(
            [FromRoute] string detailPage, 
            [FromQuery] string? officeId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(detailPage))
                {
                    return BadRequest("Detail page parameter is required");
                }

                _logger.LogInformation("Processing GET report request for detailPage: {DetailPage}, officeId: {OfficeId}", 
                    detailPage, officeId ?? "");

                var result = await _repository.GetDisplayCallsDetailAsync(detailPage, officeId ?? "");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GET report for detailPage: {DetailPage}", detailPage);
                return StatusCode(500, "An error occurred while processing the report");
            }
        }

        #region Contract Reports

        /// <summary>
        /// Get contract invoices for month to date
        /// </summary>
        [HttpGet("contract/invoice-month-to-date")]
        [ProducesResponseType(typeof(ReportResponseDto<ContractInvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ContractInvoiceDto>>> GetContractInvoiceMonthToDate()
        {
            try
            {
                var result = await _repository.GetContractInvoiceMonthToDateAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contract invoice month to date");
                return StatusCode(500, "An error occurred while retrieving contract invoices");
            }
        }

        #endregion

        #region Quote Reports

        /// <summary>
        /// Get quotes to be completed this week
        /// </summary>
        /// <param name="officeId">Optional office ID filter</param>
        [HttpGet("quotes/to-be-completed-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<QuoteDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<QuoteDto>>> GetQuotesToBeCompletedThisWeek(
            [FromQuery] string? officeId = null)
        {
            try
            {
                var result = await _repository.GetQuotesToBeCompletedThisWeekAsync(officeId ?? "");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quotes to be completed this week");
                return StatusCode(500, "An error occurred while retrieving quotes");
            }
        }

        /// <summary>
        /// Get quotes to be completed
        /// </summary>
        /// <param name="officeId">Optional office ID filter</param>
        [HttpGet("quotes/to-be-completed")]
        [ProducesResponseType(typeof(ReportResponseDto<CompleteQuoteDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<CompleteQuoteDto>>> GetQuotesToBeCompleted(
            [FromQuery] string? officeId = null)
        {
            try
            {
                var result = await _repository.GetQuotesToBeCompletedAsync(officeId ?? "");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quotes to be completed");
                return StatusCode(500, "An error occurred while retrieving quotes");
            }
        }

        /// <summary>
        /// Get pending quotes
        /// </summary>
        [HttpGet("quotes/pending")]
        [ProducesResponseType(typeof(ReportResponseDto<QuoteManagementDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<QuoteManagementDto>>> GetPendingQuotes()
        {
            try
            {
                var result = await _repository.GetPendingQuotesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending quotes");
                return StatusCode(500, "An error occurred while retrieving pending quotes");
            }
        }

        /// <summary>
        /// Get open quotes
        /// </summary>
        [HttpGet("quotes/open")]
        [ProducesResponseType(typeof(ReportResponseDto<QuoteManagementDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<QuoteManagementDto>>> GetOpenQuotes()
        {
            try
            {
                var result = await _repository.GetOpenQuotesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving open quotes");
                return StatusCode(500, "An error occurred while retrieving open quotes");
            }
        }

        /// <summary>
        /// Get expired quotes
        /// </summary>
        [HttpGet("quotes/expired")]
        [ProducesResponseType(typeof(ReportResponseDto<QuoteManagementDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<QuoteManagementDto>>> GetExpiredQuotes()
        {
            try
            {
                var result = await _repository.GetExpiredQuotesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving expired quotes");
                return StatusCode(500, "An error occurred while retrieving expired quotes");
            }
        }

        /// <summary>
        /// Get quotes completed by account managers this week
        /// </summary>
        [HttpGet("quotes/completed-by-account-managers-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<CompleteQuoteDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<CompleteQuoteDto>>> GetQuotesCompletedByAccountManagersThisWeek()
        {
            try
            {
                var result = await _repository.GetQuotesCompletedByAccountManagersThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quotes completed by account managers");
                return StatusCode(500, "An error occurred while retrieving quotes");
            }
        }

        #endregion

        #region Job Processing Reports

        /// <summary>
        /// Get jobs to be processed this week
        /// </summary>
        [HttpGet("jobs/to-be-processed-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobProcessingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobProcessingDto>>> GetJobsToBeProcessedThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsToBeProcessedThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs to be processed this week");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        /// <summary>
        /// Get jobs processed this week
        /// </summary>
        [HttpGet("jobs/processed-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobProcessingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobProcessingDto>>> GetJobsProcessedThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsProcessedThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs processed this week");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        /// <summary>
        /// Get jobs processed by account managers this week
        /// </summary>
        [HttpGet("jobs/processed-by-account-managers-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobProcessingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobProcessingDto>>> GetJobsProcessedByAccountManagersThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsProcessedByAccountManagersThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs processed by account managers");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        #endregion

        #region Job Scheduling Reports

        /// <summary>
        /// Get jobs to be scheduled this week
        /// </summary>
        [HttpGet("jobs/to-be-scheduled-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobSchedulingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobSchedulingDto>>> GetJobsToBeScheduledThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsToBeScheduledThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs to be scheduled this week");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        /// <summary>
        /// Get jobs scheduled by account managers this week
        /// </summary>
        [HttpGet("jobs/scheduled-by-account-managers-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobProcessingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobProcessingDto>>> GetJobsScheduledByAccountManagersThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsScheduledByAccountManagersThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs scheduled by account managers");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        /// <summary>
        /// Get jobs scheduled by scheduling coordinator this week
        /// </summary>
        [HttpGet("jobs/scheduled-by-scheduling-coordinator-this-week")]
        [ProducesResponseType(typeof(ReportResponseDto<JobProcessingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobProcessingDto>>> GetJobsScheduledBySchedulingCoordinatorThisWeek()
        {
            try
            {
                var result = await _repository.GetJobsScheduledBySchedulingCoordinatorThisWeekAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs scheduled by scheduling coordinator");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        #endregion

        #region Invoice Reports

        /// <summary>
        /// Get current invoices
        /// </summary>
        [HttpGet("invoices/current")]
        [ProducesResponseType(typeof(ReportResponseDto<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<InvoiceDto>>> GetCurrentInvoices()
        {
            try
            {
                var result = await _repository.GetCurrentInvoicesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current invoices");
                return StatusCode(500, "An error occurred while retrieving invoices");
            }
        }

        /// <summary>
        /// Get invoices 1 to 30 days old
        /// </summary>
        [HttpGet("invoices/1-to-30-days")]
        [ProducesResponseType(typeof(ReportResponseDto<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<InvoiceDto>>> GetInvoices1To30Days()
        {
            try
            {
                var result = await _repository.GetInvoices1To30DaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoices 1-30 days");
                return StatusCode(500, "An error occurred while retrieving invoices");
            }
        }

        /// <summary>
        /// Get invoices 31 to 60 days old
        /// </summary>
        [HttpGet("invoices/31-to-60-days")]
        [ProducesResponseType(typeof(ReportResponseDto<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<InvoiceDto>>> GetInvoices31To60Days()
        {
            try
            {
                var result = await _repository.GetInvoices31To60DaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoices 31-60 days");
                return StatusCode(500, "An error occurred while retrieving invoices");
            }
        }

        /// <summary>
        /// Get invoices 61 to 90 days old
        /// </summary>
        [HttpGet("invoices/61-to-90-days")]
        [ProducesResponseType(typeof(ReportResponseDto<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<InvoiceDto>>> GetInvoices61To90Days()
        {
            try
            {
                var result = await _repository.GetInvoices61To90DaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoices 61-90 days");
                return StatusCode(500, "An error occurred while retrieving invoices");
            }
        }

        /// <summary>
        /// Get invoices 91+ days old
        /// </summary>
        [HttpGet("invoices/91-plus-days")]
        [ProducesResponseType(typeof(ReportResponseDto<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<InvoiceDto>>> GetInvoices91PlusDays()
        {
            try
            {
                var result = await _repository.GetInvoices91PlusDaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoices 91+ days");
                return StatusCode(500, "An error occurred while retrieving invoices");
            }
        }

        #endregion

        #region Contract Billing Reports

        /// <summary>
        /// Get Liebert contracts not billed as of yesterday
        /// </summary>
        [HttpGet("contracts/liebert-not-billed-yesterday")]
        [ProducesResponseType(typeof(ReportResponseDto<ContractBillingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ContractBillingDto>>> GetLiebertContractsNotBilledAsOfYesterday()
        {
            try
            {
                var result = await _repository.GetLiebertContractsNotBilledAsOfYesterdayAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Liebert contracts not billed yesterday");
                return StatusCode(500, "An error occurred while retrieving contracts");
            }
        }

        /// <summary>
        /// Get non-Liebert contracts not billed as of yesterday
        /// </summary>
        [HttpGet("contracts/non-liebert-not-billed-yesterday")]
        [ProducesResponseType(typeof(ReportResponseDto<ContractBillingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ContractBillingDto>>> GetNonLiebertContractsNotBilledAsOfYesterday()
        {
            try
            {
                var result = await _repository.GetNonLiebertContractsNotBilledAsOfYesterdayAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving non-Liebert contracts not billed yesterday");
                return StatusCode(500, "An error occurred while retrieving contracts");
            }
        }

        /// <summary>
        /// Get Liebert contracts to be billed in next 30 days
        /// </summary>
        [HttpGet("contracts/liebert-to-be-billed-next-30-days")]
        [ProducesResponseType(typeof(ReportResponseDto<ContractBillingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ContractBillingDto>>> GetLiebertContractsToBeBilledInNext30Days()
        {
            try
            {
                var result = await _repository.GetLiebertContractsToBeBilledInNext30DaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Liebert contracts to be billed in next 30 days");
                return StatusCode(500, "An error occurred while retrieving contracts");
            }
        }

        /// <summary>
        /// Get non-Liebert contracts to be billed in next 30 days
        /// </summary>
        [HttpGet("contracts/non-liebert-to-be-billed-next-30-days")]
        [ProducesResponseType(typeof(ReportResponseDto<ContractBillingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ContractBillingDto>>> GetNonLiebertContractsToBeBilledInNext30Days()
        {
            try
            {
                var result = await _repository.GetNonLiebertContractsToBeBilledInNext30DaysAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving non-Liebert contracts to be billed in next 30 days");
                return StatusCode(500, "An error occurred while retrieving contracts");
            }
        }

        #endregion

        #region Parts Tracking Reports

        /// <summary>
        /// Get jobs to be tracked - parts shipped from DC Group
        /// </summary>
        [HttpGet("parts/jobs-to-be-tracked-dc-group")]
        [ProducesResponseType(typeof(ReportResponseDto<PartsTrackingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<PartsTrackingDto>>> GetJobsToBeTrackedPartShippedFromDCGroup()
        {
            try
            {
                var result = await _repository.GetJobsToBeTrackedPartShippedFromDCGroupAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs with parts shipped from DC Group");
                return StatusCode(500, "An error occurred while retrieving parts tracking data");
            }
        }

        /// <summary>
        /// Get jobs to be tracked - parts shipped from vendors
        /// </summary>
        [HttpGet("parts/jobs-to-be-tracked-vendors")]
        [ProducesResponseType(typeof(ReportResponseDto<PartsTrackingDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<PartsTrackingDto>>> GetJobsToBeTrackedPartShippedFromVendors()
        {
            try
            {
                var result = await _repository.GetJobsToBeTrackedPartShippedFromVendorsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs with parts shipped from vendors");
                return StatusCode(500, "An error occurred while retrieving parts tracking data");
            }
        }

        /// <summary>
        /// Get crash kit parts information
        /// </summary>
        [HttpGet("parts/crash-kit")]
        [ProducesResponseType(typeof(ReportResponseDto<PartsRequestDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<PartsRequestDto>>> GetCrashKit()
        {
            try
            {
                var result = await _repository.GetCrashKitAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving crash kit information");
                return StatusCode(500, "An error occurred while retrieving crash kit data");
            }
        }

        /// <summary>
        /// Get load bank parts information
        /// </summary>
        [HttpGet("parts/load-bank")]
        [ProducesResponseType(typeof(ReportResponseDto<PartsRequestDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<PartsRequestDto>>> GetLoadBank()
        {
            try
            {
                var result = await _repository.GetLoadBankAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving load bank information");
                return StatusCode(500, "An error occurred while retrieving load bank data");
            }
        }

        #endregion

        #region Site Status Reports

        /// <summary>
        /// Get down sites information
        /// </summary>
        [HttpGet("sites/down-sites")]
        [ProducesResponseType(typeof(ReportResponseDto<SiteStatusDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<SiteStatusDto>>> GetDownSites()
        {
            try
            {
                var result = await _repository.GetDownSitesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving down sites");
                return StatusCode(500, "An error occurred while retrieving site status data");
            }
        }

        /// <summary>
        /// Get sites with equipment problems
        /// </summary>
        [HttpGet("sites/equipment-problems")]
        [ProducesResponseType(typeof(ReportResponseDto<SiteStatusDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<SiteStatusDto>>> GetSitesWithEquipmentProblem()
        {
            try
            {
                var result = await _repository.GetSitesWithEquipmentProblemAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sites with equipment problems");
                return StatusCode(500, "An error occurred while retrieving site status data");
            }
        }

        #endregion

        #region Job Performance Reports

        /// <summary>
        /// Get past due unscheduled jobs
        /// </summary>
        [HttpGet("jobs/past-due-unscheduled")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetPastDueUnscheduledJobs()
        {
            try
            {
                var result = await _repository.GetPastDueUnscheduledJobsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving past due unscheduled jobs");
                return StatusCode(500, "An error occurred while retrieving job data");
            }
        }

        /// <summary>
        /// Get jobs scheduled today
        /// </summary>
        [HttpGet("jobs/scheduled-today")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetScheduledToday()
        {
            try
            {
                var result = await _repository.GetScheduledTodayAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs scheduled today");
                return StatusCode(500, "An error occurred while retrieving job data");
            }
        }

        /// <summary>
        /// Get completed manager review jobs
        /// </summary>
        [HttpGet("jobs/completed-manager-review")]
        [ProducesResponseType(typeof(ReportResponseDto<ManagerReviewDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<ManagerReviewDto>>> GetCompletedManagerReview()
        {
            try
            {
                var result = await _repository.GetCompletedManagerReviewAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving completed manager review jobs");
                return StatusCode(500, "An error occurred while retrieving job data");
            }
        }

        /// <summary>
        /// Get jobs invoiced yesterday
        /// </summary>
        [HttpGet("jobs/invoiced-yesterday")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetJobsInvoicedYesterday()
        {
            try
            {
                var result = await _repository.GetJobsInvoicedYesterdayAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs invoiced yesterday");
                return StatusCode(500, "An error occurred while retrieving job data");
            }
        }

        /// <summary>
        /// Get service calls invoiced today
        /// </summary>
        [HttpGet("jobs/service-calls-invoiced-today")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetServiceCallInvoicedToday()
        {
            try
            {
                var result = await _repository.GetServiceCallInvoicedTodayAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving service calls invoiced today");
                return StatusCode(500, "An error occurred while retrieving job data");
            }
        }

        #endregion

        #region Dynamic Reports

        /// <summary>
        /// Get unscheduled detail report by month
        /// </summary>
        /// <param name="month">Month name (e.g., January, February, etc.)</param>
        [HttpGet("unscheduled-detail/{month}")]
        [ProducesResponseType(typeof(ReportResponseDto<JobStatusDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobStatusDetailDto>>> GetUnscheduledDetail(
            [FromRoute] string month)
        {
            try
            {
                var result = await _repository.GetUnscheduledDetailAsync(month);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unscheduled detail for month: {Month}", month);
                return StatusCode(500, "An error occurred while retrieving unscheduled detail");
            }
        }

        /// <summary>
        /// Get unscheduled account manager detail report
        /// </summary>
        /// <param name="month">Month name or 'Past Due'</param>
        /// <param name="officeId">Office ID filter</param>
        [HttpGet("unscheduled-act-mngr-detail/{month}")]
        [ProducesResponseType(typeof(ReportResponseDto<JobStatusDetailDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobStatusDetailDto>>> GetUnscheduledActMngrDetail(
            [FromRoute] string month, 
            [FromQuery] string? officeId = null)
        {
            try
            {
                var result = await _repository.GetUnscheduledActMngrDetailAsync(month, officeId ?? "");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unscheduled account manager detail for month: {Month}, office: {OfficeId}", 
                    month, officeId);
                return StatusCode(500, "An error occurred while retrieving unscheduled detail");
            }
        }

        /// <summary>
        /// Get office-specific report
        /// </summary>
        /// <param name="officeId">Office ID</param>
        [HttpGet("office/{officeId}/report")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetOfficeSpecificReport(
            [FromRoute] string officeId)
        {
            try
            {
                var result = await _repository.GetOfficeSpecificReportAsync(officeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving office-specific report for office: {OfficeId}", officeId);
                return StatusCode(500, "An error occurred while retrieving office report");
            }
        }

        /// <summary>
        /// Get technician FCD report
        /// </summary>
        /// <param name="technicianName">Technician name</param>
        [HttpGet("technician/{technicianName}/fcd")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetTechnicianFCDReport(
            [FromRoute] string technicianName)
        {
            try
            {
                var result = await _repository.GetTechnicianFCDReportAsync(technicianName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving technician FCD report for: {TechnicianName}", technicianName);
                return StatusCode(500, "An error occurred while retrieving technician report");
            }
        }

        /// <summary>
        /// Get technician MIS report
        /// </summary>
        /// <param name="technicianName">Technician name</param>
        [HttpGet("technician/{technicianName}/mis")]
        [ProducesResponseType(typeof(ReportResponseDto<JobPerformanceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReportResponseDto<JobPerformanceDto>>> GetTechnicianMISReport(
            [FromRoute] string technicianName)
        {
            try
            {
                var result = await _repository.GetTechnicianMISReportAsync(technicianName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving technician MIS report for: {TechnicianName}", technicianName);
                return StatusCode(500, "An error occurred while retrieving technician report");
            }
        }

        #endregion

        #region Health Check

        /// <summary>
        /// Health check endpoint
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult HealthCheck()
        {
            return Ok(new { 
                Status = "Healthy", 
                Timestamp = DateTime.UtcNow,
                Service = "DisplayCallsDetailController"
            });
        }

        #endregion
    }
}