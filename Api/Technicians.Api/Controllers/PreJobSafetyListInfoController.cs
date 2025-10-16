using Microsoft.AspNetCore.Mvc;
using System.Management.Automation;
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

        [HttpGet("GetPreJobSafetyInfo")]
        public async Task<IActionResult> GetPreJobSafetyInfo([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var info = await _JobSafetyrepository.GetPreJobSafetyInfoAsync(callNbr);

            

            return Ok(info);
        }


        [HttpGet("IsPreJobSafetyDone")]
        public async Task<IActionResult> IsPreJobSafetyDone([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _JobSafetyrepository.IsPreJobSafetyDone(callNbr);

            // Convert int result (1/0) to bool
            bool isDone = result == 1;

            return Ok(isDone);
        }

    }
}