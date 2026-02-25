namespace Technicians.Api.Models
{
    public class PartsTestStatusDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string SiteID { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string ManufPartNo { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;       
        public string QCWorkStatus { get; set; } = string.Empty;
        public string AssyWorkStatus { get; set; } = string.Empty;
        public bool IsPassed { get; set; }
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string ProblemNotes { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }
        public int RowIndex { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public string UniqueID { get; set; } = string.Empty;
    }

    public class PartsTestStatusRequest
    {
        public string? JobType { get; set; }
        public string? Priority { get; set; }
        public bool Archive { get; set; } = false;
        public string? Make { get; set; }
        public string? Model { get; set; }
        public string? AssignedTo { get; set; }  // ? ADD THIS MISSING PROPERTY
    }

    public class DropdownOptionDto
    {
        public string Value { get; set; } = string.Empty;
    }

    public class PartsTestStatusResponse
    {
        public List<PartsTestStatusDto> PartsTestData { get; set; } = new();
        public List<string> DistinctMakes { get; set; } = new();
        public List<string> DistinctModels { get; set; } = new();
    }

    // ADDED: Missing DTOs for dashboard functionality
    
    /// <summary>
    /// Dashboard data for Parts Test Status charts
    /// </summary>
    public class PartsTestDashboardDto
    {
        public PartsTestStatusCountsDto? StatusCounts { get; set; }
        public List<JobTypeCountDto> JobTypeDistribution { get; set; } = new();
    }

    /// <summary>
    /// Status counts for dashboard chart 1
    /// </summary>
    public class PartsTestStatusCountsDto
    {
        public int EmergencyCount { get; set; }
        public int OverdueCount { get; set; }
        public int SameDayCount { get; set; }
        public int CurrentWeekCount { get; set; }
    }

    /// <summary>
    /// Job type count for dashboard chart 2
    /// </summary>
    public class JobTypeCountDto
    {
        public string JobType { get; set; } = string.Empty;
        public int TotalCount { get; set; }
    }

    /// <summary>
    /// Individual parts test status item with business logic applied
    /// </summary>
    public class PartsTestStatusItemDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string SiteID { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string ManufPartNo { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string QCWorkStatus { get; set; } = string.Empty;
        public string AssyWorkStatus { get; set; } = string.Empty;
        public bool IsPassed { get; set; }
        public string ProblemNotes { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public int RowIndex { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }

        // Business logic properties
        public bool IsOverdue { get; set; }
        public bool IsDueSoon { get; set; }
        public bool IsUrgent { get; set; }
        public string CssClass { get; set; } = string.Empty;
    }

    /// <summary>
    /// Complete response for Parts Test Status with filters and data
    /// </summary>
    public class PartsTestStatusResponseDto
    {
        public List<PartsTestStatusItemDto> PartsData { get; set; } = new();
        public List<string> Makes { get; set; } = new();
        public List<string> Models { get; set; } = new();
        public List<string> AssignedToOptions { get; set; } = new();
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
    }
}