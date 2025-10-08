using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeficiencyNotesController : ControllerBase
    {
        private readonly DeficiencyNotesRepository _repository;

        public DeficiencyNotesController(DeficiencyNotesRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("insert")]
        public async Task<IActionResult> InsertDeficiencyNote([FromBody] DeficiencyNoteRequestDto request)
        {
            if (request == null) return BadRequest("Request body is null");

            await _repository.InsertOrUpdateDeficiencyNoteAsync(request);
            return Ok("Deficiency note processed successfully.");
        }
    }
}

