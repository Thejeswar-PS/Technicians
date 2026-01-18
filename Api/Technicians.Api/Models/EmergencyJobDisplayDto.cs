namespace Technicians.Api.Models
{
    public class EmergencyJobDto
    {
        public string Callnbr { get; set; }
        public string Offid { get; set; }
        public string Techid { get; set; }
        public string CUSTNMBR { get; set; }
        public string CUSTNAME { get; set; }
        public string CITY { get; set; }
        public string STATE { get; set; }
        public DateTime? DISPDTE { get; set; }
        public string AccountManager { get; set; }
        public string NAME { get; set; }  // Technician Name
        public DateTime? ChangeDate { get; set; }
        public string PriorityLevel { get; set; }
        public string JobStatus { get; set; }
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