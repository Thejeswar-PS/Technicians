using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReadingsController : ControllerBase
    {
        private readonly ReadingsRepository _repository;

        public ReadingsController(ReadingsRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("GetManufacturerNames")]
        public async Task<IActionResult> GetManufacturerNames()
        {
            try
            {
                var manufacturers = await _repository.GetManufacturerNamesAsync();

                if (manufacturers == null)
                    return NotFound("No manufacturer names found.");

                return Ok(manufacturers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching manufacturer names: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryInfo")]
        public async Task<IActionResult> GetBatteryInfo([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var batteries = await _repository.GetBatteryInfoAsync(callNbr, equipId, batStrId);
                return Ok(batteries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching battery info: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryStringReadingsInfo")]
        public async Task<IActionResult> GetBatteryStringReadingsInfo([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var result = await _repository.GetBatteryStringReadingsInfoAsync(callNbr, equipId, batStrId);

                if (result == null)
                    return NotFound("No readings found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log if desired
                return StatusCode(500, $"Error fetching battery string readings: {ex.Message}");
            }
        }
    }
}
