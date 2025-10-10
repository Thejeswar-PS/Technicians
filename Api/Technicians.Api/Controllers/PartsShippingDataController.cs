using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;


namespace Technicians.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class PartsShippingDataController : ControllerBase
    {
        private readonly PartsShippingDataRepository _repository;

        public PartsShippingDataController(PartsShippingDataRepository repository)
        {
            _repository = repository;
        }


        /// <summary>
        /// Retrieves parts shipping data for a service call, optionally filtered by SCID_Inc.
        /// </summary>
        /// <param name="callNbr">Service call number (required)</param>
        /// <param name="scidInc">SCID_Inc (optional)</param>
        /// <returns>List of PartsShippingDataDto</returns>
        [HttpGet("GetShippingData")]
        public async Task<ActionResult<IEnumerable<PartsShippingDataDto>>> Get([FromQuery] string callNbr, [FromQuery] int? scidInc)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            try
            {
                var data = await _repository.GetShippingDataAsync(callNbr, scidInc);
                return Ok(data);
            }
            catch (Exception ex)
            {
                // Optionally, log the exception here.
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}