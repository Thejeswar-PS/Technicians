using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsSearchController : ControllerBase
    {
        private readonly IPartsSearchRepository _repository;
        private readonly ILogger<PartsSearchController> _logger;

        public PartsSearchController(
            IPartsSearchRepository repository,
            ILogger<PartsSearchController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Search parts data using POST (recommended for complex filters)
        /// </summary>
        /// <param name="request">Parts search criteria</param>
        /// <returns>Parts search results</returns>
        [HttpPost("search")]
        [ProducesResponseType(typeof(PartsSearchDataResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(PartsSearchDataResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(PartsSearchDataResponse), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PartsSearchDataResponse>> SearchPartsData(
            [FromBody] PartsSearchRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    _logger.LogWarning("SearchPartsData called with null request body");
                    return BadRequest(new PartsSearchDataResponse
                    {
                        Success = false,
                        Message = "Request body is required"
                    });
                }

                _logger.LogInformation(
                    "Parts Search initiated | Address={Address} | Status={Status} | SiteID={SiteID} | Make={Make} | Model={Model}",
                    request.Address,
                    request.Status,
                    request.SiteID,
                    request.Make,
                    request.Model
                );

                var result = await _repository.GetPartsSearchDataAsync(request);

                if (!result.Success)
                {
                    _logger.LogWarning("Parts search failed: {Message}", result.Message);
                    return StatusCode(StatusCodes.Status500InternalServerError, result);
                }

                _logger.LogInformation(
                    "Parts search completed successfully | Records Returned={Count}",
                    result.TotalRecords
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred in SearchPartsData");

                return StatusCode(StatusCodes.Status500InternalServerError, new PartsSearchDataResponse
                {
                    Success = false,
                    Message = "An internal server error occurred while searching parts data"
                });
            }
        }

        /// <summary>
        /// Search parts data using GET (query string support)
        /// </summary>
        [HttpGet("search")]
        [ProducesResponseType(typeof(PartsSearchDataResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(PartsSearchDataResponse), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PartsSearchDataResponse>> SearchPartsDataByQuery(
            [FromQuery] string? address,
            [FromQuery] string status = "%",
            [FromQuery] string siteId = "%",
            [FromQuery] string make = "%",
            [FromQuery] string model = "%",
            [FromQuery] string kva = "%",
            [FromQuery] string ipVoltage = "%",
            [FromQuery] string opVoltage = "%",
            [FromQuery] string manufPartNo = "%",
            [FromQuery] string dcgPartNo = "%")
        {
            var request = new PartsSearchRequestDto
            {
                Address = address ?? string.Empty,
                Status = status,
                SiteID = siteId,
                Make = make,
                Model = model,
                KVA = kva,
                IPVoltage = ipVoltage,
                OPVoltage = opVoltage,
                ManufPartNo = manufPartNo,
                DCGPartNo = dcgPartNo
            };

            return await SearchPartsData(request);
        }
    }
}
