using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Technicians.Api.Models;
using Technicians.Api.Repository;
using Microsoft.AspNetCore.Http;

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

        // 2. InsertDeficiencyNote (POST)
        [HttpPost("insert-deficiency-note")]
        public async Task<IActionResult> InsertDeficiencyNote([FromBody] DeficiencyNoteRequestDto request)
        {
            if (request == null) return BadRequest("Request body is null");

            await _repository.InsertOrUpdateDeficiencyNoteAsync(request);
            return Ok("Deficiency note processed successfully.");
        }

        // 3. GetEmployeeStatus (GET)
        [HttpGet("status/{adUserId}")]
        public async Task<ActionResult<EmployeeStatusForJobListDto>> GetEmployeeStatus(string adUserId)
        {
            var result = await _repository.GetEmployeeStatusForJobListAsync(adUserId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        // 4. Upload Job SPs start from here
        [HttpGet("GetPMVisualNotes")]
        public async Task<ActionResult<IEnumerable<etechNotesDto>>> GetEtechNotes([FromQuery] string callNbr, [FromQuery] string techName)
        {
            var result = await _repository.GetEtechNotesAsync(callNbr, techName);
            if (result == null || !result.Any())
                return NotFound();
            return Ok(result);
        }

        // 5. IsPreJobSafetyDone (GET)
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

        // 6. CheckSaveAsDraftEquip (GET)
        [HttpGet("CheckSaveAsDraft")]
        public async Task<IActionResult> CheckSaveAsDraftEquip([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var message = await _repository.CheckSaveAsDraftEquipAsync(callNbr);

            return Ok(message);
        }

        // 7. CheckCapsPartsInfo (GET)
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

        // 7a. CheckReadingsExist (GET)
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

        // 7b. ValidatePartsReturned (GET)
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

        // 7c. CheckDuplicateHours (GET)
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

        // 7d. UploadJob (POST)
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

        // 8a. UploadExpenses (POST)
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

        // 11. UPS SPs
        [HttpGet("GetManufacturerNames")]
        public async Task<IActionResult> GetManufacturerNames()
        {
            var result = await _repository.GetManufacturerNamesAsync();
            return Ok(result);
        }

        // 11a. GetUPSModels
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

        // 11b. EditEquipInfo
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

        // 12. GetEquipReconciliationInfo SP
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


        // 13. GetEquipBoardInfo SP (Edit equipment page)
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
                return StatusCode(500, "An error occurred while fetching equip board info.");
            }
        }

        // 13a. spEquipmentInsertUpdate (POST)
        [HttpPost("spEquipmentInsertUpdate")]
        public async Task<IActionResult> InsertOrUpdateEquipment([FromBody] EquipmentInsertUpdateDto request)
        {
            if (request == null) return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.EquipNo))
                return BadRequest("CallNbr and EquipNo are required.");

            try
            {
                // Log the incoming request for debugging
                _logger.LogInformation($"Received equipment update request: CallNbr={request.CallNbr}, EquipId={request.EquipId}, EquipNo={request.EquipNo}");

                var rows = await _repository.InsertOrUpdateEquipmentAsync(request);

                if (rows > 0)
                {
                    _logger.LogInformation($"Successfully updated/inserted equipment. Rows affected: {rows}");
                    return Ok(new { success = true, rowsAffected = rows });
                }

                _logger.LogWarning($"No rows affected for CallNbr={request.CallNbr}, EquipId={request.EquipId}");
                return StatusCode(500, new { success = false, message = "No rows affected." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating equipment: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        //13b. DeleteEquipment (DELETE)
        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteEquipment([FromBody] DeleteEquipmentDto request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.EquipNo))
                return BadRequest("CallNbr and EquipNo are required.");

            try
            {
                var rows = await _repository.DeleteEquipmentAsync(request.CallNbr, request.EquipNo, request.EquipId);
                if (rows > 0)
                    return Ok(new { success = true, message = "Equipment deleted.", rowsAffected = rows });
                return NotFound(new { success = false, message = "No equipment deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while deleting equipment.");
            }


        }
        //14.InsertGetEquipmentImages (POST) Upload equipment image endpoint - accept DTO bound from multipart/form-data
        [HttpPost("InsertGetEquipmentImages")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadEquipmentImage([FromForm] EquipmentImageUploadDto dto)
        {
            try
            {
                // Basic validation
                if (dto == null)
                    return BadRequest(new { success = false, message = "Request body is required." });

                if (string.IsNullOrWhiteSpace(dto.CallNbr))
                    return BadRequest(new { success = false, message = "CallNbr is required." });

                if (dto.EquipID <= 0)
                    return BadRequest(new { success = false, message = "Valid EquipID is required." });

                if (string.IsNullOrWhiteSpace(dto.EquipNo))
                    return BadRequest(new { success = false, message = "EquipNo is required." });

                if (dto.ImgFile == null || dto.ImgFile.Length == 0)
                    return BadRequest(new { success = false, message = "Image file is required." });

                // Call repository directly with bound DTO
                var rowsAffected = await _repository.InsertGetEquipmentImagesAsync(dto);

                if (rowsAffected > 0)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Image uploaded successfully.",
                        rowsAffected = rowsAffected
                    });
                }

                return StatusCode(500, new
                {
                    success = false,
                    message = "No rows affected - upload may have failed."
                });
            }
            catch (ArgumentNullException)
            {
                return BadRequest(new { success = false, message = "Invalid input data." });
            }
            catch (SqlException sqlEx)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Database error: {sqlEx.Message}"
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An unexpected error occurred while uploading the image."
                });
            }
        }

        //14a. DeleteEquipmentImage (DELETE)
        // New: Delete equipment image by id (route param)
        [HttpDelete("DeleteEquipmentImage")]
        public async Task<IActionResult> DeleteEquipmentImage([FromQuery] int imgId)
        {
            try
            {
                if (imgId <= 0)
                    return BadRequest(new { success = false, message = "Valid Image ID is required." });

                var rowsAffected = await _repository.DeleteEquipmentImageAsync(imgId);

                if (rowsAffected > 0)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Image deleted successfully.",
                        rowsAffected = rowsAffected
                    });
                }

                return NotFound(new { success = false, message = "No image found to delete." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the image." });
            }
        }

        // 14b. Single API: GET /api/EquipmentDetails/GetEquipmentImages 
        // Provide either an equipId query parameter to get list, or imgId route parameter to get single image.
        [HttpGet("GetEquipmentImages")]
        public async Task<IActionResult> GetEquipmentImages([FromQuery] int equipId)
        {
            try
            {
                // Making sure this repository method actually queries the right table
                var images = await _repository.GetEquipmentImagesAsync(equipId, 0);

                if (images == null || !images.Any())
                {
                    // Returns empty array in data property (not 404)
                    return Ok(new { data = new List<object>() });
                }

                // Converts to frontend format with base64 encoding
                var result = images.Select(img => new
                {
                    img_ID = img.Img_ID,
                    equipID = img.EquipID,
                    equipNo = img.EquipNo,
                    callNbr = img.CallNbr,
                    techID = img.TechID,
                    techName = img.TechName,
                    img_Title = img.Img_Title,
                    img_Type = img.Img_Type,
                    created_On = img.CreatedOn,
                    // IMPORTANT: Convert byte array to base64 string
                    img_stream = img.Img_stream != null ? Convert.ToBase64String(img.Img_stream) : null
                }).ToList();

                _logger.LogInformation("Returning {Count} formatted images", result.Count);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetEquipmentImages for EquipID={EquipID}", equipId);
                return StatusCode(500, new { error = "Failed to retrieve images" });
            }
        }

    }
}