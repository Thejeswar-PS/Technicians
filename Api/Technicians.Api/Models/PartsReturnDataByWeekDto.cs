namespace Technicians.Api.Models
{
    public class PartsReturnDataByWeekDto
    {
        public int ID { get; set; }
        public string Service_Call_ID { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty;
        public string ReturnStatus { get; set; } = string.Empty;
        public int UnusedSentBack { get; set; }
        public int FaultySentBack { get; set; }
        public DateTime? LastModified { get; set; }
        public DateTime? CreateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string ModifiedBy { get; set; } = string.Empty;
        public string Comments { get; set; } = string.Empty;
        public string TrackingNumber { get; set; } = string.Empty;
        public string ShippingMethod { get; set; } = string.Empty;
        public DateTime? ShippedDate { get; set; }
        public string ReceivedBy { get; set; } = string.Empty;
        public DateTime? ReceivedDate { get; set; }
    }

    public class PartsReturnDataByWeekRequestDto
    {
        public int WeekNo { get; set; }
    }

    public class PartsReturnDataByWeekResponseDto
    {
        public List<PartsReturnDataByWeekDto> PartsReturnData { get; set; } = new List<PartsReturnDataByWeekDto>();
        public int TotalCount { get; set; }
        public int WeekNo { get; set; }
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public int TotalUnusedSentBack { get; set; }
        public int TotalFaultySentBack { get; set; }
    }
}