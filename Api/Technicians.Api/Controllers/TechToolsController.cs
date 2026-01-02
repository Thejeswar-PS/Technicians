using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Data;
using System.Management.Automation;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechToolsController : ControllerBase
    {
        private readonly TechToolsRepository _toolsRepository;
        public TechToolsController(TechToolsRepository toolsRepository)
        {
            _toolsRepository = toolsRepository;
        }

        [HttpGet("GetTechToolskit/{techId}")]
        public async Task<IActionResult> GetTechToolsMiscKit(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("techId is required.");

            var result = await _toolsRepository.GetTechToolsMiscKitAsync(techId);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpGet("GetTechToolsData/{techId}")]
        public async Task<IActionResult> Get(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("techId is required.");

            var result = await _toolsRepository.GetByTechIdAsync(techId);

            if (result == null)
                return Ok(new TechToolsPpeMetersDto());

            return Ok(result);
        }

        [HttpPost("SaveUpdateTechTools")]
        public async Task<IActionResult> SaveUpdateTechToolsPPEMETERS([FromBody] TechToolsPpeMetersDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.TechID))
                return BadRequest("TechID is required.");

            await _toolsRepository.SaveUpdateTechToolsPPEMETERSAsync(dto);

            return Ok(new { message = "Update successful" });
        }

        [HttpGet("GetTechToolsMiscCount/{techId}")]
        public async Task<IActionResult> GetTechToolsMiscCount(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("TechId is required");

            var count = await _toolsRepository.GetTechToolsMiscCountAsync(techId);
            return Ok(new { techId, count });
        }

        [HttpPost("DeleteReplaceToolsMisc")]
        public async Task<IActionResult> DeleteReplaceToolsMisc([FromBody] ReplaceTechToolsMiscRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TechId))
                return BadRequest("TechId is required");

            if (request.ToolKitItems == null || request.ToolKitItems.Count == 0)
                return BadRequest("At least one item is required");

            await _toolsRepository.DeleteReplaceToolsMiscAsync(
                request.TechId,
                request.ToolKitItems,
                request.ModifiedBy);

            return Ok(new { message = "Tech tools misc kit updated successfully" });
        }



    }
}

