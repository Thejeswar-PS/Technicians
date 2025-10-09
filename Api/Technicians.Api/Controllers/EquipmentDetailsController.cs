using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentDetailsController : ControllerBase
    {
        private readonly EquipmentDetailsRepository _repository;
        private readonly ILogger<EquipmentDetailsController> _logger;

        public EquipmentDetailsController(
            EquipmentDetailsRepository repository,
            ILogger<EquipmentDetailsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // 1. GetEquipmentDetails (GET)
        [HttpGet("GetEquipmentDetails")]
        public IActionResult GetEquipmentDetails([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("Parameter 'callNbr' is required.");

            try
            {
                _logger.LogInformation("API called: GetEquipmentDetails with CallNbr = {CallNbr}", callNbr);

                var result = _repository.GetEquipmentDetails(callNbr);

                if (result == null || !result.Any())
                    return NotFound($"No equipment details found for CallNbr: {callNbr}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching equipment details for CallNbr = {CallNbr}", callNbr);
                return StatusCode(500, "An error occurred while fetching equipment details.");
            }
        }

        // 2. CheckDuplicateHours (POST)
        [HttpPost("check-duplicate-hours")]
        public async Task<IActionResult> CheckDuplicateHours([FromBody] CheckDuplicateHoursDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.TechName))
                return BadRequest("CallNbr and TechName are required.");

            var result = await _repository.CheckDuplicateHoursAsync(request.CallNbr, request.TechName);
            return Ok(new { Message = result });
        }

        // 3. CheckExpUploadElgibility (GET)
        [HttpGet("check-exp-upload-elgibility/{callNbr}")]
        public async Task<IActionResult> CheckExpUploadElgibility(string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _repository.CheckExpUploadElgibilityAsync(callNbr);
            return Ok(new { Message = result });
        }

        // 4. CheckSaveAsDraftEquip (POST)
        [HttpPost("check-draft")]
        public async Task<ActionResult<CheckSaveAsDraftEquipResponse>> CheckSaveAsDraftEquip([FromBody] CheckSaveAsDraftEquipDto request)
        {
            var message = await _repository.CheckSaveAsDraftEquipAsync(request.CallNbr);
            return Ok(new CheckSaveAsDraftEquipResponse { Message = message });
        }
        public class CheckSaveAsDraftEquipResponse
        {
            public string Message { get; set; }
        }

        // 5. InsertDeficiencyNote (POST)
        [HttpPost("insert-deficiency-note")]
        public async Task<IActionResult> InsertDeficiencyNote([FromBody] DeficiencyNoteRequestDto request)
        {
            if (request == null) return BadRequest("Request body is null");

            await _repository.InsertOrUpdateDeficiencyNoteAsync(request);
            return Ok("Deficiency note processed successfully.");
        }

        // 6. GetEmployeeStatus (GET)
        [HttpGet("status/{adUserId}")]
        public async Task<ActionResult<EmployeeStatusForJobListDto>> GetEmployeeStatus(string adUserId)
        {
            var result = await _repository.GetEmployeeStatusForJobListAsync(adUserId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        // 7. GetEtechNotes (GET)
        [HttpGet("etech-notes")]
        public async Task<ActionResult<IEnumerable<etechNotesDto>>> GetEtechNotes([FromQuery] string callId, [FromQuery] string techName)
        {
            var result = await _repository.GetEtechNotesAsync(callId, techName);
            if (result == null || !result.Any())
                return NotFound();
            return Ok(result);
        }

        // 8. UploadExpenses (POST)
        [HttpPost("upload-expenses")]
        public async Task<IActionResult> UploadExpenses([FromBody] EtechUploadExpensesDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNumber) || string.IsNullOrWhiteSpace(request.User))
                return BadRequest("CallNumber and User are required.");

            try
            {
                var result = await _repository.UploadExpensesAsync(request);
                return Ok(new { success = true, message = "Expenses uploaded successfully.", rowsAffected = result });
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // 9. GetReconciliationEmailNotes (GET)
        [HttpGet("email-notes/{callNbr}")]
        public async Task<IActionResult> GetReconciliationEmailNotes(string callNbr)
        {
            var result = await _repository.GetReconciliationEmailNotesAsync(callNbr);
            return Ok(result);
        }

        // 10. GetUploadedInfo (GET)
        [HttpGet("uploaded-info")]
        public async Task<IActionResult> GetUploadedInfo([FromQuery] string callNbr, [FromQuery] string techId)
        {
            if (string.IsNullOrEmpty(callNbr))
                return BadRequest("CallNbr is required");

            var result = await _repository.GetUploadedInfoAsync(callNbr, techId);

            return Ok(result);
        }

        // 11. UploadJobToGP (POST)
        [HttpPost("upload-job-to-gp")]
        public async Task<IActionResult> UploadJobToGP([FromBody] UploadJobToGPDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr) ||
                string.IsNullOrWhiteSpace(request.StrUser) || string.IsNullOrWhiteSpace(request.LoggedInUser))
                return BadRequest("All fields are required.");

            var result = await _repository.UploadJobToGPAsync(request.CallNbr, request.StrUser, request.LoggedInUser);

            if (result == 0)
                return Ok(new { Message = "Job uploaded successfully." });
            else
                return StatusCode(500, new { Message = $"Error uploading job. Error Code: {result}" });
        }
    }
}