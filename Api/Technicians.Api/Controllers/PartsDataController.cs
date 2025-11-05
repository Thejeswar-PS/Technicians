using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Management.Automation;
using System.Threading.Tasks;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsDataController : ControllerBase
    {
        private readonly PartsDataRepository _repository;

        public PartsDataController(PartsDataRepository repository)
        {
            _repository = repository;
        }

        //1. Get PartsInfo
        [HttpGet("GetJobPartsInfo")]
        public async Task<IActionResult> GetJobPartsInfo([FromQuery] string callNbr)
        {
            var result = await _repository.GetJobPartsInfoAsync(callNbr);
            if (result == null || result.Count == 0)
                return NotFound();

            return Ok(result);
        }

        //2. Get Parts Req Data by Call Number and SCID_Inc
        [HttpGet("GetPartsRequests")]
        public async Task<IActionResult> GetPartsRequests(
            [FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            try
            {
                var result = await _repository.GetPartsRequestsAsync(callNbr, 0);

                if (result == null || !result.Any())
                    return NotFound($"No parts requests found for CallNbr: {callNbr}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving parts requests: {ex.Message}");
            }
        }

        //3. Get shipping parts data
        [HttpGet("GetShippingParts")]
        public async Task<IActionResult> GetShippingParts([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            try
            {
                var result = await _repository.GetShippingPartsAsync(callNbr, 0);
                if (result == null || !result.Any())
                    return NotFound($"No shipping parts found for CallNbr: {callNbr}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error fetching shipping parts: {ex.Message}" });
            }
        }


        //4.Get Tech Parts  Data by Call Number and SCID_Inc
        [HttpGet("GetTechParts")]
        public async Task<IActionResult> GetTechPartsData([FromQuery] string callNbr)
        {
            if (string.IsNullOrEmpty(callNbr))
                return BadRequest("callNbr is required");

            var result = await _repository.GetTechPartsDataAsync(callNbr, 0);
            return Ok(result);
        }


        //5. Get Parts Equip Info by Call Number
        [HttpGet("GetPartsEquipInfo")]
        public async Task<IActionResult> Get([FromQuery] string callNbr)
        {
            var result = await _repository.GetPartsEquipInfoAsync(callNbr);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        //6. Get Tech Return Parts by Call Number
        [HttpGet("GetTechReturnInfo")]
        public async Task<ActionResult<TechReturnPartsDto>> GetTechReturnParts([FromQuery] string callNbr)
        {
            var result = await _repository.GetTechReturnPartsAsync(callNbr);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        //7. Save or update Shipping Info
        [HttpPost("UpdateJobPartsInfo")]
        public async Task<IActionResult> UpdateJobPartsInfo([FromBody] ShippingInfoDto request, [FromQuery] string empId)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            try
            {
                var rows = await _repository.UpdateJobPartsInfoAsync(request, empId);

                return Ok(new { message = "Job parts info updated successfully.", rowsAffected = rows });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating job parts info.", error = ex.Message });
            }
        }

        //8. Save or Update Parts Equip Info
        [HttpPost("UpdatePartsEquipInfo")]
        public async Task<IActionResult> UpdatePartsEquipInfo([FromBody] SavePartsEquipInfoDto request, [FromQuery] string empId)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr))
                return BadRequest(new { message = "CallNbr is required." });

            try
            {
                await _repository.SaveOrUpdatePartsEquipInfoAsync(request, empId);
                return Ok(new { message = "Parts equipment info updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating parts equipment info.", error = ex.Message });
            }
        }

        //9. Mark Parts as Received
        [HttpPost("UpdateTechPartsReceived")]
        public async Task<IActionResult> MarkPartsAsReceived([FromBody] TechPartsReceivedDto request, [FromQuery] string empId)
        {
            if (string.IsNullOrEmpty(request.CallNbr))
                return BadRequest("Invalid request payload.");

            bool success = await _repository.UpdateTechPartsReceivedAsync(request.CallNbr, request.scidIncs, empId);
            return Ok(success);
        }

        //10.IsUPSTasked
        [HttpGet("IsUPSTaskedForJob")]
        public async Task<IActionResult> IsUPSTaskedForJob([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("Call number cannot be empty.");

            try
            {
                int isTasked = await _repository.IsUPSTaskedForJobAsync(callNbr);
                return Ok(isTasked);
            }
            catch (Exception ex)
            {
                // Log the exception if you have logging
                return StatusCode(500, "An error occurred while checking UPS task status.");
            }
        }

        //11. Check Inventory Item and return it's description
        [HttpGet("CheckInventoryItem")]
        public async Task<IActionResult> CheckInventoryItem([FromQuery] string itemNbr)
        {
            if (string.IsNullOrWhiteSpace(itemNbr))
                return BadRequest("Item number cannot be empty.");

            try
            {
                var result = await _repository.CheckInventoryItemAsync(itemNbr);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log ex if needed
                return StatusCode(500, new { message = "Error while checking inventory item.", detail = ex.Message });
            }
        }

        //12. Parts Req Exists or not
        [HttpGet("CheckPartRequestExists")]
        public async Task<IActionResult> CheckPartRequestExists([FromQuery] string callNbr, [FromQuery] string partNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(partNbr))
                return BadRequest("callNbr and partNbr are required.");

            try
            {
                var result = await _repository.CheckPartRequestExistsAsync(callNbr, partNbr);
                return Ok(new { exists = result });
            }
            catch (Exception ex)
            {
                // log exception if needed
                return StatusCode(500, new { message = "Error checking part request existence.", detail = ex.Message });
            }
        }

        //13. Check if Equip Info in Parts Req
        [HttpGet("IsEquipInfoInPartReq")]
        public async Task<IActionResult> IsEquipInfoInPartReq([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            try
            {
                var result = await _repository.GetEquipInfoInPartReqAsync(callNbr);

                // Return as a plain string (to match Angular expectation)
                return Ok(result ?? string.Empty);
            }
            catch (Exception ex)
            {
                // You could log this if needed
                return StatusCode(500, new { message = "Error fetching equipment info in part request.", detail = ex.Message });
            }
        }

        //14. Check if all parts rae received
        [HttpGet("IsAllPartsReceivedByWH")]
        public async Task<IActionResult> IsAllPartsReceivedByWH([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            try
            {
                int result = await _repository.IsAllPartsReceivedByWHAsync(callNbr);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking if all parts are received by WH.", detail = ex.Message });
            }
        }

        //15. Save/Update Part
        [HttpPost("SavePartsRequest")]
        public async Task<IActionResult> SavePartsRequest([FromBody] PartsRequestDto request, [FromQuery] String empId)
        {
            if (request == null)
                return BadRequest(new { success = false, message = "Request body is required." });

            try
            {
                await _repository.SaveOrUpdatePartsRequestAsync(request, empId);
                return Ok(new { success = true, message = "Parts request saved or updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error saving parts request: {ex.Message}" });
            }
        }

        //16. Save/Update Shipping
        [HttpPost("SaveShippingPart")]
        public IActionResult SaveShippingPart([FromBody] ShippingPartDto shippingPart, [FromQuery] string empId)
        {
            if (shippingPart == null)
                return BadRequest(new { success = false, message = "Invalid data." });

            bool result = _repository.SaveShippingPart(shippingPart, empId, out string errorMsg);

            if (!result)
                return StatusCode(500, new { success = false, message = errorMsg });

            return Ok(new { success = true, message = "Shipping part saved successfully." });
        }

        //17. Save/Update Tech Part
        [HttpPost("SaveTechPart")]
        public IActionResult SaveTechPart([FromBody] TechPartsDto techPart, [FromQuery] string empId, [FromQuery] string source)
        {
            if (techPart == null)
                return BadRequest(new { success = false, message = "Invalid data." });

            bool result = _repository.SaveTechPart(techPart, empId, source, out string errorMsg);

            if (!result)
                return StatusCode(500, new { success = false, message = errorMsg });

            return Ok(new { success = true, message = "Tech part saved successfully." });
        }

        //18. Delete Part
        [HttpPost("DeletePart")]
        public IActionResult DeletePart([FromBody] DeletePartRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.CallNbr))
                return BadRequest(new { success = false, message = "Invalid request data" });

            var errMsg = _repository.DeletePart(request);

            if (!string.IsNullOrEmpty(errMsg))
                return StatusCode(500, new { success = false, message = errMsg });

            return Ok(new { success = true, message = "Part deleted successfully" });
        }

        //19. Update Tech Return Info
        [HttpPost("UpdateTechReturnInfo")]
        public IActionResult UpdateTechReturnInfo([FromBody] TechReturnUpdateDto dto, [FromQuery] string empId)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CallNbr))
                return BadRequest(new { success = false, message = "Invalid input data." });

            try
            {
                var success = _repository.SaveUpdateReturnedPartsByTech(dto, empId, out string errorMsg);

                if (success && string.IsNullOrEmpty(errorMsg))
                    return Ok(new { success = true, message = "Update Successful." });

                return BadRequest(new { success = false, message = errorMsg });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        //20. Re-Upload job to GP
        [HttpPost("ReUploadJobToGP")]
        public IActionResult ReUploadJobToGP([FromBody] ReUploadJobRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNbr) || string.IsNullOrWhiteSpace(request.TechID))
            {
                return BadRequest(new { success = false, message = "CallNbr and TechID are required." });
            }

            try
            {
                bool success = _repository.ReUploadJobToGP(request.CallNbr, request.TechID, out string errorMsg);

                if (success && string.IsNullOrEmpty(errorMsg))
                    return Ok(new { success = true, message = "Job uploaded successfully." });
                else
                    return BadRequest(new { success = false, message = errorMsg });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error uploading job: {ex.Message}" });
            }
        }








        //6. Save or Update Tech Returned Parts

        [HttpPost("SaveOrUpdateTechReturnedParts")]
        public async Task<IActionResult> SaveOrUpdate([FromBody] TechReturnedPartsDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Service_Call_ID))
                return BadRequest("Invalid data.");

            await _repository.SaveOrUpdateTechReturnedPartsAsync(dto);
            return Ok(new { message = "Success" });
        }



        


        //9. Upload Job to GP_WOW

        [HttpPost("UploadJobToGP_WOW")]
        public async Task<IActionResult> UploadJobToGP([FromBody] UploadJobToGP_WowDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CallNumber) || string.IsNullOrWhiteSpace(request.UserName))
                return BadRequest("CallNumber and UserName are required.");

            try
            {
                int errorCode = await _repository.UploadJobToGPAsync(request);

                if (errorCode == 0)
                    return Ok(new { message = "Job uploaded successfully." });
                else
                    return StatusCode(500, new { message = "Job upload failed.", errorCode });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", detail = ex.Message });
            }
        }




        private readonly string baseDirectory = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";
        private readonly string[] allowedExtensions = new[] { ".jpg", ".gif", ".doc", ".bmp", ".xls", ".png", ".jpeg", ".pdf" };

        /// <summary>
        /// Get all file attachments for a given CallNbr
        /// Legacy equivalent: Page_PreRender()
        /// </summary>
        [HttpGet("GetFileAttachments")]
        public IActionResult GetFileAttachments([FromQuery] string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var dirPath = Path.Combine(baseDirectory, callNbr);

            if (!Directory.Exists(dirPath))
                return Ok(new List<object>()); // return empty list

            try
            {
                var files = Directory.GetFiles(dirPath)
                                     .Select(f => new
                                     {
                                         FileName = Path.GetFileName(f),
                                         FileSizeKB = new FileInfo(f).Length / 1024,
                                         UploadedOn = System.IO.File.GetCreationTime(f).ToString("yyyy-MM-dd HH:mm:ss")
                                     })
                                     .OrderBy(f => f.FileName)
                                     .ToList();

                return Ok(files);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error reading files: {ex.Message}");
            }
        }

        /// <summary>
        /// Uploads a file for a given CallNbr
        /// Legacy equivalent: btnUpload_Click() → SaveFile()
        /// </summary>
        [HttpPost("UploadFileAttachment")]
        public async Task<IActionResult> UploadFileAttachment([FromForm] IFormFile file, [FromForm] string callNbr)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is empty or missing.");

            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest($"Invalid file type: {ext}. Allowed: {string.Join(", ", allowedExtensions)}");

            var dirPath = Path.Combine(baseDirectory, callNbr);
            Directory.CreateDirectory(dirPath);

            var destPath = Path.Combine(dirPath, file.FileName);

            if (System.IO.File.Exists(destPath))
                return Conflict($"File '{file.FileName}' already exists.");

            try
            {
                using (var stream = new FileStream(destPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new
                {
                    message = "File uploaded successfully",
                    fileName = file.FileName,
                    fileSizeKB = (file.Length / 1024).ToString("N2")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error uploading file: {ex.Message}");
            }
        }

        /// <summary>
        /// Get/download a specific file
        /// Legacy equivalent: getRootURL() (used to preview/download)
        /// </summary>
        [HttpGet("GetFile")]
        public IActionResult GetFile([FromQuery] string callNbr, [FromQuery] string fileName)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(fileName))
                return BadRequest("CallNbr and fileName are required.");

            var filePath = Path.Combine(baseDirectory, callNbr, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound("File not found.");

            try
            {
                var contentType = GetContentType(filePath);
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving file: {ex.Message}");
            }
        }

        private string GetContentType(string path)
        {
            var ext = Path.GetExtension(path).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".pdf" => "application/pdf",
                ".xls" or ".xlsx" => "application/vnd.ms-excel",
                ".doc" or ".docx" => "application/msword",
                _ => "application/octet-stream"
            };
        }

    }
}
