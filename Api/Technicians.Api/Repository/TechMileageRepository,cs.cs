using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface ITechMileageRepository
    {
        Task<PagedResult<TechMileageDto>> GetMileageReport(
            DateTime startDate,
            DateTime endDate,
            string techName,
            int pageNumber,
            int pageSize);
    }

    public class TechMileageRepository : ITechMileageRepository
    {
        private readonly string _connectionString;

        public TechMileageRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? 
                               throw new ArgumentNullException(nameof(configuration), "DefaultConnection string is required");
        }

        public async Task<PagedResult<TechMileageDto>> GetMileageReport(
            DateTime startDate,
            DateTime endDate,
            string techName,
            int pageNumber,
            int pageSize)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();   
            parameters.Add("@StartDate", startDate);
            parameters.Add("@EndDate", endDate);
            parameters.Add("@TechName", string.IsNullOrEmpty(techName) ? null : techName);

            // ?? STEP 1: Get full data using dynamic mapping
            var rawData = await connection.QueryAsync(
                "GetTechMileageReport",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Map the dynamic results to TechMileageDto with proper column name handling
            var data = rawData.Select(row =>
            {
                var dict = (IDictionary<string, object>)row;
                return new TechMileageDto
                {
                    Date = GetDateTimeValue(dict, "Date") ?? DateTime.MinValue,
                    JobNumber = GetStringValue(dict, "Job Number") ?? string.Empty,
                    TechName = GetStringValue(dict, "TechName") ?? string.Empty,
                    JobType = GetStringValue(dict, "Job Type") ?? string.Empty,
                    CustomerName = GetStringValue(dict, "Customer Name") ?? string.Empty,
                    Origin = GetFirstStringValue(dict, "Origin", "Orgin", "Origin Address", "origion") ?? string.Empty,
                    SiteAddress = GetStringValue(dict, "Site Address") ?? string.Empty,
                    MilesReported = GetDecimalValue(dict, "Miles Reported"),
                    TotalMinutes = GetIntValue(dict, "Total Minutes"),
                    HoursDecimal = GetDecimalValue(dict, "Hours (Decimal)"),
                    TimeTakenHHMM = GetStringValue(dict, "Time Taken (HH:MM)") ?? string.Empty
                };
            }).ToList();

            // ?? STEP 2: Total count
            var totalRecords = data.Count;

            // ?? STEP 3: Pagination
            var pagedData = data
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<TechMileageDto>
            {
                Data = pagedData,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        #region Helper Methods

        /// <summary>
        /// Safely extracts string value from dictionary with null checking and trimming
        /// </summary>
        private static string? GetStringValue(IDictionary<string, object> dict, string columnName)
        {
            var matchingKey = dict.Keys.FirstOrDefault(k => string.Equals(k, columnName, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(matchingKey) && dict[matchingKey] != null)
            {
                var value = dict[matchingKey].ToString()?.Trim();
                return string.IsNullOrEmpty(value) ? null : value;
            }
            return null;
        }

        /// <summary>
        /// Returns the first non-empty string value found among candidate column names
        /// </summary>
        private static string? GetFirstStringValue(IDictionary<string, object> dict, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                var value = GetStringValue(dict, columnName);
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
            return null;
        }

        /// <summary>
        /// Returns the first non-empty string value found among candidate column names
        /// </summary>
        private static string GetStringValue(IDictionary<string, object> dict, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                var value = GetStringValue(dict, columnName);
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
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

        #endregion
    }
}