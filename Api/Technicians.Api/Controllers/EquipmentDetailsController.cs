using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text.Json;
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

        // Upload Job SPs start from here
        [HttpGet("GetPMVisualNotes")]
        public async Task<ActionResult<IEnumerable<etechNotesDto>>> GetEtechNotes([FromQuery] string callNbr, [FromQuery] string techName)
        {
            var result = await _repository.GetEtechNotesAsync(callNbr, techName);
            if (result == null || !result.Any())
                return NotFound();
            return Ok(result);
        }

        [HttpGet("IsPreJobSafetyDone")]
        public async Task<IActionResult> IsPreJobSafetyDone([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest(new { isCompleted = false, message = "CallNbr is required." });

            var result = await _repository.IsPreJobSafetyDone(callNbr);

            bool isCompleted = result == 1;
            string message = isCompleted ? "Pre-job safety check completed." : "Pre-job safety check not completed.";

            return Ok(new { isCompleted, message });
        }


        [HttpGet("CheckSaveAsDraft")]
        public async Task<IActionResult> CheckSaveAsDraftEquip([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var message = await _repository.CheckSaveAsDraftEquipAsync(callNbr);

            return Ok(message);
        }

        [HttpGet("CheckCapsPartsInfo")]
        public async Task<IActionResult> CheckCapsPartsInfo([FromQuery] string callNbr, [FromQuery] int equipId)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _repository.CheckCapsPartsInfoAsync(callNbr, equipId);

            // Convert integer result (1/0) to boolean
            bool hasInfo = result == 1;

            return Ok(new { hasInfo });
        }

        [HttpGet("CheckReadingsExist")]
        public async Task<IActionResult> CheckReadingsExist(
            [FromQuery] string callNbr,
            [FromQuery] int equipId,
            [FromQuery] string equipType)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(equipType))
                return BadRequest("CallNbr and EquipType are required.");

            var result = await _repository.ReadingsExistAsync(callNbr, equipId, equipType);

            bool exists = result == 1;

            return Ok(new { exists });
        }

        [HttpGet("ValidatePartsReturned")]
        public async Task<IActionResult> ValidatePartsReturned([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _repository.IsPartsReturnedByTechAsync(callNbr);

            bool isReturned = result == 1;
            string message = isReturned ? "Parts have been returned by technician." : "Parts have not been returned by technician.";

            return Ok(new { isReturned, message });
        }

        [HttpGet("CheckDuplicateHours")]
        public async Task<IActionResult> CheckDuplicateHours([FromQuery] string callNbr, [FromQuery] string techName)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(techName))
                return BadRequest("CallNbr and TechName are required.");

            var result = await _repository.CheckDuplicateHoursAsync(callNbr, techName);

            bool hasDuplicates = !string.Equals(result, "None", StringComparison.OrdinalIgnoreCase);
            string message = hasDuplicates
                ? $"Duplicate hours found for technician {techName}."
                : "No duplicate hours found.";

            return Ok(new { hasDuplicates, message });
        }

        [HttpPost("upload-job")]
        public async Task<IActionResult> UploadJob([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("callNbr", out var callNbrProp) ||
                !body.TryGetProperty("techId", out var techIdProp) ||
                !body.TryGetProperty("techName", out var techNameProp))
            {
                return BadRequest("callNbr, techId, and techName are required.");
            }

            var callNbr = callNbrProp.GetString();
            var techId = techIdProp.GetString();
            var techName = techNameProp.GetString();

            // Assuming the logged-in user is techName (or you could extract from token)
            var message = await _repository.UploadJobToGPAsync(callNbr!, techId!, techName!);

            bool isSuccess = !message.StartsWith("Error", StringComparison.OrdinalIgnoreCase);

            return Ok(new { success = isSuccess, message });
        }


        // 8. UploadExpenses SPs begin from here
        [HttpGet("ValidateExpenseUpload")]
        public async Task<IActionResult> ValidateExpenseUpload([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            try
            {
                var result = await _repository.ValidateExpenseUploadAsync(callNbr);
                return Ok(result); // Angular expects just a string
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error validating expense upload: {ex.Message}");
            }
        }



        [HttpPost("upload-expenses")]
        public async Task<IActionResult> UploadExpenses([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("callNbr", out var callNbrProp) ||
                !body.TryGetProperty("techName", out var techNameProp))
            {
                return BadRequest(new { success = false, message = "callNbr and techName are required." });
            }

            string callNbr = callNbrProp.GetString()!;
            string techName = techNameProp.GetString()!;

            try
            {
                var result = await _repository.UploadExpensesAsync(new EtechUploadExpensesDto
                {
                    CallNbr = callNbr,
                    TechName = techName
                });

                return Ok(new
                {
                    success = true,
                    message = "Expenses uploaded successfully.",
                    rowsAffected = result
                });
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Unexpected error: " + ex.Message });
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
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required");

            var result = await _repository.GetUploadedInfoAsync(callNbr, techId);

            return Ok(result); // returns typed list to Angular
        }

        // UPS SPs
        [HttpGet("GetManufacturerNames")]
        public async Task<IActionResult> GetManufacturerNames()
        {
            var result = await _repository.GetManufacturerNamesAsync();
            return Ok(result);
        }

        [HttpGet("GetUPSReadings")]
        public async Task<IActionResult> GetUPSReadings([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string upsId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(upsId))
                return BadRequest("CallNbr, EquipId and UpsId are required.");

            try
            {
                var result = await _repository.GetUPSReadingsAsync(callNbr, equipId, upsId);

                if (result == null)
                    return NotFound("No readings found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("EditEquipInfo")]
        public async Task<IActionResult> EditEquipInfo([FromQuery] string callNbr, [FromQuery] int equipId)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            try
            {
                var result = await _repository.EditEquipInfoAsync(callNbr, equipId);

                if (result == null)
                    return NotFound("No equipment info found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("GetEquipReconciliationInfo")]
        public async Task<IActionResult> GetEquipReconciliationInfo([FromQuery] string callNbr, [FromQuery] int equipId)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _repository.GetEquipReconciliationInfoAsync(callNbr, equipId);

            if (result == null)
                return NotFound("No reconciliation info found.");

            return Ok(result);
        }


        // New endpoint for GetEquipBoardInfo SP
        [HttpGet("GetEquipBoardInfo")]
        public async Task<IActionResult> GetEquipBoardInfo([FromQuery] string equipNo, [FromQuery] int equipId)
        {
            if (string.IsNullOrWhiteSpace(equipNo))
                return BadRequest("Parameter 'equipNo' is required.");

            try
            {

                var result = await _repository.GetEquipBoardInfoAsync(equipNo, equipId);

                if (result == null || !result.Any())
                    return NotFound($"No equip board info found for EquipNo: {equipNo}, EquipId: {equipId}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching equip board info for EquipNo = {EquipNo}, EquipId = {EquipId}", equipNo, equipId);
                return StatusCode(500, "An error occurred while fetching equip board info.");
            }
        }

        // New: Insert or update equipment (POST)
        [HttpPost("spEquipmentInsertUpdate")]
        public async Task<IActionResult> InsertOrUpdateEquipment([FromBody] EquipmentInsertUpdateDto request)
        {
            if (request == null) return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.EquipNo))
                return BadRequest("CallNbr and EquipNo are required.");

            try
            {
                var rows = await _repository.InsertOrUpdateEquipmentAsync(request);

                if (rows > 0)
                    return Ok(new { success = true, rowsAffected = rows });

                return StatusCode(500, new { success = false, message = "No rows affected." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while inserting/updating equipment for CallNbr = {CallNbr}, EquipId = {EquipId}", request.CallNbr, request.EquipId);
                return StatusCode(500, "An error occurred while inserting/updating equipment.");
            }
        }


        // DELETE: api/EquipmentDetails/delete
        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteEquipment([FromBody] DeleteEquipmentDto request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.EquipNo))
                return BadRequest("CallNbr and EquipNo are required.");

            var rows = await _repository.DeleteEquipmentAsync(request.CallNbr, request.EquipNo, request.EquipId);

            if (rows > 0)
                return Ok(new { success = true, message = "Equipment deleted.", rowsAffected = rows });

            return NotFound(new { success = false, message = "No equipment deleted." });
        }


    }
}