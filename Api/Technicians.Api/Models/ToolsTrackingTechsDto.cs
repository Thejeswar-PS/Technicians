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

    public class TechToolsMiscKitDto
    {
        public string ToolKitPNMisc { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TechValue { get; set; } = string.Empty;
        public int ColumnOrder { get; set; }
    }

    public class TechsInfoDto
    {
        // Add properties based on what GetTechInfoByTechID returns
        // Since the exact structure isn't provided, using common tech info fields
        public string TechID { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty;
        public string EmpName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    //public class TechToolsMiscKitResultDto
    //{
    //    public List<TechToolsMiscKitDto> ToolKitData { get; set; } = new List<TechToolsMiscKitDto>();
    //    public TechsInfoDto TechInfo { get; set; } = new TechsInfoDto();
    //}

    public class ToolsTrackingCountDto
    {
        public int Count { get; set; }
    }

    public class ExecuteInsertTechToolsQueryDto
    {
        public string Query { get; set; } = string.Empty;
    }

    public class ExecuteInsertTechToolsQueryResultDto
    {
        public bool Success { get; set; }
        public int ReturnValue { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class DeleteToolsTrackingResultDto
    {
        public int RowsAffected { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // New DTO for the complete ToolTracking table structure
    public class TechToolsTrackingDto
    {
        public string TechID { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public DateTime DueDt { get; set; }
        public int ColumnOrder { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Received { get; set; } = string.Empty;
        public string NewMTracking { get; set; } = string.Empty;
        public string OldMSerialNo { get; set; } = string.Empty;
        public string OldMTracking { get; set; } = string.Empty;
    }
}