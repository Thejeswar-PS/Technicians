using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
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
        [HttpPost("ShippingInfo")]
        public async Task<IActionResult> SaveOrUpdateShippingInfo([FromBody] ShippingInfoDto request)
        {
            if (request == null) return BadRequest();

            await _repository.SaveOrUpdateShippingInfoAsync(request);
            return Ok(new { message = "Shipping info saved/updated successfully." });
        }
    }
}
