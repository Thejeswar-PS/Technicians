using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DisplayCallsDetailController : ControllerBase
    {
        private readonly IDisplayCallsDetailRepository _repository;

        public DisplayCallsDetailController(IDisplayCallsDetailRepository repository)
        {
            _repository = repository;
        }

        // GET: api/DisplayCallsDetail?pDetailPage=Quotes to be completed this week&pOffID=optionalValue
        [HttpGet]
        public async Task<ActionResult<DisplayCallsDetailResponse>> GetDisplayCallsDetails([FromQuery] string pDetailPage, [FromQuery] string pOffID = "")
        {
            if (string.IsNullOrWhiteSpace(pDetailPage))
            {
                return BadRequest("pDetailPage is required.");
            }

            var result = await _repository.GetDisplayCallsDetailsAsync(pDetailPage, pOffID);
            return Ok(result);
        }
    }
}
//    public class NewDisplayCallsDetailController : ControllerBase
//    {
//        private readonly NewDisplayCallsDetailRepository _repository;
//        private readonly ILogger<NewDisplayCallsDetailController> _logger;

//        public NewDisplayCallsDetailController(
//            NewDisplayCallsDetailRepository repository,
//            ILogger<NewDisplayCallsDetailController> logger)
//        {
//            _repository = repository;
//            _logger = logger;
//        }

//        /// Generic endpoint to get display calls detail data
//        /// <param name="request">Request containing detail page and office ID</param>
//        /// <returns>Structured display calls detail data</returns>
//        [HttpPost("GetDisplayCallsDetail")]
//        public async Task<ActionResult<NewDisplayCallsDetailResponseDto>> GetDisplayCallsDetail([FromBody] NewDisplayCallsDetailRequestDto request)
//        {
//            try
//            {
//                if (request == null)
//                {
//                    return BadRequest(new NewDisplayCallsDetailResponseDto
//                    {
//                        Success = false,
//                        Message = "Request body is required"
//                    });
//                }

//                if (string.IsNullOrWhiteSpace(request.PDetailPage))
//                {
//                    return BadRequest(new NewDisplayCallsDetailResponseDto
//                    {
//                        Success = false,
//                        Message = "DetailPage parameter is required"
//                    });
//                }

//                _logger.LogInformation("Getting display calls detail for DetailPage: {DetailPage}, OfficeId: {OfficeId}", 
//                    request.PDetailPage, request.POffID);

//                var result = await _repository.GetCallsDetailAsync(request);

//                if (result.Success)
//                {
//                    _logger.LogInformation("Successfully retrieved display calls detail for DetailPage: {DetailPage}", 
//                        request.PDetailPage);
//                }
//                else
//                {
//                    _logger.LogWarning("Failed to retrieve display calls detail for DetailPage: {DetailPage}. Error: {Message}", 
//                        request.PDetailPage, result.Message);
//                }

//                return Ok(result);
//            }
//            catch (ArgumentException argEx)
//            {
//                _logger.LogWarning(argEx, "Invalid argument provided for DetailPage: {DetailPage}", 
//                    request?.PDetailPage ?? "null");

//                return BadRequest(new NewDisplayCallsDetailResponseDto
//                {
//                    Success = false,
//                    Message = "Invalid parameter provided",
//                    DetailPage = request?.PDetailPage ?? "",
//                    OfficeId = request?.POffID ?? ""
//                });
//            }
//            catch (ArgumentException argEx)
//            {
//                _logger.LogWarning(argEx, "Invalid argument provided for DetailPage: {DetailPage}", 
//                    request?.PDetailPage ?? "null");

//                return BadRequest(new NewDisplayCallsDetailResponseDto
//                {
//                    Success = false,
//                    Message = "Invalid parameter provided",
//                    DetailPage = request?.PDetailPage ?? "",
//                    OfficeId = request?.POffID ?? ""
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Unexpected error getting display calls detail for DetailPage: {DetailPage}", 
//                    request?.PDetailPage ?? "null");

//                return StatusCode(StatusCodes.Status500InternalServerError, new NewDisplayCallsDetailResponseDto
//                {
//                    Success = false,
//                    Message = "An internal server error occurred while retrieving display calls detail",
//                    DetailPage = request?.PDetailPage ?? "",
//                    OfficeId = request?.POffID ?? ""
//                });
//            }
//        }

//        /// <summary>
//        /// <summary>
//        /// Get display calls detail data using query parameters
//        /// </summary>
//        /// <param name="detailPage">Detail page type</param>
//        /// <param name="officeId">Office ID (optional)</param>
//        /// <returns>Structured display calls detail data</returns>
//        [HttpGet("GetDisplayCallsDetail")]
//        [ProducesResponseType(typeof(NewDisplayCallsDetailResponseDto), StatusCodes.Status200OK)]
//        [ProducesResponseType(typeof(NewDisplayCallsDetailResponseDto), StatusCodes.Status400BadRequest)]
//        [ProducesResponseType(typeof(NewDisplayCallsDetailResponseDto), StatusCodes.Status500InternalServerError)]
//        public async Task<ActionResult<NewDisplayCallsDetailResponseDto>> GetDisplayCallsDetail(
//            [FromQuery] string detailPage,
//            [FromQuery] string officeId = "")
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(detailPage))
//                {
//                    _logger.LogWarning("GetDisplayCallsDetail (GET) called with empty detailPage parameter");
//                    return BadRequest(new NewDisplayCallsDetailResponseDto
//                    {
//                        Success = false,
//                        Message = "detailPage parameter is required"
//                    });
//                }

//                var request = new NewDisplayCallsDetailRequestDto
//                {
//                    PDetailPage = detailPage        ,
//                    POffID = officeId
//                };

//                return await GetDisplayCallsDetail(request);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting display calls detail for DetailPage: {DetailPage}", detailPage);

//                return StatusCode(500, new NewDisplayCallsDetailResponseDto
//                {
//                    Success = false,
//                    Message = "An error occurred while retrieving display calls detail",
//                    DetailPage = detailPage,
//                    OfficeId = officeId
//                });
//            }
//        }

//        /// Get contract invoice month to date data
//        /// <returns>Contract invoice data with totals</returns>
//        [HttpGet("GetContractInvoiceMonthToDate")]
//        public async Task<ActionResult<ContractInvoicesResponseDto>> GetContractInvoiceMonthToDate()
//        {
//            try
//            {
//                _logger.LogInformation("Getting contract invoice month to date data");

//                var result = await _repository.GetContractInvoiceMonthToDateAsync();

//                _logger.LogInformation("Successfully retrieved {Count} contract invoices", result.Count());

//                return Ok(new ContractInvoicesResponseDto
//                {
//                    Success = true,
//                    Message = "Contract invoices retrieved successfully",
//                    Data = result,
//                    TotalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting contract invoice month to date data");
//                return StatusCode(500, new  { success = false, message = "Failed to retrieve contract invoice data" });
//            }
//        }

//        /// Get quotes to be completed this week
//        /// <param name="officeId">Optional office ID filter</param>
//        /// <returns>Quote detail data</returns>
//        [HttpGet("GetQuotesToBeCompleted")]
//        public async Task<ActionResult<IEnumerable<QuoteDetailDto>>> GetQuotesToBeCompleted([FromQuery] string? officeId = null)
//        {
//            try
//            {
//                _logger.LogInformation("Getting quotes to be completed for OfficeId: {OfficeId}", officeId ?? "All");

//                var result = await _repository.GetQuotesToBeCompletedAsync(officeId);

//                _logger.LogInformation("Successfully retrieved {Count} quotes to be completed", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count(),
//                    officeId = officeId
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting quotes to be completed for OfficeId: {OfficeId}", officeId);
//                return StatusCode(500, new { success = false, message = "Failed to retrieve quotes data" });
//            }
//        }

//        /// Get jobs to be processed this week
//        /// <returns>Job detail data</returns>
//        [HttpGet("GetJobsToBeProcessedThisWeek")]
//        public async Task<ActionResult<IEnumerable<JobDetailDto>>> GetJobsToBeProcessedThisWeek()
//        {
//            try
//            {
//                _logger.LogInformation("Getting jobs to be processed this week");

//                var result = await _repository.GetJobsToBeProcessedThisWeekAsync();

//                _logger.LogInformation("Successfully retrieved {Count} jobs to be processed", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs to be processed this week");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve jobs data" });
//            }
//        }

//        /// Get jobs processed this week
//        /// <returns>Job detail data</returns>
//        [HttpGet("GetJobsProcessedThisWeek")]
//        public async Task<ActionResult<IEnumerable<JobDetailDto>>> GetJobsProcessedThisWeek()
//        {
//            try
//            {
//                _logger.LogInformation("Getting jobs processed this week");

//                var result = await _repository.GetJobsProcessedThisWeekAsync();

//                _logger.LogInformation("Successfully retrieved {Count} jobs processed", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs processed this week");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve jobs data" });
//            }
//        }

//        /// Get jobs scheduled by account managers this week
//        /// <returns>Job detail data</returns>
//        [HttpGet("GetJobsScheduledByAccountManagers")]
//        public async Task<ActionResult<IEnumerable<JobDetailDto>>> GetJobsScheduledByAccountManagers()
//        {
//            try
//            {
//                _logger.LogInformation("Getting jobs scheduled by account managers this week");

//                var result = await _repository.GetJobsScheduledByAccountManagersThisWeekAsync();

//                _logger.LogInformation("Successfully retrieved {Count} jobs scheduled by account managers", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs scheduled by account managers");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve jobs data" });
//            }
//        }

//        /// Get pending quotes
//        /// <returns>Quote detail data</returns>
//        [HttpGet("GetPendingQuotes")]
//        public async Task<ActionResult<IEnumerable<QuoteDetailDto>>> GetPendingQuotes()
//        {
//            try
//            {
//                _logger.LogInformation("Getting pending quotes");

//                var result = await _repository.GetPendingQuotesAsync();

//                _logger.LogInformation("Successfully retrieved {Count} pending quotes", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting pending quotes");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve quotes data" });
//            }
//        }

//        /// Get open quotes
//        /// <returns>Quote detail data</returns>
//        [HttpGet("GetOpenQuotes")]
//        public async Task<ActionResult<IEnumerable<QuoteDetailDto>>> GetOpenQuotes()
//        {
//            try
//            {
//                _logger.LogInformation("Getting open quotes");

//                var result = await _repository.GetOpenQuotesAsync();

//                _logger.LogInformation("Successfully retrieved {Count} open quotes", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting open quotes");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve quotes data" });
//            }
//        }

//        /// <summary>
//        /// Get expired quotes
//        /// </summary>
//        /// <returns>Quote detail data</returns>
//        [HttpGet("GetExpiredQuotes")]
//        public async Task<ActionResult<IEnumerable<QuoteDetailDto>>> GetExpiredQuotes()
//        {
//            try
//            {
//                _logger.LogInformation("Getting expired quotes");

//                var result = await _repository.GetExpiredQuotesAsync();

//                _logger.LogInformation("Successfully retrieved {Count} expired quotes", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting expired quotes");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve quotes data" });
//            }
//        }

//        /// <summary>
//        /// Get current invoices
//        /// </summary>
//        /// <returns>Invoice detail data</returns>
//        [HttpGet("GetCurrentInvoices")]
//        public async Task<ActionResult<IEnumerable<InvoiceDetailDto>>> GetCurrentInvoices()
//        {
//            try
//            {
//                _logger.LogInformation("Getting current invoices");

//                var result = await _repository.GetCurrentInvoicesAsync();

//                _logger.LogInformation("Successfully retrieved {Count} current invoices", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting current invoices");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve invoices data" });
//            }
//        }

//        /// <summary>
//        /// Get invoices by age range
//        /// </summary>
//        /// <param name="ageRange">Age range: 1-30, 31-60, 61-90, or 91+</param>
//        /// <returns>Invoice detail data</returns>
//        [HttpGet("GetInvoicesByAge/{ageRange}")]
//        public async Task<ActionResult<IEnumerable<InvoiceDetailDto>>> GetInvoicesByAge(string ageRange)
//        {
//            try
//            {
//                var validAgeRanges = new[] { "1-30", "31-60", "61-90", "91+" };
//                if (!validAgeRanges.Contains(ageRange))
//                {
//                    return BadRequest(new { 
//                        success = false, 
//                        message = $"Invalid age range. Valid values are: {string.Join(", ", validAgeRanges)}" 
//                    });
//                }

//                _logger.LogInformation("Getting invoices for age range: {AgeRange}", ageRange);

//                var result = await _repository.GetInvoicesByAgeAsync(ageRange);

//                _logger.LogInformation("Successfully retrieved {Count} invoices for age range: {AgeRange}", 
//                    result.Count(), ageRange);

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count(),
//                    ageRange = ageRange
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting invoices for age range: {AgeRange}", ageRange);
//                return StatusCode(500, new { success = false, message = "Failed to retrieve invoices data" });
//            }
//        }

//        /// <summary>
//        /// Get unscheduled details by month
//        /// </summary>
//        /// <param name="month">Month name (e.g., January, February, etc.)</param>
//        /// <returns>Unscheduled job detail data</returns>
//        [HttpGet("GetUnscheduledDetailsByMonth/{month}")]
//        public async Task<ActionResult<IEnumerable<UnscheduledJobDetailDto>>> GetUnscheduledDetailsByMonth(string month)
//        {
//            try
//            {
//                var validMonths = new[] { "January", "February", "March", "April", "May", "June",
//                                        "July", "August", "September", "October", "November", "December" };

//                if (!validMonths.Contains(month, StringComparer.OrdinalIgnoreCase))
//                {
//                    return BadRequest(new { 
//                        success = false, 
//                        message = $"Invalid month. Valid values are: {string.Join(", ", validMonths)}" 
//                    });
//                }

//                _logger.LogInformation("Getting unscheduled details for month: {Month}", month);

//                var result = await _repository.GetUnscheduledDetailsByMonthAsync(month);

//                _logger.LogInformation("Successfully retrieved {Count} unscheduled jobs for month: {Month}", 
//                    result.Count(), month);

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count(),
//                    month = month
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting unscheduled details for month: {Month}", month);
//                return StatusCode(500, new { success = false, message = "Failed to retrieve unscheduled job data" });
//            }
//        }

//        /// <summary>
//        /// Get unscheduled account manager details
//        /// </summary>
//        /// <param name="month">Month or "Past Due"</param>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Unscheduled job detail data</returns>
//        [HttpGet("GetUnscheduledAccountManagerDetails")]
//        public async Task<ActionResult<IEnumerable<UnscheduledJobDetailDto>>> GetUnscheduledAccountManagerDetails(
//            [FromQuery] string month, 
//            [FromQuery] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(month))
//                {
//                    return BadRequest(new { success = false, message = "Month parameter is required" });
//                }

//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest(new { success = false, message = "OfficeId parameter is required" });
//                }

//                _logger.LogInformation("Getting unscheduled account manager details for month: {Month}, officeId: {OfficeId}", 
//                    month, officeId);

//                var result = await _repository.GetUnscheduledAccountManagerDetailsAsync(month, officeId);

//                _logger.LogInformation("Successfully retrieved {Count} unscheduled account manager jobs for month: {Month}, officeId: {OfficeId}", 
//                    result.Count(), month, officeId);

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count(),
//                    month = month,
//                    officeId = officeId
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting unscheduled account manager details for month: {Month}, officeId: {OfficeId}", 
//                    month, officeId);
//                return StatusCode(500, new { success = false, message = "Failed to retrieve unscheduled account manager data" });
//            }
//        }

//        /// <summary>
//        /// Get down sites
//        /// </summary>
//        /// <returns>Site status data</returns>
//        [HttpGet("GetDownSites")]
//        public async Task<ActionResult<IEnumerable<SiteStatusDto>>> GetDownSites()
//        {
//            try
//            {
//                _logger.LogInformation("Getting down sites");

//                var result = await _repository.GetDownSitesAsync();

//                _logger.LogInformation("Successfully retrieved {Count} down sites", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting down sites");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve down sites data" });
//            }
//        }

//        /// <summary>
//        /// Get sites with equipment problems
//        /// </summary>
//        /// <returns>Site status data</returns>
//        [HttpGet("GetSitesWithEquipmentProblems")]
//        public async Task<ActionResult<IEnumerable<SiteStatusDto>>> GetSitesWithEquipmentProblems()
//        {
//            try
//            {
//                _logger.LogInformation("Getting sites with equipment problems");

//                var result = await _repository.GetSitesWithEquipmentProblemsAsync();

//                _logger.LogInformation("Successfully retrieved {Count} sites with equipment problems", result.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count()
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting sites with equipment problems");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve sites data" });
//            }
//        }

//        /// <summary>
//        /// Get contract billing data
//        /// </summary>
//        /// <param name="contractType">Contract type: Liebert or Non Liebert</param>
//        /// <param name="timeframe">Timeframe: not billed as of yesterday, to be billed in next 30 days, etc.</param>
//        /// <returns>Contract billing data with totals</returns>
//        [HttpGet("GetContractBilling")]
//        public async Task<ActionResult> GetContractBilling(
//            [FromQuery] string contractType, 
//            [FromQuery] string timeframe)
//        {
//            try
//            {
//                var validContractTypes = new[] { "Liebert", "Non Liebert" };
//                var validTimeframes = new[] { 
//                    "not billed as of yesterday",
//                    "to be billed in next 30 days",
//                    "to be billed in next 60 days", 
//                    "to be billed in next 90 days",
//                    "to be billed after 90 days"
//                };

//                if (!validContractTypes.Contains(contractType, StringComparer.OrdinalIgnoreCase))
//                {
//                    return BadRequest(new { 
//                        success = false, 
//                        message = $"Invalid contract type. Valid values are: {string.Join(", ", validContractTypes)}" 
//                    });
//                }

//                if (!validTimeframes.Contains(timeframe, StringComparer.OrdinalIgnoreCase))
//                {
//                    return BadRequest(new { 
//                        success = false, 
//                        message = $"Invalid timeframe. Valid values are: {string.Join(", ", validTimeframes)}" 
//                    });
//                }

//                _logger.LogInformation("Getting contract billing data for contractType: {ContractType}, timeframe: {Timeframe}", 
//                    contractType, timeframe);

//                var (data, total) = await _repository.GetContractBillingAsync(contractType, timeframe);

//                _logger.LogInformation("Successfully retrieved {Count} contract billing records", data.Count());

//                return Ok(new
//                {
//                    success = true,
//                    data = data,
//                    total = total,
//                    totalRecords = data.Count(),
//                    contractType = contractType,
//                    timeframe = timeframe
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting contract billing data for contractType: {ContractType}, timeframe: {Timeframe}", 
//                    contractType, timeframe);
//                return StatusCode(500, new { success = false, message = "Failed to retrieve contract billing data" });
//            }
//        }

//        /// <summary>
//        /// Get available detail page types
//        /// </summary>
//        /// <returns>List of available detail page types</returns>
//        [HttpGet("GetAvailableDetailPages")]
//        public ActionResult<List<string>> GetAvailableDetailPages()
//        {
//            try
//            {
//                var detailPages = NewDisplayCallsDetailRepository.GetAvailableDetailPages();

//                return Ok(new
//                {
//                    success = true,
//                    data = detailPages,
//                    totalPages = detailPages.Count
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting available detail pages");
//                return StatusCode(500, new { success = false, message = "Failed to retrieve available detail pages" });
//            }
//        }
//    }
//}