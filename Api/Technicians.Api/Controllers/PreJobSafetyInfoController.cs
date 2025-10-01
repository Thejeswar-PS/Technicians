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

        [HttpPost]
        public async Task<IActionResult> SaveOrUpdatePreJobSafety([FromBody] PreJobSafetyInfoDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CallNbr))
                return BadRequest("CallNbr is required.");

            bool success = await _JobSafetyrepository.SaveOrUpdatePreJobSafetyInfoAsync(dto);

            if (success)
                return Ok("Saved/Updated successfully.");
            else
                return StatusCode(500, "An error occurred.");
        }
    }
}