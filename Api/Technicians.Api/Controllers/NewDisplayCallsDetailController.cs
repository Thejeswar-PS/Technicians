using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;
using System.Diagnostics;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewDisplayCallsDetailController : ControllerBase
    {
        private readonly NewDisplayCallsDetailRepository _repository;
        private readonly ILogger<NewDisplayCallsDetailController> _logger;

        public NewDisplayCallsDetailController(NewDisplayCallsDetailRepository repository, ILogger<NewDisplayCallsDetailController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<NewDisplayCallsDetailResponse>> Get(
            [FromQuery] string detailPage,
            [FromQuery] string? offId = null)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                if (string.IsNullOrWhiteSpace(detailPage))
                {
                    _logger.LogWarning("NewDisplayCallsDetail called with empty detailPage parameter");
                    return BadRequest(new { 
                        success = false, 
                        message = "DetailPage is required.",
                        validOptions = _repository.GetValidDetailPages()
                    });
                }

                // Automatically map legacy parameter names to modern ones
                var originalDetailPage = detailPage;
                var mappedDetailPage = _repository.MapLegacyParameterName(detailPage);
                
                _logger.LogInformation("NewDisplayCallsDetail called with DetailPage='{OriginalDetailPage}'{MappingInfo}, OffId='{OffId}'", 
                    originalDetailPage, 
                    mappedDetailPage != originalDetailPage ? $" (mapped to '{mappedDetailPage}')" : "",
                    offId ?? "null");

                var request = new NewDisplayCallsDetailRequest
                {
                    DetailPage = mappedDetailPage, // Use mapped parameter
                    OffId = offId
                };

                var result = await _repository.GetAsync(request);

                stopwatch.Stop();
                
                var dataCount = result.Data?.Count() ?? 0;
                if (dataCount == 0)
                {
                    _logger.LogWarning("No data returned for DetailPage='{DetailPage}', OffId='{OffId}' - may be invalid detail page or no data available", 
                        mappedDetailPage, offId);
                    
                    return Ok(new { 
                        success = true, 
                        message = $"No data found for detail page '{originalDetailPage}'. This may be an invalid detail page or no data is available.",
                        originalParameter = originalDetailPage,
                        mappedParameter = mappedDetailPage,
                        parameterMapped = mappedDetailPage != originalDetailPage,
                        data = result.Data,
                        totals = result.Totals,
                        executionTimeMs = stopwatch.ElapsedMilliseconds,
                        validOptions = _repository.GetValidDetailPages()
                    });
                }

                _logger.LogInformation("NewDisplayCallsDetail completed successfully in {ElapsedMs}ms - DetailPage='{DetailPage}', DataCount={DataCount}, HasTotals={HasTotals}", 
                    stopwatch.ElapsedMilliseconds, mappedDetailPage, dataCount, result.Totals != null);

                // Enhanced response with mapping information
                return Ok(new { 
                    success = true, 
                    originalParameter = originalDetailPage,
                    mappedParameter = mappedDetailPage,
                    parameterMapped = mappedDetailPage != originalDetailPage,
                    data = result.Data,
                    totals = result.Totals,
                    executionTimeMs = stopwatch.ElapsedMilliseconds 
                });
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Error in NewDisplayCallsDetail after {ElapsedMs}ms - DetailPage='{DetailPage}', OffId='{OffId}'", 
                    stopwatch.ElapsedMilliseconds, detailPage, offId);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving the display calls detail.",
                    error = ex.Message,
                    originalParameter = detailPage,
                    mappedParameter = _repository.MapLegacyParameterName(detailPage),
                    executionTimeMs = stopwatch.ElapsedMilliseconds,
                    validOptions = _repository.GetValidDetailPages()
                });
            }
        }

        /// <summary>
        /// Get list of valid detail page options (both modern and legacy names)
        /// </summary>
        [HttpGet("valid-options")]
        public ActionResult GetValidDetailPages()
        {
            try
            {
                var validOptions = _repository.GetValidDetailPages();
                var legacyMappings = _repository.GetLegacyNameMappings();
                
                return Ok(new { 
                    success = true, 
                    modernParameterNames = validOptions,
                    legacyParameterMappings = legacyMappings,
                    info = "You can use either modern parameter names or legacy names - they will be automatically mapped."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting valid detail pages");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve valid detail pages" 
                });
            }
        }

        [HttpGet("legacy")]
        public async Task<ActionResult<NewDisplayCallsDetailResponse>> GetLegacy(
            [FromQuery] string dataSetName,
            [FromQuery] string? page = null,
            [FromQuery] string? month = null,
            [FromQuery] string? offId = null)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (string.IsNullOrWhiteSpace(dataSetName))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "DataSetName is required for legacy compatibility.",
                        validOptions = _repository.GetValidDetailPages()
                    });
                }

                // Map legacy parameter name to stored procedure parameter name
                var mappedDetailPage = _repository.MapLegacyParameterName(dataSetName);

                // Handle special legacy parameter formats
                string finalDetailPage = mappedDetailPage;
                string finalOffId = offId ?? string.Empty;

                if (!string.IsNullOrEmpty(page))
                {
                    switch (page.ToUpper())
                    {
                        case "UNSCHED":
                            finalDetailPage = $"UnschedDetail{dataSetName}";
                            break;
                        case "UNSCHEDACTMNGR":
                            finalDetailPage = $"UnschedActMngrDetail{month}";
                            finalOffId = dataSetName; // In this case, dataSetName is the office ID
                            break;
                        case "QUOTE":
                            finalDetailPage = "Quotes to be Completed";
                            finalOffId = dataSetName;
                            break;
                        default:
                            finalDetailPage = page;
                            break;
                    }
                }

                _logger.LogInformation("Legacy API call: DataSetName='{DataSetName}', Page='{Page}', Month='{Month}', MappedTo='{MappedDetailPage}'",
                    dataSetName, page, month, finalDetailPage);

                var request = new NewDisplayCallsDetailRequest
                {
                    DetailPage = finalDetailPage,
                    OffId = finalOffId
                };

                var result = await _repository.GetAsync(request);

                stopwatch.Stop();

                return Ok(new
                {
                    success = true,
                    legacyCompatibility = true,
                    originalDataSetName = dataSetName,
                    mappedDetailPage = finalDetailPage,
                    data = result.Data,
                    totals = result.Totals,
                    executionTimeMs = stopwatch.ElapsedMilliseconds
                });
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Error in legacy NewDisplayCallsDetail after {ElapsedMs}ms - DataSetName='{DataSetName}', Page='{Page}'",
                    stopwatch.ElapsedMilliseconds, dataSetName, page);

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the legacy display calls detail.",
                    error = ex.Message,
                    dataSetName = dataSetName,
                    executionTimeMs = stopwatch.ElapsedMilliseconds
                });
            }
        }
    }
}