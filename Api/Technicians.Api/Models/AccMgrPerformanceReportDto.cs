using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    // =========================
    // BASE CALL STATUS (matches @CallStatus)
    // =========================
    public class AccMgrCallStatusDto
    {
        public string CallNbr { get; set; }
        public string CustNmbr { get; set; }
        public string OffId { get; set; }
        public string JobStatus { get; set; }
        public DateTime ResponseDate { get; set; }
        public DateTime ScheduledStart { get; set; }
        public DateTime ScheduledEnd { get; set; }
        public DateTime Returned { get; set; }
        public DateTime InvoiceDate { get; set; }
        public decimal InvoiceAmount { get; set; }
        public decimal InvoiceTotal { get; set; }
        public string JobType { get; set; }
        public decimal TotalAmount { get; set; }
        public string TechName { get; set; }
        public string CustClas { get; set; }
        public string CustName { get; set; }
        public string ContractNo { get; set; }
        public string Description { get; set; }
        public int ChangeAge { get; set; }
        public int OrigAge { get; set; }
    }

    // =========================
    // DTOs WITH ChangeAge1
    // =========================
    public class AccMgrReturnedForProcessingDto : AccMgrCallStatusDto
    {
        public int ChangeAge1 { get; set; }
    }

    public class AccMgrJobsScheduledTodayDto : AccMgrCallStatusDto
    {
        public int ChangeAge1 { get; set; }
    }

    public class AccMgrJobsConfirmedNext120HoursDto : AccMgrCallStatusDto
    {
        public int ChangeAge1 { get; set; }
    }

    // =========================
    // UNSCHEDULED / MONTHLY DTO
    // =========================
    public class AccMgrUnscheduledJobDto
    {
        public string CallNbr { get; set; }
        public string CustNmbr { get; set; }
        public string CustName { get; set; }
        public string SiteContact { get; set; }
        public string City { get; set; }
        public string JobStatus { get; set; }
        public DateTime ScheduledStart { get; set; }
        public string Description { get; set; }
        public int ChangeAge { get; set; }
        public int OrigAge { get; set; }
    }

    // =========================
    // MASTER RESPONSE DTO - Enhanced for Role-Based Filtering
    // =========================
    public class AccMgrPerformanceReportResponseDto
    {
        public string OfficeId { get; set; }
        public string ROJobs { get; set; }
        public DateTime GeneratedAt { get; set; }

        // Enhanced properties for role-based filtering metadata
        public string RequestedBy { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public bool IsFiltered { get; set; } = false;
        public string FilterCriteria { get; set; } = string.Empty;

        // Main data collections
        public List<AccMgrCallStatusDto> CompletedNotReturned { get; set; } = new();
        public List<AccMgrReturnedForProcessingDto> ReturnedForProcessing { get; set; } = new();
        public List<AccMgrJobsScheduledTodayDto> JobsScheduledToday { get; set; } = new();
        public List<AccMgrJobsConfirmedNext120HoursDto> JobsConfirmedNext120Hours { get; set; } = new();
        public List<AccMgrCallStatusDto> ReturnedWithIncompleteData { get; set; } = new();

        public List<AccMgrUnscheduledJobDto> PastDueUnscheduled { get; set; } = new();
        public List<AccMgrUnscheduledJobDto> FirstMonth { get; set; } = new();
        public List<AccMgrUnscheduledJobDto> SecondMonth { get; set; } = new();
        public List<AccMgrUnscheduledJobDto> ThirdMonth { get; set; } = new();
        public List<AccMgrUnscheduledJobDto> FourthMonth { get; set; } = new();
        public List<AccMgrUnscheduledJobDto> FifthMonth { get; set; } = new();

        // Computed properties for easier frontend handling
        [JsonIgnore]
        public int TotalJobs => 
            CompletedNotReturned.Count +
            ReturnedForProcessing.Count +
            JobsScheduledToday.Count +
            JobsConfirmedNext120Hours.Count +
            ReturnedWithIncompleteData.Count +
            PastDueUnscheduled.Count +
            FirstMonth.Count +
            SecondMonth.Count +
            ThirdMonth.Count +
            FourthMonth.Count +
            FifthMonth.Count;

        [JsonIgnore]
        public int CriticalJobsCount => 
            CompletedNotReturned.Count +
            ReturnedForProcessing.Count +
            ReturnedWithIncompleteData.Count;

        [JsonIgnore]
        public int UnscheduledJobsCount =>
            PastDueUnscheduled.Count +
            FirstMonth.Count +
            SecondMonth.Count +
            ThirdMonth.Count +
            FourthMonth.Count +
            FifthMonth.Count;

        // Summary statistics for dashboard displays
        public AccMgrPerformanceReportSummaryDto GetSummary()
        {
            return new AccMgrPerformanceReportSummaryDto
            {
                CompletedNotReturnedCount = CompletedNotReturned.Count,
                ReturnedForProcessingCount = ReturnedForProcessing.Count,
                JobsScheduledTodayCount = JobsScheduledToday.Count,
                JobsConfirmedNext120HoursCount = JobsConfirmedNext120Hours.Count,
                ReturnedWithIncompleteDataCount = ReturnedWithIncompleteData.Count,
                PastDueUnscheduledCount = PastDueUnscheduled.Count,
                MonthlyScheduledCounts = new Dictionary<string, int>
                {
                    ["FirstMonth"] = FirstMonth.Count,
                    ["SecondMonth"] = SecondMonth.Count,
                    ["ThirdMonth"] = ThirdMonth.Count,
                    ["FourthMonth"] = FourthMonth.Count,
                    ["FifthMonth"] = FifthMonth.Count
                },
                TotalJobs = TotalJobs,
                CriticalJobsCount = CriticalJobsCount,
                UnscheduledJobsCount = UnscheduledJobsCount,
                OfficeId = OfficeId,
                ROJobsFilter = ROJobs,
                GeneratedAt = GeneratedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                RequestedBy = RequestedBy,
                UserRole = UserRole,
                IsFiltered = IsFiltered
            };
        }
    }

    // =========================
    // SUMMARY DTO FOR DASHBOARD/STATISTICS
    // =========================
    public class AccMgrPerformanceReportSummaryDto
    {
        public int CompletedNotReturnedCount { get; set; }
        public int ReturnedForProcessingCount { get; set; }
        public int JobsScheduledTodayCount { get; set; }
        public int JobsConfirmedNext120HoursCount { get; set; }
        public int ReturnedWithIncompleteDataCount { get; set; }
        public int PastDueUnscheduledCount { get; set; }
        public Dictionary<string, int> MonthlyScheduledCounts { get; set; } = new();
        public int TotalJobs { get; set; }
        public int CriticalJobsCount { get; set; }
        public int UnscheduledJobsCount { get; set; }
        public string OfficeId { get; set; }
        public string ROJobsFilter { get; set; }
        public string GeneratedAt { get; set; }
        public string RequestedBy { get; set; }
        public string UserRole { get; set; }
        public bool IsFiltered { get; set; }
    }

    // =========================
    // REQUEST DTO FOR ROLE-BASED FILTERING
    // =========================
    public class AccMgrPerformanceReportRequestDto
    {
        public string OfficeId { get; set; }
        public string ROJobs { get; set; } = string.Empty;
        
        // Role-based filtering properties
        public string? UserEmpID { get; set; }
        public string? WindowsID { get; set; }
        public string? UserRole { get; set; }
        
        // Optional filtering parameters
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IncludeCriticalOnly { get; set; } = false;
        public bool IncludeUnscheduledOnly { get; set; } = false;
    }
}

