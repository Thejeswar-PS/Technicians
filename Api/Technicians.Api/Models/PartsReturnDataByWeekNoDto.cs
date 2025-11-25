namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for parts return data by week number from GetPartsReturnDataByWeekNo stored procedure
    /// </summary>
    public class PartsReturnDataByWeekNoDto
    {
        public string Service_Call_ID { get; set; } = string.Empty;
        public int UnusedSentBack { get; set; }
        public int FaultySentBack { get; set; }
        public string ReturnStatus { get; set; } = string.Empty;
        public string ReturnNotes { get; set; } = string.Empty;
        public int TruckStock { get; set; }
        public string TechName { get; set; } = string.Empty;
        public string Maint_Auth_ID { get; set; } = string.Empty;
        public DateTime? LastModified { get; set; }
    }
}