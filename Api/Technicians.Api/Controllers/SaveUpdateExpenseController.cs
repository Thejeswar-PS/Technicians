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

        [HttpPost("SaveExpense")]
        public async Task<IActionResult> SaveExpense([FromBody] SaveUpdateExpenseDto req)
        {
            if (req == null)
                return BadRequest(new { success = false, message = "Invalid request data." });

            try
            {
                await _expenseRepository.SaveOrUpdateExpenseAsync(req);
                return Ok(new { success = true, message = "Expense saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


    }
}
