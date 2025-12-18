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
        /// Uploads files for an order request
        /// Files are stored at: \\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo\[RowIndex]\[FileName]
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <param name="files">Files to upload</param>
        /// <returns>Upload results</returns>
        [HttpPost("UploadFiles/{rowIndex}")]
        public async Task<ActionResult> UploadFiles(int rowIndex, IFormFileCollection files)
        {
            try
            {
                if (files == null || files.Count == 0)
                {
                    return BadRequest("No files provided for upload");
                }

                if (rowIndex <= 0)
                {
                    return BadRequest("Invalid RowIndex provided");
                }

                _logger.LogInformation("Uploading {FileCount} files for OrderRequest RowIndex: {RowIndex}", files.Count, rowIndex);

                var results = await _orderRequestRepository.SaveOrderRequestFilesAsync(rowIndex, files);

                var successCount = results.Count(r => r.Success);
                var failureCount = results.Count(r => !r.Success);

                _logger.LogInformation("File upload completed for RowIndex: {RowIndex}. Success: {SuccessCount}, Failed: {FailureCount}", 
                    rowIndex, successCount, failureCount);

                return Ok(new
                {
                    message = $"Upload completed. {successCount} files uploaded successfully, {failureCount} failed.",
                    results = results,
                    totalFiles = files.Count,
                    successCount = successCount,
                    failureCount = failureCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading files for OrderRequest RowIndex: {RowIndex}", rowIndex);
                return StatusCode(500, new { message = "An error occurred while uploading files", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets all files for a specific order request
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <returns>List of files</returns>
        [HttpGet("GetFiles/{rowIndex}")]
        public ActionResult GetFiles(int rowIndex)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest("Invalid RowIndex provided");
                }

                _logger.LogInformation("Getting files for OrderRequest RowIndex: {RowIndex}", rowIndex);

                var files = _orderRequestRepository.GetOrderRequestFiles(rowIndex);

                _logger.LogInformation("Successfully retrieved {FileCount} files for RowIndex: {RowIndex}", files.Count, rowIndex);

                return Ok(new
                {
                    rowIndex = rowIndex,
                    fileCount = files.Count,
                    files = files.Select(f => new
                    {
                        fileName = f.FileName,
                        fileSizeKB = f.FileSizeKB,
                        uploadedOn = f.UploadedOn.ToString("yyyy-MM-dd HH:mm:ss"),
                        viewUrl = _orderRequestRepository.GetFileAccessUrl(rowIndex, f.FileName)
                    })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting files for OrderRequest RowIndex: {RowIndex}", rowIndex);
                return StatusCode(500, new { message = "An error occurred while retrieving files", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a specific file from an order request
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <param name="fileName">The file name to delete</param>
        /// <returns>Deletion result</returns>
        [HttpDelete("DeleteFile/{rowIndex}")]
        public ActionResult DeleteFile(int rowIndex, [FromQuery] string fileName)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest("Invalid RowIndex provided");
                }

                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return BadRequest("File name is required");
                }

                _logger.LogInformation("Deleting file '{FileName}' for OrderRequest RowIndex: {RowIndex}", fileName, rowIndex);

                var success = _orderRequestRepository.DeleteOrderRequestFile(rowIndex, fileName);

                if (success)
                {
                    _logger.LogInformation("Successfully deleted file '{FileName}' for RowIndex: {RowIndex}", fileName, rowIndex);
                    return Ok(new { message = "File deleted successfully", fileName = fileName });
                }
                else
                {
                    _logger.LogWarning("Failed to delete file '{FileName}' for RowIndex: {RowIndex} - File not found or error occurred", fileName, rowIndex);
                    return NotFound(new { message = "File not found or could not be deleted", fileName = fileName });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file '{FileName}' for OrderRequest RowIndex: {RowIndex}", fileName, rowIndex);
                return StatusCode(500, new { message = "An error occurred while deleting the file", error = ex.Message });
            }
        }

        /// <summary>
        /// Saves or updates an order request with file attachments
        /// This combines saving order data and uploading files in one operation
        /// </summary>
        /// <param name="orderRequest">Order request data</param>
        /// <param name="files">Optional files to upload</param>
        /// <returns>Save result with file upload results</returns>
        [HttpPost("SaveWithFiles")]
        public async Task<ActionResult> SaveOrderRequestWithFiles([FromForm] string orderRequestJson, IFormFileCollection? files)
        {
            try
            {
                // Deserialize the order request data
                var orderRequest = JsonSerializer.Deserialize<OrderRequestDto>(orderRequestJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (orderRequest == null)
                {
                    return BadRequest("Invalid order request data");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Saving OrderRequest with files for RowIndex: {RowIndex}, LastModifiedBy: {LastModifiedBy}", 
                    orderRequest.RowIndex, orderRequest.LastModifiedBy);

                // Save the order request first
                var rowIndex = await _orderRequestRepository.SaveUpdateOrderRequestAsync(orderRequest);

                var response = new
                {
                    rowIndex = rowIndex,
                    message = "Order request saved successfully",
                    fileResults = new List<FileUploadResult>()
                };

                // Upload files if provided
                if (files != null && files.Count > 0)
                {
                    _logger.LogInformation("Uploading {FileCount} files for OrderRequest RowIndex: {RowIndex}", files.Count, rowIndex);
                    
                    var fileResults = await _orderRequestRepository.SaveOrderRequestFilesAsync(rowIndex, files);
                    var successCount = fileResults.Count(r => r.Success);
                    var failureCount = fileResults.Count(r => !r.Success);

                    response = new
                    {
                        rowIndex = rowIndex,
                        message = $"Order request saved successfully. {successCount} files uploaded, {failureCount} failed.",
                        fileResults = fileResults
                    };

                    _logger.LogInformation("File upload completed for RowIndex: {RowIndex}. Success: {SuccessCount}, Failed: {FailureCount}", 
                        rowIndex, successCount, failureCount);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving OrderRequest with files");
                return StatusCode(500, new { message = "An error occurred while saving the order request", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes an order request entry by row index
        /// </summary>
        /// <param name="rowIndex">The row index of the order request to delete</param>
        /// <returns>Deletion result message</returns>
        [HttpDelete("DeleteOrderRequest/{rowIndex}")]
        public async Task<ActionResult> DeleteOrderRequest(int rowIndex)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest(new { message = "Invalid row index. Row index must be greater than 0." });
                }

                _logger.LogInformation("Deleting order request with RowIndex: {RowIndex}", rowIndex);

                var result = await _orderRequestRepository.DeleteOrderRequestAsync(rowIndex);

                if (result.Contains("successfully", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Successfully deleted order request with RowIndex: {RowIndex}", rowIndex);
                    return Ok(new { message = result, rowIndex = rowIndex });
                }
                else if (result.Contains("not found", StringComparison.OrdinalIgnoreCase) || 
                         result.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Order request not found for RowIndex: {RowIndex}", rowIndex);
                    return NotFound(new { message = result, rowIndex = rowIndex });
                }
                else
                {
                    _logger.LogError("Error deleting order request with RowIndex: {RowIndex}. Result: {Result}", rowIndex, result);
                    return BadRequest(new { message = result, rowIndex = rowIndex });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while deleting order request with RowIndex: {RowIndex}", rowIndex);
                return StatusCode(500, new 
                { 
                    message = "An error occurred while deleting the order request", 
                    error = ex.Message,
                    rowIndex = rowIndex
                });
            }
        }
    }
}
