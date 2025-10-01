using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SaveUpdateExpenseController : ControllerBase
    {
        private readonly SaveUpdateExpenseRepository _expenseRepository;

        public SaveUpdateExpenseController(SaveUpdateExpenseRepository expenseRepository)
        {
            _expenseRepository = expenseRepository;
        }

        [HttpPost("save-update")]
        public async Task<IActionResult> SaveUpdateExpense([FromBody] SaveUpdateExpenseDto request)
        {
            if (request == null)
                return BadRequest("Invalid request");

            var result = await _expenseRepository.SaveUpdateExpenseAsync(request);

            if (result > 0)
            {
                return Ok(new { message = "Expense saved/updated successfully" });
            }
            else
            {
                return StatusCode(500, "Failed to save/update expense");
            }
        }
    }
}
