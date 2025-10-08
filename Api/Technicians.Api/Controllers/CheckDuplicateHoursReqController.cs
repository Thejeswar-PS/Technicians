using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckDuplicateHoursController : ControllerBase
    {
        private readonly CheckDuplicateHoursRepository _repository;

        public CheckDuplicateHoursController(CheckDuplicateHoursRepository repository)
        {
            _repository = repository;
        }

        [HttpPost]
        public async Task<IActionResult> CheckDuplicateHours([FromBody] CheckDuplicateHoursDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.TechName))
                return BadRequest("CallNbr and TechName are required.");

            var result = await _repository.CheckDuplicateHoursAsync(request.CallNbr, request.TechName);
            return Ok(new { Message = result });
        }
    }
}