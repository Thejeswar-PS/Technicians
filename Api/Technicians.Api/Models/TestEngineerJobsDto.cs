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