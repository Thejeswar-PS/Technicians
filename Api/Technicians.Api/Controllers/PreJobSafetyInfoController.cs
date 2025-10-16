using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PreJobSafetyInfoController : ControllerBase
    {
        private readonly PreJobSafetyInfoRepository _JobSafetyrepository;

        public PreJobSafetyInfoController(PreJobSafetyInfoRepository JobSafetyrepository)
        {
            _JobSafetyrepository = JobSafetyrepository;
        }

        [HttpPost("SaveUpdatePreJobSafety")]
        public async Task<IActionResult> SaveUpdatePreJobSafety([FromBody] PreJobSafetyInfoDto safetyData, [FromQuery] String empId)
        {
            if (safetyData == null || string.IsNullOrWhiteSpace(safetyData.CallNbr))
                return BadRequest(new { success = false, message = "CallNbr is required." });

            var result = await _JobSafetyrepository.SaveOrUpdatePreJobSafetyInfoAsync(safetyData, empId);

            if (result)
                return Ok(new { success = true, message = "Saved/Updated successfully." });
            else
                return StatusCode(500, new { success = false, message = "An error occurred while saving data." });
        }

    }
}