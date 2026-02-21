namespace Technicians.Api.Models
{
    /// Request DTO for TestEngineerJobs filtering
    public class TestEngineerJobsRequestDto
    {
        public string? Engineer { get; set; }
        public string? Status { get; set; }
        public string? Location { get; set; }
        public string? Search { get; set; }
        public string SortColumn { get; set; } = "RowID";
        public string SortDirection { get; set; } = "DESC";
    }

    /// DTO representing a TestEngineerJob record
    public class TestEngineerJobDto
    {
        public int RowID { get; set; }

        // public string JobNumberFormatted { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public string JobNumber { get; set; } = string.Empty;
        public string AssignedEngineer { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string WorkType { get; set; } = string.Empty;

        public DateTime? ProjectedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? EmergencyETA { get; set; }
        public DateTime? CreatedOn { get; set; }

        public string Description { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public bool QC_Cleaned { get; set; }
        public bool QC_Torque { get; set; }
        public bool QC_Inspected { get; set; }
        public bool IsOverdue { get; set; }
        public bool IsEmergency { get; set; }
    }

    /// DTO for creating and updating TestEngineerJobs entries
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

    /// DTO for TestEngineerJobs entry details (for editing)
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

    /// Response wrapper for TestEngineerJobs entry operations
    public class TestEngineerJobsEntryResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public TestEngineerJobsEntryDto? Data { get; set; }
    }

    /// Request for getting next RowID
    public class NextRowIdResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public int NextRowId { get; set; }
        public string FormattedRowId { get; set; } = string.Empty; // ?? ADD: Formatted version
    }

    /// Response wrapper for TestEngineerJobs
    public class TestEngineerJobsResponse
    {
         
        public bool Success { get; set; } = true;
        public string? Message { get; set; }
        public List<TestEngineerJobDto> Data { get; set; } = new();
        public int TotalRecords { get; set; }
    }

    /// DTO for Engineer dropdown
    public class EngineerDto
    {
        public string EmpName { get; set; } = string.Empty;
    }

    /// Chart data DTOs
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

    /// Chart response wrapper
    public class TestEngineerJobsChartsResponse
    {
        public List<EngineerChartDto> EngineerData { get; set; } = new List<EngineerChartDto>();
        public List<StatusChartDto> StatusData { get; set; } = new List<StatusChartDto>();
    }

}