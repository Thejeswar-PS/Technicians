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
        public async Task<IActionResult> SaveUpdateExpense([FromBody] SaveUpdateExpenseDto req)
        {
            await _expenseRepository.SaveOrUpdateExpenseAsync(req);
            return Ok(new { success = true });
        }
    
    }
}
