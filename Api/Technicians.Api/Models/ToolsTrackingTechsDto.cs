namespace Technicians.Api.Models
{
    public class ToolsTrackingTechsDto
    {
        public string TechID { get; set; } = string.Empty;
        public string Techname { get; set; } = string.Empty;
    }

    public class TechToolSerialNoDto
    {
        public string SerialNo { get; set; } = string.Empty;
    }

    public class ToolsCalendarTrackingDto
    {
        public string EmpName { get; set; } = string.Empty;
        public string TechID { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public DateTime DueDt { get; set; }
    }

    public class ToolsCalendarDueCountsDto
    {
        public int Counter { get; set; }
        public int OverDue { get; set; }
        public int Due15 { get; set; }
        public int Due30 { get; set; }
        public int Due45 { get; set; }
        public int Due60 { get; set; }
    }

    public class ToolsCalendarTrackingResultDto
    {
        public List<ToolsCalendarTrackingDto> TrackingData { get; set; } = new List<ToolsCalendarTrackingDto>();
        public ToolsCalendarDueCountsDto DueCounts { get; set; } = new ToolsCalendarDueCountsDto();
    }
}