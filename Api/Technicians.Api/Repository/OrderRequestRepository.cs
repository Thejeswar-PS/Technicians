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
    }
}