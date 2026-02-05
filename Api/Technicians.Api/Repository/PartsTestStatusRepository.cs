using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsTestStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public PartsTestStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets parts test status data using the GetPartsTestStatus stored procedure
        /// </summary>
        /// <param name="request">Filter parameters for the stored procedure</param>
        /// <returns>Complete response with parts data, makes, and models</returns>
        public async Task<PartsTestStatusResponse> GetPartsTestStatusAsync(PartsTestStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@JobType", string.IsNullOrEmpty(request.JobType) || request.JobType == "All" ? string.Empty : request.JobType, DbType.AnsiStringFixedLength, size: 5);
                parameters.Add("@Priority", string.IsNullOrEmpty(request.Priority) || request.Priority == "All" ? string.Empty : request.Priority, DbType.AnsiStringFixedLength, size: 15);
                parameters.Add("@Archive", request.Archive, DbType.Boolean);
                parameters.Add("@Make", string.IsNullOrEmpty(request.Make) || request.Make == "All" ? string.Empty : request.Make, DbType.String, size: 50);
                parameters.Add("@Model", string.IsNullOrEmpty(request.Model) || request.Model == "All" ? string.Empty : request.Model, DbType.String, size: 50);
                parameters.Add("@AssignedTo", string.IsNullOrEmpty(request.AssignedTo) || request.AssignedTo == "All" ? string.Empty : request.AssignedTo, DbType.String, size: 50);

                // Execute stored procedure and get multiple result sets
                using var multi = await connection.QueryMultipleAsync("GetPartsTestStatus", parameters, commandType: CommandType.StoredProcedure);

                var response = new PartsTestStatusResponse();

                // First result set: Parts test data
                response.PartsTestData = (await multi.ReadAsync<PartsTestStatusDto>()).ToList();

                // Second result set: Distinct Makes
                response.DistinctMakes = (await multi.ReadAsync<MakeModelDto>()).ToList();

                // Third result set: Distinct Models  
                response.DistinctModels = (await multi.ReadAsync<MakeModelDto>()).ToList();

                return response;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving parts test status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets parts test status data with default parameters
        /// </summary>
        /// <returns>Complete response with all unarchived parts data</returns>
        public async Task<PartsTestStatusResponse> GetPartsTestStatusAsync()
        {
            var defaultRequest = new PartsTestStatusRequest
            {
                JobType = string.Empty,
                Priority = string.Empty,
                Archive = false,
                Make = string.Empty,
                Model = string.Empty,
                AssignedTo = string.Empty
            };

            return await GetPartsTestStatusAsync(defaultRequest);
        }

        /// <summary>
        /// Gets only distinct makes from PartsTestList
        /// </summary>
        /// <returns>List of distinct makes</returns>
        public async Task<IEnumerable<MakeModelDto>> GetDistinctMakesAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT Make 
                    FROM dbo.PartsTestList 
                    WHERE Make IS NOT NULL AND Make <> '' AND Archive = 0
                    ORDER BY Make";

                var makes = await connection.QueryAsync<MakeModelDto>(query);
                return makes;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving distinct makes: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets only distinct models from PartsTestList
        /// </summary>
        /// <returns>List of distinct models</returns>
        public async Task<IEnumerable<MakeModelDto>> GetDistinctModelsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT Model as Make
                    FROM dbo.PartsTestList 
                    WHERE Model IS NOT NULL AND Model <> '' AND Archive = 0
                    ORDER BY Model";

                var models = await connection.QueryAsync<MakeModelDto>(query);
                return models;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving distinct models: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets distinct models filtered by make
        /// </summary>
        /// <param name="make">Make to filter models by</param>
        /// <returns>List of distinct models for the specified make</returns>
        public async Task<IEnumerable<MakeModelDto>> GetDistinctModelsByMakeAsync(string make)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT Model as Make
                    FROM dbo.PartsTestList 
                    WHERE Model IS NOT NULL AND Model <> '' AND Archive = 0
                    AND (@Make = '' OR Make = @Make)
                    ORDER BY Model";

                var parameters = new DynamicParameters();
                parameters.Add("@Make", make ?? string.Empty, DbType.String);

                var models = await connection.QueryAsync<MakeModelDto>(query, parameters);
                return models;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving distinct models for make '{make}': {ex.Message}", ex);
            }
        }
    }
}