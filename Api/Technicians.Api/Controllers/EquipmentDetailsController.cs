using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentDetailController : ControllerBase
    {
        private readonly EquipmentDetailsRepository _equipmentDetailRepository;
        private readonly ILogger<EquipmentDetailController> _logger;

        public EquipmentDetailController(
            EquipmentDetailsRepository equipmentDetailRepository,
            ILogger<EquipmentDetailController> logger)
        {
            _equipmentDetailRepository = equipmentDetailRepository;
            _logger = logger;
        }

        [HttpGet("GetEquipmentDetails")]
        public IActionResult GetEquipmentDetails([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
            {
                _logger.LogWarning("GetEquipmentDetails called with empty or null callNbr.");
                return BadRequest("Parameter 'callNbr' is required.");
            }

            try
            {
                _logger.LogInformation("API called: GetEquipmentDetails with CallNbr = {CallNbr}", callNbr);

                var result = _equipmentDetailRepository.GetEquipmentDetails(callNbr);

                if (result == null || !result.Any())
                {
                    _logger.LogInformation("No equipment details found for CallNbr: {CallNbr}", callNbr);
                    return NotFound($"No equipment details found for CallNbr: {callNbr}");
                }

                _logger.LogInformation("Found {Count} equipment records for CallNbr: {CallNbr}", result.Count, callNbr);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching equipment details for CallNbr = {CallNbr}", callNbr);
                return StatusCode(500, "An error occurred while fetching equipment details.");
            }
        }
    }
}
