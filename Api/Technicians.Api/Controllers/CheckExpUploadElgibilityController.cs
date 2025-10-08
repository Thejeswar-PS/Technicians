using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.Threading.Tasks;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckExpUploadEligibilityController : ControllerBase
    {
        private readonly CheckExpUploadElgibilityRepository _repository;

        public CheckExpUploadEligibilityController(CheckExpUploadElgibilityRepository repository)
        {
            _repository = repository;
        }

        //[HttpPost]
        //public async Task<IActionResult> CheckEligibility([FromBody] CheckExpUploadElgibilityDto request)
        //{
        //    if (request == null || string.IsNullOrWhiteSpace(request.CallNbr))
        //        return BadRequest("CallNbr is required.");

        //    var result = await _repository.CheckExpUploadElgibilityAsync(request.CallNbr);

        //    return Ok(new CheckExpUploadElgibilityResponse { Result = result });
        //}

        //private class CheckExpUploadElgibilityResponse
        //{
        //    public string Result { get; set; }
        //}

        [HttpGet("{callNbr}")]
        public async Task<IActionResult> CheckExpUploadElgibility(string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr is required.");

            var result = await _repository.CheckExpUploadElgibilityAsync(callNbr);
            return Ok(new { Message = result });
        }
    }
}