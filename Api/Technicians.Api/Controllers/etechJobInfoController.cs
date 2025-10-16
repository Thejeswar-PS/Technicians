using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.Drawing.Imaging;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class etechJobInfoController : ControllerBase
    {
        private readonly etechJobInfoRepository _repository;
        public etechJobInfoController(etechJobInfoRepository repository)
        {
            _repository = repository;
        }
        [HttpGet("GetEtechJobInfo")]
        public async Task<IActionResult> GetJobInfo([FromQuery] string callId, [FromQuery] string techName)
        {
            if (string.IsNullOrWhiteSpace(callId) || string.IsNullOrWhiteSpace(techName))
                return BadRequest("Both 'callId' and 'techName' are required.");

            var result = await _repository.GetEtechJobInfoAsync(callId, techName);

            if (result == null)
                return NotFound(new { message = "Job not found." });

            return Ok(result);
        }

        //2. GetAutoTechNotesByEquipType
        [HttpGet("GetAutoTechNotesByEquipType")]
        public async Task<IActionResult> GetDeficiencies([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string equipType)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(equipType) || equipId <= 0)
                return BadRequest("Invalid parameters.");

            var deficiencies = await _repository.GetAutoTechNotesAsync(callNbr, equipId, equipType);

            if (deficiencies == null || !deficiencies.Any())
                return NotFound(new { message = "No deficiencies found." });

            return Ok(deficiencies);
        }

        //3. GetDeficiencyNote

        [HttpGet("api/deficiency-notes/{callNbr}")]
        public async Task<IActionResult> GetDeficiencyNote(string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var note = await _repository.GetDeficiencyNoteAsync(callNbr);

            if (string.IsNullOrWhiteSpace(note?.Notes))
                return NotFound(new { message = "No deficiency notes found." });

            return Ok(note);
        }

        //4. UpdateJobInfo

        [HttpPut("api/job-info")]
        public async Task<IActionResult> UpdateJobInfo([FromBody] JobInformationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CallNbr) || string.IsNullOrWhiteSpace(dto.TechName))
                return BadRequest("CallNbr and TechName are required.");

            var success = await _repository.UpdateJobInfoAsync(dto);

            if (!success)
                return NotFound(new { message = "Job info not found or no update performed." });

            return Ok(new { success = true, message = "Job info updated successfully." });
        }
    }
    
    
}
