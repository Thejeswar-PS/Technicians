using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsShipController : ControllerBase
    {
        private readonly PartsShipRepository _repository;

        public PartsShipController(PartsShipRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("SaveOrUpdate")]
        public async Task<IActionResult> SaveUpdate([FromBody] SaveUpdatePartsShipDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _repository.SaveUpdatePartsShipAsync(model);

            if (result > 0)
                return Ok(new { Message = "Saved or updated successfully" });
            else
                return StatusCode(500, "Error saving or updating part shipment");
        }
    }
}

