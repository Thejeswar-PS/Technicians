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

        public JobRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");

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
                parameters.Add("@RBButton", rbButton);
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

    }
}
