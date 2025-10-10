using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechReturnedPartsController : ControllerBase
    {
        private readonly TechReturnedPartsRepository _repository;
        public TechReturnedPartsController(TechReturnedPartsRepository repository)
        {
            _repository = repository;
        }
        [HttpPost("SaveOrUpdateTechReturnedParts")]
        public async Task<IActionResult> SaveOrUpdate([FromBody] TechReturnedPartsDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Service_Call_ID))
                return BadRequest("Invalid data.");

            await _repository.SaveOrUpdateTechReturnedPartsAsync(dto);
            return Ok(new { message = "Success" });
        }
    }
}
