using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class EtechExpenseController : ControllerBase
    {
        private readonly EtechExpenseRepository _repository;

        public EtechExpenseController(EtechExpenseRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("GetEtechExpenses")]
        public IActionResult GetEtechExpenses(
            [FromQuery] DateTime dt1,
            [FromQuery] DateTime dt2,
            [FromQuery] string techName,
            [FromQuery] int tableIdx)
        {
            try
            {
                var result = _repository.GetEtechExpenses(dt1, dt2, techName, tableIdx);

                if (result == null || !result.Any())
                    return NotFound($"No expenses found for tech '{techName}' between {dt1} and {dt2}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error while fetching expenses: {ex.Message}");
            }
        }

        [HttpGet("GetMobileReceipts")]
        public async Task<IActionResult> GetMobileReceipts(string callNbr, string techId)
        {
            if (string.IsNullOrEmpty(callNbr) || string.IsNullOrEmpty(techId))
                return BadRequest("CallNbr and TechID are required.");

            var result = await _repository.GetMobileReceiptsAsync(callNbr, techId);

            if (!result.Any())
                return NotFound("No receipts found for the given CallNbr and TechID.");

            return Ok(result);
        }
    }
}
