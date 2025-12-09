using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class OrderRequestRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public OrderRequestRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets the maximum OrderRequest row index using IDENT_CURRENT
        /// </summary>
        /// <returns>The current identity value for OrderRequest table</returns>
        public async Task<int> GetMaxOrderRequestRowIndexAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = "SELECT IDENT_CURRENT('OrderRequest')";
                using var command = new SqlCommand(query, connection);

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        /// <summary>
        /// Gets parts test list data based on row index and source
        /// </summary>
        /// <param name="rowIndex">Row index parameter for the stored procedure</param>
        /// <param name="source">Source type: "PartsTest", "OrderRequest", or other</param>
        /// <returns>DataSet containing the results</returns>
        public async Task<DataSet> GetPartsTestListAsync(int rowIndex, string source)
        {
            var dataSet = new DataSet();

            try
            {
                // Determine stored procedure name based on source
                string storedProcedure = source switch
                {
                    "PartsTest" => "GetPartsTestList",
                    "OrderRequest" => "GetOrderRequestList",
                    _ => "GetNewUniTestList"
                };

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand(storedProcedure, connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@RowIndex", rowIndex);

                using var adapter = new SqlDataAdapter(command);
                adapter.Fill(dataSet);
            }
            catch (Exception)
            {
                // Return empty dataset on error, matching legacy behavior
                dataSet = new DataSet();
            }

            return dataSet;
        }

        public async Task<int> SaveUpdateOrderRequestAsync(OrderRequestDto orderRequest)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("SaveUpdateOrderRequest", connection);
                command.CommandType = CommandType.StoredProcedure;

                // Add parameters for the stored procedure
                command.Parameters.AddWithValue("@RowIndex", orderRequest.RowIndex);
                command.Parameters.AddWithValue("@OrderType", (object?)orderRequest.OrderType ?? DBNull.Value);
                command.Parameters.AddWithValue("@Requester", (object?)orderRequest.Requester ?? DBNull.Value);
                command.Parameters.AddWithValue("@DCGPartNo", (object?)orderRequest.DCGPartNo ?? DBNull.Value);
                command.Parameters.AddWithValue("@ManufPartNo", (object?)orderRequest.ManufPartNo ?? DBNull.Value);
                command.Parameters.AddWithValue("@Vendor", (object?)orderRequest.Vendor ?? DBNull.Value);
                command.Parameters.AddWithValue("@QtyNeeded", (object?)orderRequest.QtyNeeded ?? DBNull.Value);
                command.Parameters.AddWithValue("@PONumber", (object?)orderRequest.PONumber ?? DBNull.Value);
                command.Parameters.AddWithValue("@OrderDate", (object?)orderRequest.OrderDate ?? DBNull.Value);
                command.Parameters.AddWithValue("@ArriveDate", (object?)orderRequest.ArriveDate ?? DBNull.Value);
                command.Parameters.AddWithValue("@Notes", (object?)orderRequest.Notes ?? DBNull.Value);
                command.Parameters.AddWithValue("@Status", (object?)orderRequest.Status ?? DBNull.Value);
                command.Parameters.AddWithValue("@LastModifiedBy", orderRequest.LastModifiedBy);

                await command.ExecuteNonQueryAsync();

                // Return the RowIndex (for new records, this would be the identity value)
                return orderRequest.RowIndex == 0 ? await GetMaxOrderRequestRowIndexAsync() : orderRequest.RowIndex;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<string> DeletePartsTestListAsync(int rowIndex, string source)
        {
            try
            {
                // Determine stored procedure name based on source
                string storedProcedure = source switch
                {
                    "PartsTest" => "DeletePartsTestList",
                    "UnitTest" => "DeleteNewUnitTest",
                    "OrderRequest" => "DeleteOrderRequest",
                    _ => "DeleteStrippingUnit"
                };

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand(storedProcedure, connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@RowIndex", rowIndex);

                var result = await command.ExecuteScalarAsync();
                return result?.ToString() ?? string.Empty;
            }
            catch (Exception ex)
            {
                return "Error Occured : <br/>" + ex.Message;
            }
        }

        /// <summary>
        /// Saves files for an order request to the network file share
        /// Files are saved to: \\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo\[RowIndex]\[FileName]
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex (Auto Generated ID)</param>
        /// <param name="files">Collection of files to upload</param>
        /// <returns>List of upload results</returns>
        public async Task<List<FileUploadResult>> SaveOrderRequestFilesAsync(int rowIndex, IFormFileCollection files)
        {
            var results = new List<FileUploadResult>();
            var allowedExtensions = new[] { ".jpg", ".gif", ".doc", ".bmp", ".xls", ".png", ".jpeg", ".pdf" };

            // Base network file share path - matching legacy system
            string baseFilePath = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";
            string orderDirectory = Path.Combine(baseFilePath, rowIndex.ToString());

            try
            {
                // Create directory if it doesn't exist
                if (!Directory.Exists(orderDirectory))
                {
                    Directory.CreateDirectory(orderDirectory);
                }

                foreach (var file in files)
                {
                    var result = new FileUploadResult
                    {
                        FileName = file.FileName,
                        Success = false,
                        ErrorMessage = string.Empty
                    };

                    try
                    {
                        // Validate file
                        if (file.Length == 0)
                        {
                            result.ErrorMessage = "File is empty";
                            results.Add(result);
                            continue;
                        }

                        // Check file extension
                        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
                        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
                        {
                            result.ErrorMessage = $"File type not allowed. Allowed types: {string.Join(", ", allowedExtensions)}";
                            results.Add(result);
                            continue;
                        }

                        // Generate full file path
                        string filePath = Path.Combine(orderDirectory, file.FileName);

                        // Save file to network share
                        using (var fileStream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(fileStream);
                        }

                        result.Success = true;
                        result.FilePath = filePath;
                        result.FileSize = file.Length;
                    }
                    catch (Exception ex)
                    {
                        result.ErrorMessage = $"Failed to save file: {ex.Message}";
                    }

                    results.Add(result);
                }
            }
            catch (Exception ex)
            {
                // If directory creation fails, mark all files as failed
                foreach (var file in files)
                {
                    results.Add(new FileUploadResult
                    {
                        FileName = file.FileName,
                        Success = false,
                        ErrorMessage = $"Failed to create directory: {ex.Message}"
                    });
                }
            }

            return results;
        }

        /// <summary>
        /// Gets all files for a specific order request
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <returns>List of file information</returns>
        public List<OrderRequestFileInfo> GetOrderRequestFiles(int rowIndex)
        {
            var files = new List<OrderRequestFileInfo>();
            
            try
            {
                string baseFilePath = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";
                string orderDirectory = Path.Combine(baseFilePath, rowIndex.ToString());

                if (!Directory.Exists(orderDirectory))
                {
                    return files; // Return empty list if directory doesn't exist
                }

                var directoryInfo = new DirectoryInfo(orderDirectory);
                foreach (var file in directoryInfo.GetFiles())
                {
                    files.Add(new OrderRequestFileInfo
                    {
                        FileName = file.Name,
                        FileSizeKB = file.Length / 1024,
                        UploadedOn = file.CreationTime,
                        FilePath = file.FullName
                    });
                }

                return files.OrderBy(f => f.FileName).ToList();
            }
            catch (Exception)
            {
                return files; // Return empty list on error
            }
        }

        /// <summary>
        /// Gets the file access URL for viewing files (matching legacy getRootURL method)
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <param name="fileName">The file name</param>
        /// <returns>File URL for viewing</returns>
        public string GetFileAccessUrl(int rowIndex, string fileName)
        {
            // Legacy getRootURL equivalent - uses different path for viewing
            return $"file:////VDC1/Files/Parts/PartsCommon/ETechPartsShipInfo/{rowIndex}/{fileName}";
        }

        /// <summary>
        /// Deletes a specific file from an order request
        /// </summary>
        /// <param name="rowIndex">The OrderRequest RowIndex</param>
        /// <param name="fileName">The file name to delete</param>
        /// <returns>True if successful, false otherwise</returns>
        public bool DeleteOrderRequestFile(int rowIndex, string fileName)
        {
            try
            {
                string baseFilePath = @"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo";
                string filePath = Path.Combine(baseFilePath, rowIndex.ToString(), fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return true;
                }

                return false; // File doesn't exist
            }
            catch (Exception)
            {
                return false; // Error occurred
            }
        }
    }
}