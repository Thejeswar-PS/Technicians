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

        [HttpGet("{callNbr}")]
        public async Task<ActionResult<List<PartsDataDto>>> GetPartsData(string callNbr)
        {
            var result = await _repository.GetPartsDataAsync(callNbr);
            if (result == null || result.Count == 0)
                return NotFound();
            return Ok(result);
        }

        //2. Get Parts Equip Info by Call Number
        [HttpGet("{callNbr}/equipinfo")]
        public async Task<IActionResult> Get(string callNbr)
        {
            var result = await _repository.GetPartsEquipInfoAsync(callNbr);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        //3. Get Tech Return Parts by Call Number
        [HttpGet("{callNbr}/techreturnparts")]
        public async Task<ActionResult<TechReturnPartsDto>> GetTechReturnParts(string callNbr)
        {
            var result = await _repository.GetTechReturnPartsAsync(callNbr);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        //4. Get Parts Req Data by Call Number and SCID_Inc

        [HttpGet("GetPartsReqData")]
        public async Task<IActionResult> Get([FromQuery] string callNbr, [FromQuery] int scidInc = 0)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("callNbr is required.");

            var result = await _repository.GetPartsReqData(callNbr, scidInc);
            return Ok(result);
        }

        //5.Get Tech Parts  Data by Call Number and SCID_Inc

        [HttpGet("GetTechPartsData")]
        public async Task<IActionResult> GetTechPartsData([FromQuery] string callNbr, [FromQuery] int scidInc = 0)
        {
            if (string.IsNullOrEmpty(callNbr))
                return BadRequest("callNbr is required");

            var result = await _repository.GetTechPartsDataAsync(callNbr, scidInc);
            return Ok(result);
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

        //7. Save or update Shipping Info
        [HttpPost("UpdateShippingInfo")]
        public async Task<IActionResult> SaveOrUpdateShippingInfo([FromBody] ShippingInfoDto request)
        {
            if (request == null) return BadRequest(new { message = "Request body is required." });

            int rows = await _repository.SaveOrUpdateShippingInfoAsync(request);

            if (rows == 0)
            {
                // 404 makes it clear the update did not match any row
                return NotFound(new { message = "No matching Service_Call_ID found (0 rows updated).", rowsAffected = rows });
            }

            return Ok(new { message = "Shipping info saved/updated successfully.", rowsAffected = rows });
        }

        //8. Mark Parts as Received

        [HttpPost("UpdateTechpartsReceived")]
        public async Task<IActionResult> MarkPartsAsReceived([FromBody] TechPartsReceivedDto request)
        {
            if (request == null || request.ScidIncList == null || !request.ScidIncList.Any())
            {
                return BadRequest("Invalid request payload.");
            }

            await _repository.UpdatePartsReceivedAsync(request);
            return Ok(new { message = "Parts marked as received successfully." });
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

        //10. Save or Update Parts Equip Info
        [HttpPost("SavePartsEquipInfo")]
        public async Task<IActionResult> SavePartsEquipInfo([FromBody] SavePartsEquipInfoDto request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceCallId))
                return BadRequest("ServiceCallId is required.");

            try
            {
                await _repository.SaveOrUpdatePartsEquipInfoAsync(request);
                return Ok(new { message = "Parts equipment info saved or updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error while saving equipment info.", detail = ex.Message });
            }
        }
    }
}
