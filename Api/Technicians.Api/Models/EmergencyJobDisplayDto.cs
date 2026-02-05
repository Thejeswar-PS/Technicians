    namespace Technicians.Api.Models
{
    public class EmergencyJobDto
    {
        public string Callnbr { get; set; } = string.Empty;
        public string Offid { get; set; } = string.Empty;
        public string Techid { get; set; } = string.Empty;
        public string CUSTNMBR { get; set; } = string.Empty;
        public string CUSTNAME { get; set; } = string.Empty;
        public string CITY { get; set; } = string.Empty;
        public string STATE { get; set; } = string.Empty;
        public DateTime? DISPDTE { get; set; }
        public string AccountManager { get; set; } = string.Empty;
        public string NAME { get; set; } = string.Empty;  // Technician Name
        public DateTime? ChangeDate { get; set; }
        
        // Consider using JsonPropertyName or Dapper column mapping for case sensitivity
        [System.Text.Json.Serialization.JsonPropertyName("priorityLevel")]
        public string PriorityLevel { get; set; } = string.Empty;
        
        public string JobStatus { get; set; } = string.Empty;
        public int ChangeAge { get; set; }
    }
    public class EmergencyJobsResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<EmergencyJobDto> EmergencyJobs { get; set; } = new List<EmergencyJobDto>();
        public int TotalRecords => EmergencyJobs?.Count ?? 0;
    }
}