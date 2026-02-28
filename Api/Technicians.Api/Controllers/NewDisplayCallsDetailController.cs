using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewDisplayCallsDetailController : ControllerBase
    {
        private readonly NewDisplayCallsDetailRepository _repository;

        public NewDisplayCallsDetailController(NewDisplayCallsDetailRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<NewDisplayCallsDetailResponse>> Get(
            [FromQuery] string detailPage,
            [FromQuery] string? offId = null)
        {
            if (string.IsNullOrWhiteSpace(detailPage))
                return BadRequest("DetailPage is required.");

            var request = new NewDisplayCallsDetailRequest
            {
                DetailPage = detailPage,
                OffId = offId
            };

            var result = await _repository.GetAsync(request);

            return Ok(result);
        }
    }
}