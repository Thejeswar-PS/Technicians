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
        /// Gets order request status data using POST with request body
        /// </summary>
        /// <param name="request">Request parameters for filtering</param>
        /// <returns>List of order request status records</returns>
        [HttpPost("GetOrderRequestStatus")]
        public async Task<ActionResult<List<OrderRequestResponseDto>>> GetOrderRequestStatus([FromBody] OrderRequestStatusRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Invalid request payload.");
                }

                _logger.LogInformation("Getting order request status for Status: {Status}, OrderType: {OrderType}, Archive: {Archive}, Notes: {Notes}", 
                    request.Status, request.OrderType, request.Archive, request.Notes);

                var results = await _repository.GetOrderRequestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved {Count} order request status records", results.Count);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order request status for Status: {Status}, OrderType: {OrderType}, Archive: {Archive}, Notes: {Notes}", 
                    request.Status, request.OrderType, request.Archive, request.Notes);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while retrieving order request status", 
                    error = ex.Message 
                });
            }
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
    }
}