using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PreJobSafetyListInfoController : ControllerBase
    {
        private readonly PreJobSafetyListInfoRepository _JobSafetyrepository;

        public PreJobSafetyListInfoController(PreJobSafetyListInfoRepository JobSafetyrepository)
        {
            _JobSafetyrepository = JobSafetyrepository;
        }

        [HttpPost("GetPreJobSafetyListInfo")]
        public async Task<IActionResult> GetPreJobSafetyListInfoPost([FromBody] PreJobSafetyListInfoDTO request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr))
                return BadRequest("CallNbr is required.");

            var infoList = await _JobSafetyrepository.GetPreJobSafetyListInfoAsync(request.CallNbr);

            if (infoList == null || !infoList.Any())
                return NotFound("No records found.");

            return Ok(infoList);
        }
    }
}