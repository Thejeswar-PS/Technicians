using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class DTechUsersDataRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public DTechUsersDataRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets DTech users data based on the GetDTechUsersData stored procedure
        /// </summary>
        public async Task<DTechUsersDataResponse> GetDTechUsersDataAsync(DTechUsersDataRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Login", request.Login ?? "%", DbType.AnsiString, size: 35);
                parameters.Add("@SiteID", request.SiteID ?? "%", DbType.AnsiString, size: 30);
                parameters.Add("@Custname", request.CustName ?? "%", DbType.AnsiString, size: 50);
                parameters.Add("@Address", request.Address ?? string.Empty, DbType.AnsiString, size: 50);
                parameters.Add("@Email", request.Email ?? "%", DbType.AnsiString, size: 50);
                parameters.Add("@Contact", request.Contact ?? "%", DbType.AnsiString, size: 50);
                parameters.Add("@SVC_Serial_ID", request.SVC_Serial_ID ?? "%", DbType.AnsiString, size: 30);

                var usersData = await connection.QueryAsync<DTechUsersDataDto>(
                    "GetDTechUsersData", 
                    parameters, 
                    commandType: CommandType.StoredProcedure);

                var response = new DTechUsersDataResponse
                {
                    UsersData = usersData.ToList(),
                    IsFiltered = IsRequestFiltered(request),
                    FilterCriteria = request
                };

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving DTech users data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving DTech users data: {ex.Message}", ex);
            }
        }

        

        /// <summary>
        /// Checks if the request contains any search filters
        /// </summary>
        /// <param name="request">Request to check</param>
        /// <returns>True if any filters are applied</returns>
        private static bool IsRequestFiltered(DTechUsersDataRequest request)
        {
            return !string.IsNullOrEmpty(request.Login) && request.Login != "%" ||
                   !string.IsNullOrEmpty(request.SiteID) && request.SiteID != "%" ||
                   !string.IsNullOrEmpty(request.CustName) && request.CustName != "%" ||
                   !string.IsNullOrEmpty(request.Address) ||
                   !string.IsNullOrEmpty(request.Email) && request.Email != "%" ||
                   !string.IsNullOrEmpty(request.Contact) && request.Contact != "%" ||
                   !string.IsNullOrEmpty(request.SVC_Serial_ID) && request.SVC_Serial_ID != "%";
        }
        // Add this method to DTechUsersDataRepository
        public IEnumerable<string> ValidateRequest(DTechUsersDataRequest request)
        {
            var errors = new List<string>();

            if (request == null)
            {
                errors.Add("Request cannot be null.");
                return errors;
            }

            // Example validation: ensure at least one filter is not a wildcard
            if ((request.Login == "%" || string.IsNullOrWhiteSpace(request.Login)) &&
                (request.SiteID == "%" || string.IsNullOrWhiteSpace(request.SiteID)) &&
                (request.CustName == "%" || string.IsNullOrWhiteSpace(request.CustName)) &&
                (request.Address == string.Empty || string.IsNullOrWhiteSpace(request.Address)) &&
                (request.Email == "%" || string.IsNullOrWhiteSpace(request.Email)) &&
                (request.Contact == "%" || string.IsNullOrWhiteSpace(request.Contact)) &&
                (request.SVC_Serial_ID == "%" || string.IsNullOrWhiteSpace(request.SVC_Serial_ID)))
            {
                errors.Add("At least one filter must be specified.");
            }

            // Add more validation rules as needed

            return errors;
        }
    }
}