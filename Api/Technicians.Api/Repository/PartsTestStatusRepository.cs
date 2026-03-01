using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsTestStatusRepository
    {
        private readonly string _connectionString;

        public PartsTestStatusRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string not found");
        }

        public async Task<PartsTestStatusResponse> GetPartsTestStatusAsync(PartsTestStatusRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();

            parameters.Add("@JobType",
                string.IsNullOrWhiteSpace(request.JobType) || request.JobType == "All"
                    ? string.Empty : request.JobType,
                DbType.AnsiStringFixedLength, size: 5);

            parameters.Add("@Priority",
                string.IsNullOrWhiteSpace(request.Priority) || request.Priority == "All"
                    ? string.Empty : request.Priority,
                DbType.AnsiStringFixedLength, size: 15);

            parameters.Add("@Archive", request.Archive, DbType.Boolean);

            parameters.Add("@Make",
                string.IsNullOrWhiteSpace(request.Make) || request.Make == "All"
                    ? string.Empty : request.Make,
                DbType.String, size: 50);

            parameters.Add("@Model",
                string.IsNullOrWhiteSpace(request.Model) || request.Model == "All"
                    ? string.Empty : request.Model,
                DbType.String, size: 50);

            parameters.Add("@AssignedTo",
                string.IsNullOrWhiteSpace(request.AssignedTo) || request.AssignedTo == "All"
                    ? string.Empty : request.AssignedTo,
                DbType.String, size: 50);

            // Execute stored procedure and get multiple result sets
            using var multi = await connection.QueryMultipleAsync("GetPartsTestStatus", parameters, commandType: CommandType.StoredProcedure);

            var response = new PartsTestStatusResponse();

            // First result set: Parts test data
            response.PartsTestData = (await multi.ReadAsync<PartsTestStatusDto>()).ToList();

            // Second result set: Distinct Makes
            response.DistinctMakes = (await multi.ReadAsync<string>()).ToList();

            // Third result set: Distinct Models
            response.DistinctModels = (await multi.ReadAsync<string>()).ToList();

            return response;
        }

        /// <summary>
        /// Gets ALL parts test status data with no filters (unarchived only)
        /// </summary>
        /// <returns>All unarchived parts test status records</returns>
        public async Task<PartsTestStatusResponse> GetAllPartsTestStatusAsync()
        {
            var defaultRequest = new PartsTestStatusRequest
            {
                JobType = null,
                Priority = null,
                Archive = false,  // Only unarchived
                Make = null,
                Model = null,
                AssignedTo = null
            };

            return await GetPartsTestStatusAsync(defaultRequest);
        }

        /// <summary>
        /// Gets dashboard data for Parts Test Status charts - MATCHES LEGACY FUNCTIONALITY
        /// Returns data from Tables 4 and 5 of GetPartsTestStatus stored procedure
        /// </summary>
        public async Task<PartsTestDashboardDto> GetPartsTestStatusDashboardAsync(PartsTestStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("GetPartsTestStatus", connection);
                command.CommandType = CommandType.StoredProcedure;
                
                // Convert request to legacy parameters exactly like legacy DAL
                command.Parameters.AddWithValue("@JobType", string.IsNullOrEmpty(request.JobType) ? "" : request.JobType);
                command.Parameters.AddWithValue("@Priority", string.IsNullOrEmpty(request.Priority) || request.Priority == "All" ? "" : request.Priority);
                command.Parameters.AddWithValue("@Archive", request.Archive ? "1" : "0");
                command.Parameters.AddWithValue("@Make", string.IsNullOrEmpty(request.Make) ? "" : request.Make);
                command.Parameters.AddWithValue("@Model", string.IsNullOrEmpty(request.Model) ? "" : request.Model);
                command.Parameters.AddWithValue("@AssignedTo", string.IsNullOrEmpty(request.AssignedTo) ? "" : request.AssignedTo);

                using var adapter = new SqlDataAdapter(command);
                var dataSet = new DataSet();
                adapter.Fill(dataSet);

                var dashboard = new PartsTestDashboardDto();

                // Chart 1: Status counts (from table index 4 like legacy)
                if (dataSet.Tables.Count >= 5 && dataSet.Tables[4].Rows.Count > 0)
                {
                    var row = dataSet.Tables[4].Rows[0];
                    dashboard.StatusCounts = new PartsTestStatusCountsDto
                    {
                        EmergencyCount = Convert.ToInt32(row["EmergencyCount"] ?? 0),
                        OverdueCount = Convert.ToInt32(row["OverdueCount"] ?? 0),
                        SameDayCount = Convert.ToInt32(row["SameDayCount"] ?? 0),
                        CurrentWeekCount = Convert.ToInt32(row["CurrentWeekCount"] ?? 0)
                    };
                }

                // Chart 2: Job type distribution (from table index 5 like legacy)
                if (dataSet.Tables.Count > 5 && dataSet.Tables[5].Rows.Count > 0)
                {
                    dashboard.JobTypeDistribution = new List<JobTypeCountDto>();
                    foreach (DataRow row in dataSet.Tables[5].Rows)
                    {
                        dashboard.JobTypeDistribution.Add(new JobTypeCountDto
                        {
                            JobType = row["JobType"]?.ToString() ?? "",
                            TotalCount = Convert.ToInt32(row["TotalCount"] ?? 0)
                        });
                    }
                }

                return dashboard;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving dashboard data: {ex.Message}", ex);
            }
        }

    }
}