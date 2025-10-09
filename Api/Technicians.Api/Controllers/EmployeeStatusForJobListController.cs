using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeStatusForJobListController : ControllerBase
    {
        private readonly EmployeeStatusForJobListRepository _repository;

        public EmployeeStatusForJobListController(EmployeeStatusForJobListRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("status/{adUserId}")]
        public async Task<ActionResult<EmployeeStatusForJobListDto>> GetEmployeeStatus(string adUserId)
        {
            var result = await _repository.GetEmployeeStatusForJobListAsync(adUserId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
    }
}
