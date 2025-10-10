using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsReqDataController : ControllerBase
    {
        private readonly PartsReqDataRepository _repository;

        public PartsReqDataController(PartsReqDataRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("GetPartsReqData")]
        public async Task<IActionResult> Get([FromQuery] string callNbr, [FromQuery] int scidInc = 0)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            var result = await _repository.GetPartsReqData(callNbr, scidInc);
            return Ok(result);
        }
    }
}

