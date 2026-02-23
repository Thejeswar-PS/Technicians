using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for menu links retrieved from GetLinkswithLogin stored procedure
    /// </summary>
    public class MenuLinkDto
    {
        public int Menu_ID { get; set; }

        public int? Menu_ParentID { get; set; }

        public string Menu_Name { get; set; }

        public string Menu_Page_URL { get; set; }
    }

    /// <summary>
    /// Response DTO for menu links with login API
    /// </summary>
    public class MenuLinksResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public List<MenuLinkDto> Data { get; set; } = new List<MenuLinkDto>();

        [JsonPropertyName("userID")]
        public string? UserID { get; set; }

        [JsonPropertyName("menuID")]
        public int MenuID { get; set; }
    }
}
