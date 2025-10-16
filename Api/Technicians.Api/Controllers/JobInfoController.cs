using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobInfoController : ControllerBase
    {
        private readonly JobInfoRepository _repository;
        private readonly ILogger<JobInfoController> _logger;

        public JobInfoController(
            JobInfoRepository repository,
            ILogger<JobInfoController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet("GetJobInformation")]
        public async Task<IActionResult> GetJobInformation([FromQuery] string callNbr, [FromQuery] string techName)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(techName))
                return BadRequest("CallNbr and TechName are required.");

            var jobs = await _repository.GetJobInformationAsync(callNbr, techName);

            if (!jobs.Any())
                return NotFound("No jobs found for the given parameters.");

            return Ok(jobs);
        }

        [HttpGet("GetDeficiencyNotes")]
        public async Task<IActionResult> GetDeficiencyNotes([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var notes = await _repository.GetDeficiencyNotesAsync(callNbr);

            return Ok(notes ?? string.Empty);
        }

        [HttpGet("GetDistinctTechs")]
        public async Task<IActionResult> GetDistinctTechs([FromQuery] string callNbr, [FromQuery] string techName)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(techName))
                return BadRequest("CallNbr and TechName are required.");

            var techs = await _repository.GetDistinctTechsAsync(callNbr, techName);
            return Ok(techs);
        }

        [HttpPost("SaveUpdateJobReconciliationInfo")]
        public async Task<IActionResult> SaveUpdateJobReconciliationInfo([FromBody] EquipReconciliationInfo info)
        {
            if (string.IsNullOrWhiteSpace(info?.CallNbr) || info.EquipID <= 0)
                return BadRequest(new { success = false, message = "CallNbr and valid EquipID are required." });

            // Optionally, get current user ID from claims or auth context
            var modifiedBy = info.ModifiedBy ?? "System";

            var result = await _repository.SaveUpdateJobReconciliationInfoAsync(info, modifiedBy);

            if (result.Success)
                return Ok(new { success = true, message = result.Message });

            return StatusCode(500, new { success = false, message = result.Message });
        }

        [HttpGet("GetAutoTechNotesByEquipType")]
        public async Task<IActionResult> GetAutoTechNotesByEquipType([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string equipType)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(equipType))
                return BadRequest("CallNbr and EquipType are required.");

            var notes = await _repository.GetAutoTechNotesByEquipTypeAsync(callNbr, equipId, equipType);
            return Ok(notes);
        }

        [HttpPost("UpdateJobInformation")]
        public async Task<IActionResult> UpdateJobInformation([FromBody] UpdateJobRequest jobInfo)
        {
            if (jobInfo == null || string.IsNullOrWhiteSpace(jobInfo.CallNbr) || string.IsNullOrWhiteSpace(jobInfo.TechName))
                return BadRequest(new { success = false, message = "CallNbr and TechName are required." });

            var result = await _repository.UpdateJobInformationAsync(jobInfo);
            return Ok(new { success = result.Success, message = result.Message });
        }

        [HttpPost("InsertDeficiencyNotes")]
        public async Task<IActionResult> InsertDeficiencyNotes([FromBody] InsertDeficiencyNotesRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.CallNbr) ||
                string.IsNullOrWhiteSpace(request.TechName) ||
                string.IsNullOrWhiteSpace(request.NoteType))
            {
                return BadRequest(new { success = false, message = "Missing required fields." });
            }

            var result = await _repository.InsertDeficiencyNotesAsync(request);
            return Ok(new { success = result.Success, message = result.Message });
        }

    }
}
