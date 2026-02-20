namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for TestEngineerJobs filtering
    /// </summary>
    public class TestEngineerJobsRequestDto
    {
        public string Engineer { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Search { get; set; } = string.Empty;
        public string SortColumn { get; set; } = "ProjectedDate";
        public string SortDirection { get; set; } = "DESC";
    }

    /// <summary>
    /// DTO representing a TestEngineerJob record
    /// </summary>
    public class TestEngineerJobDto
    {
        public string JobNumber { get; set; } = string.Empty;
        public string AssignedEngineer { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string WorkType { get; set; } = string.Empty;
        public DateTime? ProjectedDate { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public bool IsOverdue { get; set; }
        public bool IsEmergency { get; set; }
    }

    /// <summary>
    /// DTO for creating and updating TestEngineerJobs entries
    /// </summary>
    public class SaveUpdateTestEngineerJobsDto
    {
        public int RowID { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string WorkType { get; set; } = string.Empty;
        public DateTime? EmergencyETA { get; set; }
        public string AssignedEngineer { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime? ProjectedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string DescriptionNotes { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool QCCleaned { get; set; }
        public bool QCTorque { get; set; }
        public bool QCInspected { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string ModifiedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for TestEngineerJobs entry details (for editing)
    /// </summary>
    public class TestEngineerJobsEntryDto
    {
        public int RowID { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string WorkType { get; set; } = string.Empty;
        public string AssignedEngineer { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ProjectedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? EmergencyETA { get; set; }
        public string DescriptionNotes { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool QC_Cleaned { get; set; }
        public bool QC_Torque { get; set; }
        public bool QC_Inspected { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string ModifiedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response wrapper for TestEngineerJobs entry operations
    /// </summary>
    public class TestEngineerJobsEntryResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public TestEngineerJobsEntryDto? Data { get; set; }
    }

    /// <summary>
    /// Request for getting next RowID
    /// </summary>
    public class NextRowIdResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public int NextRowId { get; set; }
    }

    /// <summary>
    /// Response wrapper for TestEngineerJobs
    /// </summary>
    public class TestEngineerJobsResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public List<TestEngineerJobDto> Data { get; set; } = new List<TestEngineerJobDto>();
        public int TotalRecords { get; set; }
    }

    /// <summary>
    /// DTO for Engineer dropdown
    /// </summary>
    public class EngineerDto
    {
        public string EmpName { get; set; } = string.Empty;
    }

    /// <summary>
    /// Chart data DTOs
    /// </summary>
    public class EngineerChartDto
    {
        public string Engineer { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class StatusChartDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    /// <summary>
    /// Chart response wrapper
    /// </summary>
    public class TestEngineerJobsChartsResponse
    {
        public List<EngineerChartDto> EngineerData { get; set; } = new List<EngineerChartDto>();
        public List<StatusChartDto> StatusData { get; set; } = new List<StatusChartDto>();
    }
}