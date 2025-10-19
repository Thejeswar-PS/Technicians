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

        
    }
}
