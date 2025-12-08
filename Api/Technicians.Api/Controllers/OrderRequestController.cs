using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Text.Json;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderRequestController : ControllerBase
    {
        private readonly OrderRequestRepository _orderRequestRepository;
        private readonly ILogger<OrderRequestController> _logger;

        public OrderRequestController(OrderRequestRepository orderRequestRepository, ILogger<OrderRequestController> logger)
        {
            _orderRequestRepository = orderRequestRepository;
            _logger = logger;
        }

        /// <summary>
        /// Gets the maximum OrderRequest row index
        /// </summary>
        /// <returns>Maximum row index as integer</returns>
        [HttpGet("GetMaxOrderRequestRowIndex")]
        public async Task<ActionResult<int>> GetMaxOrderRequestRowIndex()
        {
            try
            {
                _logger.LogInformation("Getting max OrderRequest row index");

                var maxRowIndex = await _orderRequestRepository.GetMaxOrderRequestRowIndexAsync();

                _logger.LogInformation("Successfully retrieved max OrderRequest row index: {MaxRowIndex}", maxRowIndex);

                return Ok(maxRowIndex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting max OrderRequest row index");
                return StatusCode(500, "An error occurred while retrieving the max OrderRequest row index");
            }
        }

        /// <summary>
        /// Gets parts test list data based on row index and source
        /// </summary>
        /// <param name="rowIndex">Row index parameter</param>
        /// <param name="source">Source type: PartsTest, OrderRequest, or other</param>
        /// <returns>DataSet as JSON object</returns>
        [HttpGet("GetPartsTestList")]
        public async Task<ActionResult> GetPartsTestList([FromQuery] int rowIndex, [FromQuery] string source = "OrderRequest")
        {
            try
            {
                _logger.LogInformation("Getting parts test list for RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);

                var dataSet = await _orderRequestRepository.GetPartsTestListAsync(rowIndex, source);

                // Convert DataSet to JSON-friendly format
                var result = new
                {
                    Tables = dataSet.Tables.Cast<DataTable>().Select(table => new
                    {
                        TableName = table.TableName,
                        Columns = table.Columns.Cast<DataColumn>().Select(col => new
                        {
                            Name = col.ColumnName,
                            Type = col.DataType.Name
                        }).ToArray(),
                        Rows = table.AsEnumerable().Select(row =>
                            table.Columns.Cast<DataColumn>().ToDictionary(
                                col => col.ColumnName,
                                col => row[col] == DBNull.Value ? null : row[col]
                            )
                        ).ToArray()
                    }).ToArray()
                };

                _logger.LogInformation("Successfully retrieved parts test list with {TableCount} tables", dataSet.Tables.Count);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test list for RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);
                return StatusCode(500, new { message = "An error occurred while retrieving the parts test list", error = ex.Message });
            }
        }


        [HttpPost("SaveUpdateOrderRequest")]
        public async Task<ActionResult<int>> SaveUpdateOrderRequest([FromBody] OrderRequestDto orderRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Saving/Updating OrderRequest for RowIndex: {RowIndex}, LastModifiedBy: {LastModifiedBy}",
                    orderRequest.RowIndex, orderRequest.LastModifiedBy);

                var rowIndex = await _orderRequestRepository.SaveUpdateOrderRequestAsync(orderRequest);

                _logger.LogInformation("Successfully saved/updated OrderRequest with RowIndex: {RowIndex}", rowIndex);

                return Ok(new { rowIndex = rowIndex, message = "Order request saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving/updating OrderRequest for RowIndex: {RowIndex}", orderRequest.RowIndex);
                return StatusCode(500, new { message = "An error occurred while saving the order request", error = ex.Message });
            }
        }


        [HttpDelete("DeletePartsTestList")]
        public async Task<ActionResult<string>> DeletePartsTestList([FromQuery] int rowIndex, [FromQuery] string source = "OrderRequest")
        {
            try
            {
                _logger.LogInformation("Deleting parts test list for RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);

                var result = await _orderRequestRepository.DeletePartsTestListAsync(rowIndex, source);

                _logger.LogInformation("Successfully deleted parts test list for RowIndex: {RowIndex}, Source: {Source}, Result: {Result}", rowIndex, source, result);

                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting parts test list for RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);
                return StatusCode(500, new { message = "An error occurred while deleting the parts test list", error = ex.Message });
            }
        }

        /// <summary>
        /// Saves or updates an order request with file attachments
        /// Files are stored at: \\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo\[RowIndex]\[FileName]
        /// </summary>
       

    }
}
