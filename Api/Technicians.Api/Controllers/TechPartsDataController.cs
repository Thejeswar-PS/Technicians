using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechPartsDataController : ControllerBase
    {
        private readonly TechPartsDataRepository _repository;
        public TechPartsDataController(TechPartsDataRepository repository)
        {
            _repository = repository;
        }
        [HttpGet("GetTechPartsData")]
        public async Task<IActionResult> Get([FromQuery] string callNbr, [FromQuery] int scidInc = 0)
        {
            if (string.IsNullOrEmpty(callNbr))
                return BadRequest("callNbr is required");

            var result = await _repository.GetTechPartsDataAsync(callNbr, scidInc);
            return Ok(result);
        }
    }
}
