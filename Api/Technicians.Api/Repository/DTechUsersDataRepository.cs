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
        /// <param name="request">Filter criteria for the search</param>
        /// <returns>DTechUsersDataResponse containing the filtered user data</returns>
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
        /// Gets a specific DTech user by login
        /// </summary>
        /// <param name="login">The login to search for</param>
        /// <returns>Single DTechUsersDataDto or null if not found</returns>
        //public async Task<DTechUsersDataDto?> GetDTechUserByLoginAsync(string login)
        //{
        //    try
        //    {
        //        var request = new DTechUsersDataRequest { Login = login };
        //        var response = await GetDTechUsersDataAsync(request);
        //        return response.UsersData.FirstOrDefault();
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error retrieving DTech user for login '{login}': {ex.Message}", ex);
        //    }
        //}

        ///// <summary>
        ///// Gets all DTech users without any filters
        ///// </summary>
        ///// <returns>All DTech users</returns>
        //public async Task<DTechUsersDataResponse> GetAllDTechUsersAsync()
        //{
        //    return await GetDTechUsersDataAsync(new DTechUsersDataRequest());
        //}

        ///// <summary>
        ///// Gets summary statistics for DTech users
        ///// </summary>
        ///// <returns>Summary statistics including user counts and activity data</returns>
        //public async Task<DTechUsersDataSummary> GetDTechUsersDataSummaryAsync()
        //{
        //    try
        //    {
        //        using var connection = new SqlConnection(_connectionString);
        //        await connection.OpenAsync();

        //        var summary = new DTechUsersDataSummary();

        //        // Get all users data for analysis
        //        var allUsers = await GetAllDTechUsersAsync();
        //        var users = allUsers.UsersData;

        //        summary.TotalUsers = users.Count;

        //        // Calculate active/inactive users (users who logged in within last 90 days)
        //        var cutoffDate = DateTime.Now.AddDays(-90);
        //        summary.ActiveUsers = users.Count(u => u.LastLoggedIn > cutoffDate && u.LastLoggedIn != DateTime.Parse("1900-01-01"));
        //        summary.InactiveUsers = summary.TotalUsers - summary.ActiveUsers;

        //        // Group by site
        //        summary.UsersBySite = users
        //            .Where(u => !string.IsNullOrEmpty(u.SiteID))
        //            .GroupBy(u => u.SiteID)
        //            .ToDictionary(g => g.Key, g => g.Count());

        //        // Get latest login date
        //        var validLogins = users.Where(u => u.LastLoggedIn != DateTime.Parse("1900-01-01"));
        //        summary.LastLoginDate = validLogins.Any() ? validLogins.Max(u => u.LastLoggedIn) : null;

        //        // Get oldest password date
        //        var validPasswords = users.Where(u => u.LastChangedPwd != DateTime.Parse("1900-01-01"));
        //        summary.OldestPasswordDate = validPasswords.Any() ? validPasswords.Min(u => u.LastChangedPwd) : null;

        //        return summary;
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error retrieving DTech users summary: {ex.Message}", ex);
        //    }
        //}

        ///// <summary>
        ///// Validates the DTechUsersDataRequest
        ///// </summary>
        ///// <param name="request">Request to validate</param>
        ///// <returns>List of validation errors</returns>
        //public List<string> ValidateRequest(DTechUsersDataRequest request)
        //{
        //    var errors = new List<string>();

        //    if (request == null)
        //    {
        //        errors.Add("Request cannot be null");
        //        return errors;
        //    }

        //    // Validate field lengths based on stored procedure parameters
        //    if (!string.IsNullOrEmpty(request.Login) && request.Login.Length > 35)
        //        errors.Add("Login cannot exceed 35 characters");

        //    if (!string.IsNullOrEmpty(request.SiteID) && request.SiteID.Length > 30)
        //        errors.Add("SiteID cannot exceed 30 characters");

        //    if (!string.IsNullOrEmpty(request.CustName) && request.CustName.Length > 50)
        //        errors.Add("CustName cannot exceed 50 characters");

        //    if (!string.IsNullOrEmpty(request.Address) && request.Address.Length > 50)
        //        errors.Add("Address cannot exceed 50 characters");

        //    if (!string.IsNullOrEmpty(request.Email) && request.Email.Length > 50)
        //        errors.Add("Email cannot exceed 50 characters");

        //    if (!string.IsNullOrEmpty(request.Contact) && request.Contact.Length > 50)
        //        errors.Add("Contact cannot exceed 50 characters");

        //    if (!string.IsNullOrEmpty(request.SVC_Serial_ID) && request.SVC_Serial_ID.Length > 30)
        //        errors.Add("SVC_Serial_ID cannot exceed 30 characters");

        //    return errors;
        //}

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
        ///// <summary>
        ///// Searches DTech users by multiple criteria
        ///// </summary>
        ///// <param name="searchTerm">General search term to look for across multiple fields</param>
        ///// <returns>Users matching the search criteria</returns>
        //public async Task<DTechUsersDataResponse> SearchDTechUsersAsync(string searchTerm)
        //{
        //    try
        //    {
        //        if (string.IsNullOrWhiteSpace(searchTerm))
        //        {
        //            return await GetAllDTechUsersAsync();
        //        }

        //        var searchPattern = $"%{searchTerm}%";
        //        var request = new DTechUsersDataRequest
        //        {
        //            Login = searchPattern,
        //            SiteID = searchPattern,
        //            CustName = searchPattern,
        //            Address = searchTerm, // Address doesn't use % pattern in SP
        //            Email = searchPattern,
        //            Contact = searchPattern,
        //            SVC_Serial_ID = searchPattern
        //        };

        //        return await GetDTechUsersDataAsync(request);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error searching DTech users with term '{searchTerm}': {ex.Message}", ex);
        //    }
        //}

        ///// <summary>
        ///// Checks if a user exists by login
        ///// </summary>
        ///// <param name="login">Login to check</param>
        ///// <returns>True if user exists</returns>
        //public async Task<bool> UserExistsAsync(string login)
        //{
        //    try
        //    {
        //        if (string.IsNullOrWhiteSpace(login))
        //            return false;

        //        var user = await GetDTechUserByLoginAsync(login);
        //        return user != null;
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error checking if user exists for login '{login}': {ex.Message}", ex);
        //    }
        //}
    }
}