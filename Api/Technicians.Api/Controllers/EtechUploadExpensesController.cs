using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EtechUploadExpensesController : ControllerBase
    {
        private readonly EtechUploadExpensesRepository _repository;
        public EtechUploadExpensesController(EtechUploadExpensesRepository repository)
        {
            _repository = repository;
        }
        [HttpPost("uploadExpenses")]
        public async Task<IActionResult> UploadExpenses([FromBody] EtechUploadExpensesDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CallNumber) || string.IsNullOrWhiteSpace(request.User))
                return BadRequest("CallNumber and User are required.");

            try
            {
                var result = await _repository.UploadExpensesAsync(request);
                return Ok(new { success = true, message = "Expenses uploaded successfully.", rowsAffected = result });
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
