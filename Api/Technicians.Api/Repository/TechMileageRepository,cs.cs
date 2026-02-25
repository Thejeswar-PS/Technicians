using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class TechMileageRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public TechMileageRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        /// <summary>
        /// Gets tech mileage report data using the GetTechMileageReport stored procedure
        /// </summary>
        public async Task<TechMileageResponseDto> GetTechMileageReportAsync(TechMileageRequestDto request)
        {
            var response = new TechMileageResponseDto();

            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@StartDate", request.StartDate, DbType.String);
                parameters.Add("@EndDate", request.EndDate, DbType.String);
                parameters.Add("@TechName", string.IsNullOrEmpty(request.TechName) ? (object)DBNull.Value : request.TechName, DbType.String);

                var mileageRecords = await connection.QueryAsync(
                    "GetTechMileageReport",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // Map records using exact stored procedure column names
                response.MileageRecords = mileageRecords.Select(row =>
                {
                    var dict = (IDictionary<string, object>)row;

                    return new TechMileageRecordDto
                    {
                        CallNbr = GetStringValue(dict, "Job Number"),
                        TechName = GetStringValue(dict, "TechName"),
                        CustName = GetStringValue(dict, "Customer Name"),
                        Address = GetStringValue(dict, "Site Address"),
                        StartDate = GetDateTimeValue(dict, "Date"),
                        MilesReported = GetDecimalValue(dict, "Miles Reported"),
                        HoursDecimal = GetDecimalValue(dict, "Hours (Decimal)"),
                        JobType = GetStringValue(dict, "Job Type"),
                        TotalMinutes = GetIntValue(dict, "Total Minutes"),
                        TimeTaken = GetStringValue(dict, "Time Taken (HH:MM)")
                    };
                }).ToList();

                // Calculate summary statistics
                if (response.MileageRecords.Any())
                {
                    response.TotalMiles = response.MileageRecords.Sum(r => r.MilesReported);
                    response.TotalHours = response.MileageRecords.Sum(r => r.HoursDecimal);
                    response.TotalJobs = response.MileageRecords.Count;
                }

                // Get monthly summary for charts
                response.MonthlySummary = await GetTechMileageMonthlySummaryAsync(request);

                response.Success = true;
                response.Message = "Tech mileage report retrieved successfully";
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = $"Error retrieving tech mileage report: {ex.Message}";
                response.MileageRecords = new List<TechMileageRecordDto>();
                response.MonthlySummary = new List<TechMileageMonthlySummaryDto>();
            }

            return response;
        }

        /// <summary>
        /// Gets monthly summary data for chart using GetTechMileageMonthlySummary stored procedure
        /// </summary>
        public async Task<List<TechMileageMonthlySummaryDto>> GetTechMileageMonthlySummaryAsync(TechMileageRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@StartDate", request.StartDate, DbType.String);
                parameters.Add("@EndDate", request.EndDate, DbType.String);
                parameters.Add("@TechName", string.IsNullOrEmpty(request.TechName) ? (object)DBNull.Value : request.TechName, DbType.String);

                var monthlySummary = await connection.QueryAsync(
                    "GetTechMileageMonthlySummary",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return monthlySummary.Select(row =>
                {
                    var dict = (IDictionary<string, object>)row;
                    return new TechMileageMonthlySummaryDto
                    {
                        Month = GetStringValue(dict, "Month") ??
                               GetStringValue(dict, "MonthName") ??
                               GetStringValue(dict, "Month_Name") ?? "",
                        TotalMiles = GetIntValueOrNull(dict, "TotalMiles") ??
                                    GetIntValueOrNull(dict, "Total_Miles") ??
                                    GetIntValueOrNull(dict, "Miles") ?? 0,
                        TotalHours = GetDecimalValueOrNull(dict, "TotalHours") ??
                                    GetDecimalValueOrNull(dict, "Total_Hours") ??
                                    GetDecimalValueOrNull(dict, "Hours") ?? 0
                    };
                }).ToList();
            }
            catch (Exception ex)
            {
                // Log error and return empty list
                Console.WriteLine($"ERROR in GetTechMileageMonthlySummaryAsync: {ex.Message}");
                return new List<TechMileageMonthlySummaryDto>();
            }
        }

        /// <summary>
        /// Gets list of technicians using existing etechTechNames stored procedure
        /// </summary>
        public async Task<List<TechMileageTechnicianDto>> GetTechniciansAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var technicians = await connection.QueryAsync<TechMileageTechnicianDto>(
                "etechTechNames",
                commandType: CommandType.StoredProcedure
            );

            var techList = technicians.ToList();

            // Add "All" option at the beginning for filtering
            techList.Insert(0, new TechMileageTechnicianDto
            {
                TechID = "ALL",
                TechName = "All"
            });

            return techList;
        }

        /// <summary>
        /// DEBUG: Gets raw stored procedure data to see exact column names and values
        /// </summary>
        public async Task<List<Dictionary<string, object>>> GetRawStoredProcedureDataAsync(TechMileageRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", request.StartDate, DbType.String);
            parameters.Add("@EndDate", request.EndDate, DbType.String);
            parameters.Add("@TechName", string.IsNullOrEmpty(request.TechName) ? (object)DBNull.Value : request.TechName, DbType.String);

            var rawData = await connection.QueryAsync(
                "GetTechMileageReport",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var result = new List<Dictionary<string, object>>();

            foreach (var row in rawData)
            {
                var dict = (IDictionary<string, object>)row;
                var rowDict = new Dictionary<string, object>();

                foreach (var kvp in dict)
                {
                    rowDict[kvp.Key] = kvp.Value;
                }

                result.Add(rowDict);
            }

            return result;
        }

        #region Helper Methods

        /// <summary>
        /// Safely extracts string value from dictionary with null checking and trimming
        /// </summary>
        private static string GetStringValue(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                var value = dict[columnName].ToString()?.Trim();
                return string.IsNullOrEmpty(value) ? "" : value;
            }
            return "";
        }

        /// <summary>
        /// Safely extracts decimal value from dictionary with null checking and parsing
        /// Returns 0 if not found or invalid
        /// </summary>
        private static decimal GetDecimalValue(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                if (decimal.TryParse(dict[columnName].ToString(), out decimal result))
                {
                    return result;
                }
            }
            return 0;
        }

        /// <summary>
        /// Safely extracts integer value from dictionary with null checking and parsing
        /// Returns 0 if not found or invalid
        /// </summary>
        private static int GetIntValue(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                if (int.TryParse(dict[columnName].ToString(), out int result))
                {
                    return result;
                }
            }
            return 0;
        }

        /// <summary>
        /// Safely extracts DateTime value from dictionary with null checking and parsing
        /// Returns null if not found or invalid
        /// </summary>
        private static DateTime? GetDateTimeValue(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                if (DateTime.TryParse(dict[columnName].ToString(), out DateTime result))
                {
                    return result;
                }
            }
            return null;
        }

        /// <summary>
        /// Nullable version of GetIntValue for optional fields
        /// Returns null if not found or invalid
        /// </summary>
        private static int? GetIntValueOrNull(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                if (int.TryParse(dict[columnName].ToString(), out int result))
                {
                    return result;
                }
            }
            return null;
        }

        /// <summary>
        /// Nullable version of GetDecimalValue for optional fields
        /// Returns null if not found or invalid
        /// </summary>
        private static decimal? GetDecimalValueOrNull(IDictionary<string, object> dict, string columnName)
        {
            if (dict.ContainsKey(columnName) && dict[columnName] != null)
            {
                if (decimal.TryParse(dict[columnName].ToString(), out decimal result))
                {
                    return result;
                }
            }
            return null;
        }

        #endregion
    }
}