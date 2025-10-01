using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadedInfoController : ControllerBase
    {
        private readonly UploadedInfoRepository _uploadRepository;

        public UploadedInfoController(UploadedInfoRepository uploadRepository)
        {
            _uploadRepository = uploadRepository;
        }

        [HttpGet("uploaded-info")]
        public async Task<IActionResult> GetUploadedInfo([FromQuery] string callNbr, [FromQuery] string techId)
        {
            if (string.IsNullOrEmpty(callNbr))
                return BadRequest("CallNbr is required");

            var result = await _uploadRepository.GetUploadedInfoAsync(callNbr, techId);

            return Ok(result);
        }
    }
}
