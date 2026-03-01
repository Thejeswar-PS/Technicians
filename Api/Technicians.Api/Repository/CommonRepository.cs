using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class CommonRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpconnectionString;
        private readonly ErrorLogRepository _errorLog;

        private const string LoggerName = "Technicians.CommonRepository";

        public CommonRepository(IConfiguration configuration, ErrorLogRepository errorLog)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
            _errorLog = errorLog;
        }

        public async Task<List<AccountManagerVM>> GetAccountManagers()
        {
            var managers = new List<AccountManagerVM>();

            try
            {
                await using var connection = new SqlConnection(_gpconnectionString);
                await connection.OpenAsync();

                const string query = "SELECT RTRIM(OFFNAME) AS OFFNAME, RTRIM(OFFID) AS OFFID FROM SVC00902 WHERE MANAGER = '1'";

                await using var command = new SqlCommand(query, connection);

                await using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    managers.Add(new AccountManagerVM
                    {
                        OFFNAME = reader["OFFNAME"]?.ToString(),
                        OFFID = reader["OFFID"]?.ToString()
                    });
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAccountManagers");
                throw;
            }

            return managers;
        }

        public async Task<IEnumerable<dynamic>> GetTechNamesByEmpIDAsync(string empId, string empType)
        {
            try
            {
                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                var parameters = new DynamicParameters();
                parameters.Add("@EmpId", empId);
                parameters.Add("@EmpType", empType);

                var result = await connection.QueryAsync("GetTechNamesByEmpID", parameters, commandType: CommandType.StoredProcedure);
                return result;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetTechNamesByEmpIDAsync", empId);
                throw;
            }
        }

        public async Task<IEnumerable<dynamic>> GetEmployeeStatusForJobListAsync(string adUserId)
        {
            try
            {
                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                var parameters = new DynamicParameters();
                parameters.Add("@ADUserID", adUserId);

                var result = await connection.QueryAsync("GetEmployeeStatusForJobList", parameters, commandType: CommandType.StoredProcedure);
                return result;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetEmployeeStatusForJobListAsync", adUserId);
                throw;
            }
        }

        public async Task<int> GetEmpLevel(string empName)
        {
            try
            {
                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("SpGetEmpLevel", connection);
                command.CommandType = System.Data.CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@EmpName", empName);

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetEmpLevel", empName);
                throw;
            }
        }

        public async Task<List<GetTechniciansVM>> GetTechnicians()
        {
            var technicians = new List<GetTechniciansVM>();

            try
            {
                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("etechTechNames", connection);
                command.CommandType = System.Data.CommandType.StoredProcedure;

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    technicians.Add(new GetTechniciansVM
                    {
                        TechID = reader["TechID"].ToString(),
                        Techname = reader["Techname"].ToString()
                    });
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetTechnicians");
            }

            return technicians;
        }

        public async Task<List<GetStateVM>> GetStates()
        {
            try
            {
                var states = new List<GetStateVM>();

                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("SpGetStates", connection);
                command.CommandType = System.Data.CommandType.StoredProcedure;

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    states.Add(new GetStateVM
                    {
                        StateCode = reader["StateCode"].ToString(),
                        StateName = reader["StateName"].ToString()
                    });
                }

                return states;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetStates");
                throw;
            }
        }

        public async Task<TechKpiDto> GetKpisAsync(string pOffid, string techId, string yearType)
        {
            var result = new TechKpiDto();

            try
            {
                using var con = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("dbo.GetTechDBReportDetails_Count", con);

                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@pOffid", pOffid);
                cmd.Parameters.AddWithValue("@TechID", techId);
                cmd.Parameters.AddWithValue("@YearType", yearType);

                await con.OpenAsync();

                using var dr = await cmd.ExecuteReaderAsync();

                if (await dr.ReadAsync())
                {
                    result = new TechKpiDto
                    {
                        JobsScheduled = Convert.ToInt32(dr["JobsScheduled"]),
                        JobsToBeUploaded = Convert.ToInt32(dr["JobsToBeUploaded"]),
                        EmergencyJobs = Convert.ToInt32(dr["EmergencyJobs"]),
                        MissingJobs = Convert.ToInt32(dr["MissingJobs"]),
                        JobsWithParts = Convert.ToInt32(dr["JobsWithParts"]),
                        JobsThisWeek = Convert.ToInt32(dr["JobsThisWeek"])
                    };
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetKpisAsync", techId);
                throw;
            }

            return result;
        }

        public async Task<List<TechActivityLogDto>> GetActivityLogAsync(string accMgr, string techId)
        {
            var results = new List<TechActivityLogDto>();

            try
            {
                using var con = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("dbo.SpGetRecentLogActivity", con);

                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@AccMgr", accMgr);
                cmd.Parameters.AddWithValue("@TechID", techId);

                await con.OpenAsync();

                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    results.Add(new TechActivityLogDto
                    {
                        CallNbr = reader["CallNbr"]?.ToString(),
                        TechID = reader["TechID"]?.ToString(),
                        AccMgr = reader["AccMgr"]?.ToString(),
                        Activity = reader["Activity"]?.ToString(),
                        Status = reader["Status"]?.ToString(),
                        ActivityDate = reader["ActivityDate"] != DBNull.Value
                            ? Convert.ToDateTime(reader["ActivityDate"])
                            : DateTime.MinValue
                    });
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetActivityLogAsync", techId);
                throw;
            }

            return results;
        }

        public async Task<List<WeekJobDto>> GetWeekJobsAsync(string accMgr, string techId)
        {
            var results = new List<WeekJobDto>();

            try
            {
                using var con = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("dbo.GetCurrentWeekJobsList", con);

                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@AccMgr", accMgr);
                cmd.Parameters.AddWithValue("@TechID", techId);

                await con.OpenAsync();

                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    results.Add(new WeekJobDto
                    {
                        CallNbr = reader["CallNbr"]?.ToString(),
                        CustName = reader["CustName"]?.ToString(),
                        AccMgr = reader["AccMgr"]?.ToString(),
                        JobStatus = reader["JobStatus"]?.ToString(),
                        DateStatusChanged = reader["DateStatusChanged"] != DBNull.Value
                            ? Convert.ToDateTime(reader["DateStatusChanged"])
                            : DateTime.MinValue
                    });
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetWeekJobsAsync", techId);
                throw;
            }

            return results;
        }

        public async Task<MonthlyScheduledChartDto> GetMonthlyScheduledChartAsync(string accMgr, string techId)
        {
            var chart = new MonthlyScheduledChartDto();

            try
            {
                using var con = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("dbo.MonthlyScheduledGraph", con);

                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@AccMgr", accMgr);
                cmd.Parameters.AddWithValue("@TechID", techId);

                await con.OpenAsync();

                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    // ---- Same logic as your legacy code ----
                    if (reader["MonthNo"]?.ToString() == "0")
                        continue;   // Skip "Not Uploaded"

                    chart.Labels.Add(reader["MonthName"]?.ToString());
                    chart.Data.Add(Convert.ToInt32(reader["Jobs"]));
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetMonthlyScheduledChartAsync", techId);
                throw;
            }

            return chart;
        }

        public async Task<List<MenuLinkDto>> GetMenuLinksWithLoginAsync(string userId, int menuId)
        {
            var menuLinks = new List<MenuLinkDto>();

            try
            {
                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("GetLinkswithLogin", connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@UserID", userId);
                command.Parameters.AddWithValue("@MenuID", menuId);

                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    menuLinks.Add(new MenuLinkDto
                    {
                        Menu_ID = reader["Menu_ID"] != DBNull.Value ? Convert.ToInt32(reader["Menu_ID"]) : 0,
                        Menu_ParentID = reader["Menu_ParentID"] != DBNull.Value ? Convert.ToInt32(reader["Menu_ParentID"]) : null,
                        Menu_Name = reader["Menu_Name"] != DBNull.Value ? reader["Menu_Name"].ToString() : null,
                        Menu_Page_URL = reader["Menu_Page_URL"] != DBNull.Value ? reader["Menu_Page_URL"].ToString() : null
                    });
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetMenuLinksWithLoginAsync", userId);
                throw;
            }

            return menuLinks;
        }

    }
}
