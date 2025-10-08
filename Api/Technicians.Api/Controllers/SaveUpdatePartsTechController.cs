using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SaveUpdatePartsTechController : ControllerBase
    {
        
       private readonly SaveUpdatePartsTechRepository _repository;

       public SaveUpdatePartsTechController(SaveUpdatePartsTechRepository repository)
       {
           _repository = repository;
       }

       [HttpPost("update-techParts")]
        public async Task<IActionResult> SaveOrUpdate([FromBody] SaveUpdatePartsTechDto dto)
        {
            if (dto == null)
               return BadRequest("Request body is null.");

            await _repository.SaveOrUpdatePartsTechAsync(dto);
            return Ok(new { message = "Saved/Updated successfully." });
        }
        
    }
}
