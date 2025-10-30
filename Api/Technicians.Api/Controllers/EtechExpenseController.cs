using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Technicians.Api.Models;
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

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error while fetching expenses: {ex.Message}");
            }
        }

        [HttpGet("GetExpenseDetail")]
        public IActionResult GetExpenseDetail(
            [FromQuery] string callNbr,
            [FromQuery] int tableIdx)
        {
            try
            {
                var result = _repository.GetExpenseDetail(callNbr, tableIdx);

                if (result == null || !result.Any())
                    return NotFound($"No expenses found for '{callNbr}' related to {tableIdx}");

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

            //if (!result.Any())
            //    return NotFound("No receipts found for the given CallNbr and TechID.");

            return Ok(result);
        }

        [HttpPost("EnableExpenses")]
        public async Task<IActionResult> EnableExpenses([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("callNbr", out var callNbrElement))
                return BadRequest("Missing 'callNbr' in request body.");

            string callNbr = callNbrElement.GetString();

            if (string.IsNullOrWhiteSpace(callNbr))
                return BadRequest("CallNbr cannot be empty.");

            var result = await _repository.EnableExpenses(callNbr);

            if (result.StartsWith("Error"))
                return StatusCode(500, new { Message = result });

            return Ok(new { Message = result });
        }

        [HttpGet("CanTechAddFoodExpenses")]
        public async Task<IActionResult> CanTechAddFoodExpenses(
            [FromQuery] string callNbr,
            [FromQuery] string techName,
            [FromQuery] decimal expAmount,
            [FromQuery] decimal currentAmount,
            [FromQuery] string type,
            [FromQuery] DateTime date)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(techName))
                return BadRequest("CallNbr and TechName are required.");

            try
            {
                // Same function name alignment as legacy
                var resultMsg = await _repository.CanTechAddFoodExpensesAsync(
                    callNbr, techName, expAmount, currentAmount, type, date);

                // Legacy: If message exists, it's an error. Otherwise, success.
                if (!string.IsNullOrEmpty(resultMsg))
                {
                    return Ok($"Error: {resultMsg}");
                }

                return Ok("OK"); // or empty string if no error
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error calculating food expense: {ex.Message}");
            }
        }


        [HttpGet("GetAllowedAmountForFoodExpenses")]
        public IActionResult GetAllowedAmountForFoodExpenses(string callNbr, string techName)
        {
            if (string.IsNullOrEmpty(callNbr) || string.IsNullOrEmpty(techName))
                return BadRequest("Missing parameters.");

            string result = _repository.AllowedAmountForFoodExpenses(callNbr, techName);

            // Return plain text, not JSON (for Angular text parsing)
            return Content(result ?? string.Empty, "text/plain");
        }




    }
}
