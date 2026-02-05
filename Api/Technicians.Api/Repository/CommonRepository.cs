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

        public CommonRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        public async Task<List<AccountManagerVM>> GetAccountManagers()
        {
            var managers = new List<AccountManagerVM>();

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

            return managers;
        }

        public async Task<IEnumerable<dynamic>> GetTechNamesByEmpIDAsync(string empId, string empType)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            var parameters = new DynamicParameters();
            parameters.Add("@EmpId", empId);
            parameters.Add("@EmpType", empType);

            var result = await connection.QueryAsync("GetTechNamesByEmpID", parameters, commandType: CommandType.StoredProcedure);
            return result;
        }

        public async Task<IEnumerable<dynamic>> GetEmployeeStatusForJobListAsync(string adUserId)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            var parameters = new DynamicParameters();
            parameters.Add("@ADUserID", adUserId);

            var result = await connection.QueryAsync("GetEmployeeStatusForJobList", parameters, commandType: CommandType.StoredProcedure);
            return result;
        }

        public async Task<int> GetEmpLevel(string empName)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            using var command = new SqlCommand("SpGetEmpLevel", connection);
            command.CommandType = System.Data.CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@EmpName", empName);

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt32(result);
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
            catch
            {
                
            }

            return technicians;
        }

        public async Task<List<GetStateVM>> GetStates()
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

        public async Task<TechKpiDto> GetKpisAsync(string pOffid, string techId, string yearType)
        {
            var result = new TechKpiDto();

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

            return result;
        }

        public async Task<List<TechActivityLogDto>> GetActivityLogAsync(string accMgr, string techId)
        {
            var results = new List<TechActivityLogDto>();

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

            return results;
        }

        public async Task<List<WeekJobDto>> GetWeekJobsAsync(string accMgr, string techId)
        {
            var results = new List<WeekJobDto>();

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
                    CustNbr = reader["CustNbr"]?.ToString(),
                    CustName = reader["CustName"]?.ToString(),
                    TechID = reader["TechID"]?.ToString(),
                    TechName = reader["TechName"]?.ToString(),
                    AccMgr = reader["AccMgr"]?.ToString(),
                    Status = reader["Status"]?.ToString(),
                    ScheduledDate = reader["ScheduledDate"] != DBNull.Value
                        ? Convert.ToDateTime(reader["ScheduledDate"])
                        : DateTime.MinValue
                });
            }

            return results;
        }

        public async Task<MonthlyScheduledChartDto> GetMonthlyScheduledChartAsync(string accMgr, string techId)
        {
            var chart = new MonthlyScheduledChartDto();

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

            return chart;
        }

    }
}
