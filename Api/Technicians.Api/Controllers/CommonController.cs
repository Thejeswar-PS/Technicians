using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.Drawing.Imaging;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommonController : ControllerBase
    {
        private readonly CommonRepository _repository;

        public CommonController(CommonRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("GetAccountManagers")]
        public async Task<ActionResult<List<AccountManagerVM>>> GetAccountManagers()
        {
            var result = await _repository.GetAccountManagers();
            return Ok(result);
        }

        [HttpGet("GetTechNamesByEmpID")]
        public async Task<IActionResult> GetTechNames([FromQuery] string empId, [FromQuery] string empType)
        {
            if (string.IsNullOrEmpty(empId) || string.IsNullOrEmpty(empType))
                return BadRequest("empId and empType are required.");

            var data = await _repository.GetTechNamesByEmpIDAsync(empId, empType);
            return Ok(data);
        }

        [HttpGet("GetEmployeeStatusForJobList")]
        public async Task<IActionResult> GetEmployeeStatusForJobList(
            [FromQuery] string? userId,
            [FromQuery] string? adUserId)
        {
            // Accept either userId or adUserId
            string userIdentifier = userId ?? adUserId;

            if (string.IsNullOrEmpty(userIdentifier))
                return BadRequest("Either userId or adUserId is required.");

            var data = await _repository.GetEmployeeStatusForJobListAsync(userIdentifier);
            return Ok(data);
        }

        [HttpGet("GetTechnicians")]
        public async Task<ActionResult<List<GetTechniciansVM>>> GetTechnicians()
        {
            var result = await _repository.GetTechnicians();
            return Ok(result);
        }

        [HttpGet("GetStates")]
        public async Task<ActionResult<List<GetStateVM>>> GetStates()
        {
            var result = await _repository.GetStates();
            return Ok(result);
        }

        [HttpGet("GetEmpLevel/{empName}")]
        public async Task<ActionResult<int>> GetEmpLevel(string empName)
        {
            var level = await _repository.GetEmpLevel(empName);
            return Ok(level);
        }
    }
}
