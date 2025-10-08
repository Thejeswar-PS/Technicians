using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.Threading.Tasks;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadJobToGPController : ControllerBase
    {
        private readonly UploadJobToGPRepository _repository;

        public UploadJobToGPController(UploadJobToGPRepository repository)
        {
            _repository = repository;
        }

        [HttpPost]
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