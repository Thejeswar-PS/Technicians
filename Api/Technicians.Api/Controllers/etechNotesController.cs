using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class etechNotesController : ControllerBase
    {
        private readonly etechNotesRepository _repository;

        public etechNotesController(etechNotesRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<etechNotesDto>>> Get([FromQuery] string callId, [FromQuery] string techName)
        {
            var result = await _repository.GetEtechNotesAsync(callId, techName);
            if (result == null || !result.Any())
                return NotFound();
            return Ok(result);
        }


    }

}
