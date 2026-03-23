using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderRequestStatusController : ControllerBase
    {
        private readonly OrderRequestStatusRepository _repository;
        private readonly ILogger<OrderRequestStatusController> _logger;

        public OrderRequestStatusController(
            OrderRequestStatusRepository repository, 
            ILogger<OrderRequestStatusController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets order request status data using GET with query parameters
        /// </summary>
        /// <param name="status">Status filter (optional, defaults to "All")</param>
        /// <param name="orderType">Order type filter (optional, defaults to "All")</param>
        /// <param name="archive">Archive filter (optional, defaults to false)</param>
        /// <returns>List of order request status records</returns>
        [HttpGet("GetOrderRequestStatus")]
        public async Task<ActionResult<List<OrderRequestResponseDto>>> GetOrderRequestStatus(
            [FromQuery] string status = "All",
            [FromQuery] string orderType = "All",
            [FromQuery] bool archive = false)
        {
            try
            {
                _logger.LogInformation("Getting order request status for Status: {Status}, OrderType: {OrderType}, Archive: {Archive}", 
                    status, orderType, archive);

                var results = await _repository.GetOrderRequestStatusAsync(status, orderType, archive);

                _logger.LogInformation("Successfully retrieved {Count} order request status records", results.Count);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order request status for Status: {Status}, OrderType: {OrderType}, Archive: {Archive}", 
                    status, orderType, archive);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving order request status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets a specific order request by its RowIndex
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the order request to retrieve</param>
        /// <returns>Single order request record or 404 if not found</returns>
        [HttpGet("GetOrderRequestByRowIndex/{rowIndex}")]
        public async Task<ActionResult<OrderRequestResponseDto>> GetOrderRequestByRowIndex(int rowIndex)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest(new { message = "Invalid RowIndex. RowIndex must be greater than 0." });
                }

                _logger.LogInformation("Getting order request for RowIndex: {RowIndex}", rowIndex);

                var result = await _repository.GetOrderRequestByRowIndexAsync(rowIndex);

                if (result == null)
                {
                    _logger.LogWarning("Order request not found for RowIndex: {RowIndex}", rowIndex);
                    return NotFound(new { message = $"Order request with RowIndex {rowIndex} not found." });
                }

                _logger.LogInformation("Successfully retrieved order request for RowIndex: {RowIndex}", rowIndex);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order request for RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving the order request", 
                    error = ex.Message 
                });
            }
        }
    }
}