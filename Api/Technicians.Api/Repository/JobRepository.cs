using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Xml.Linq;
using Technicians.Api.Models;



namespace Technicians.Api.Repository
{
    public class JobRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _eTechConnectionString;

        public JobRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _eTechConnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");

        }

        public List<JobDto> GetJobs(string empId, string mgrId, string techId, int rbButton, int currentYear, int month, out string errorMessage)
        {
            var jobs = new List<JobDto>();

            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@EmpID", empId);
                parameters.Add("@MgrID", mgrId);
                parameters.Add("@TechID", techId);
                parameters.Add("@rbButton", rbButton);
                parameters.Add("@CurrentYear", currentYear);
                parameters.Add("@Month", month);

                jobs = con.Query<JobDto>("etechGetJobs", parameters, commandType: CommandType.StoredProcedure).ToList();
            }

            errorMessage = null;
            return jobs;
        }

        public List<JobDto> GetSearchedJob(string jobId, string techId, string empId, out string errorMessage)
        {
            var jobs = new List<JobDto>();

            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@JobID", jobId);
                parameters.Add("@TechID", techId);
                parameters.Add("@EmpID", empId);

                jobs = con.Query<JobDto>("ETechShowSearchedJob", parameters, commandType: CommandType.StoredProcedure).ToList();
            }

            errorMessage = null;
            return jobs;
        }

        public async Task<List<GetCalenderJobDataVM>> GetCalenderJobData(DateTime startDate, DateTime endDate, string ownerId, string tech, string state, string type)
        {
            try
            {
                var parameter = new DynamicParameters();

                var daysInMonth = DateTime.DaysInMonth(startDate.Year, endDate.Month);
                endDate = startDate.AddDays(daysInMonth - 1);
                if (tech == "All")
                {
                    tech = "0";
                }
                parameter.Add("@pStartDate", startDate, DbType.String, ParameterDirection.Input);
                parameter.Add("@pEndDate", endDate, DbType.String, ParameterDirection.Input);
                parameter.Add("@pCalendarSelect", "Tech", DbType.String, ParameterDirection.Input);
                parameter.Add("@pTechFilter", tech, DbType.String, ParameterDirection.Input);
                parameter.Add("@pOffFilter", ownerId.Trim(), DbType.String, ParameterDirection.Input);
                parameter.Add("@State", state, DbType.String, ParameterDirection.Input);
                parameter.Add("@Status", type, DbType.String, ParameterDirection.Input);
                using (var connection = new SqlConnection(_eTechConnectionString))
                {

                    await connection.OpenAsync();
                    var results = await connection.QueryAsync<GetCalenderJobDataVM>("aaTechCalendar_Module_Updated", parameter, commandType: CommandType.StoredProcedure);
                    connection.Close();

                    return results.ToList();
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

    }
}
