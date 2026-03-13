using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class SaveUpdatePartsReqRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<SaveUpdatePartsReqRepository> _logger;

        private const string LoggerName = "Technicians.SaveUpdatePartsReqRepository";

        public SaveUpdatePartsReqRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<SaveUpdatePartsReqRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _errorLog = errorLog;
            _logger = logger;
        }

        public async Task SaveOrUpdatePartsAsync(SaveUpdatePartsReqDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                parameters.Add("@Service_Call_ID", request.Service_Call_ID);
                parameters.Add("@SCID_Inc", request.SCID_Inc);
                parameters.Add("@Qty", request.Qty);
                parameters.Add("@Part_Num", request.Part_Num);
                parameters.Add("@DC_Part_Num", request.DC_Part_Num);
                parameters.Add("@Description", request.Description);
                parameters.Add("@Destination", request.Destination);
                parameters.Add("@Required_Date", request.Required_Date);
                parameters.Add("@Required_Time", request.Required_Time);
                parameters.Add("@Urgent", request.Urgent == "Yes" ? 1 : 0);
                parameters.Add("@BackOrder", request.BackOrder == "Yes" ? 1 : 0);
                parameters.Add("@Shipping_Method", request.Shipping_Method);
                parameters.Add("@Maint_Auth_ID", request.Maint_Auth_ID);
                parameters.Add("@TechName", request.TechName);
                parameters.Add("@Location", request.Location);

                await connection.ExecuteAsync(
                    "SaveUpdatePartsReq",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                _logger.LogInformation("Successfully saved/updated parts request for Service_Call_ID: {Service_Call_ID}, Part_Num: {Part_Num}", 
                    request.Service_Call_ID, request.Part_Num);
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "SaveOrUpdatePartsAsync", $"{request.Service_Call_ID}|{request.Part_Num}");
                _logger.LogError(sqlEx, "SQL error saving/updating parts request for Service_Call_ID: {Service_Call_ID}, Part_Num: {Part_Num}", 
                    request.Service_Call_ID, request.Part_Num);
                throw new Exception($"Database error saving parts request: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "SaveOrUpdatePartsAsync", $"{request.Service_Call_ID}|{request.Part_Num}");
                _logger.LogError(ex, "Error saving/updating parts request for Service_Call_ID: {Service_Call_ID}, Part_Num: {Part_Num}", 
                    request.Service_Call_ID, request.Part_Num);
                throw new Exception($"Error saving parts request: {ex.Message}", ex);
            }
        }
    }
}
