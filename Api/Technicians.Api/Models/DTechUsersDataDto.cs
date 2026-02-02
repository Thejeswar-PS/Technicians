using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for GetDTechUsersData stored procedure
    /// All parameters are optional with default values
    /// </summary>
    public class DTechUsersDataRequest
    {
        public string Login { get; set; } = "%";
        public string SiteID { get; set; } = "%";
        public string CustName { get; set; } = "%";
        public string Address { get; set; } = string.Empty;
        public string Email { get; set; } = "%";
        public string Contact { get; set; } = "%";
        public string SVC_Serial_ID { get; set; } = "%";
    }

    /// <summary>
    /// Main DTO for GetDTechUsersData stored procedure result
    /// Maps to the columns returned by the stored procedure
    /// </summary>
    public class DTechUsersDataDto
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string SiteID { get; set; } = string.Empty;
        public string CustName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime LastLoggedIn { get; set; }
        public DateTime LastChangedPwd { get; set; }
    }

    /// <summary>
    /// Response DTO for GetDTechUsersData endpoint
    /// </summary>
    public class DTechUsersDataResponse
    {
        public List<DTechUsersDataDto> UsersData { get; set; } = new();
        public int TotalRecords => UsersData.Count;
        public bool IsFiltered { get; set; } = false;
        public DTechUsersDataRequest? FilterCriteria { get; set; }
    }

    /// <summary>
    /// Summary statistics DTO for DTech users data
    /// </summary>
    public class DTechUsersDataSummary
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public Dictionary<string, int> UsersBySite { get; set; } = new();
        public DateTime? LastLoginDate { get; set; }
        public DateTime? OldestPasswordDate { get; set; }
    }
}