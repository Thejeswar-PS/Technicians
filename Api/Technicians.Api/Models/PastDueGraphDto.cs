namespace Technicians.Api.Models
{
    /// <summary>
    /// Response DTO for individual call status from PDueUnscheduledJobsInfo stored procedure
    /// Matches the @CallStatus table structure
    /// </summary>
    public class PastDueCallStatusDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string CustName { get; set; } = string.Empty;
        public string CustNmbr { get; set; } = string.Empty;
        public string AccMgr { get; set; } = string.Empty;
        public string JobStatus { get; set; } = string.Empty;
        public DateTime ScheduledStart { get; set; }
        public DateTime ScheduledEnd { get; set; }
        public string TechName { get; set; } = string.Empty;
        public string CustClas { get; set; } = string.Empty;
        public string ContNbr { get; set; } = string.Empty;
        public int ChangeAge { get; set; }
        public int OrigAge { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for past due jobs summary by account manager
    /// </summary>
    public class PastDueJobsSummaryDto
    {
        public string AccMgr { get; set; } = string.Empty;
        public int PastDueJobs { get; set; }
        public int CouldBeBilled { get; set; }
    }

    /// <summary>
    /// Response DTO for scheduled percentage by office
    /// </summary>
    public class ScheduledPercentageDto
    {
        public string OffId { get; set; } = string.Empty;
        public decimal ScheduledPercentage { get; set; }
    }

    /// <summary>
    /// Response DTO for total jobs count by office
    /// </summary>
    public class TotalJobsDto
    {
        public string OffId { get; set; } = string.Empty;
        public decimal TotalJobs { get; set; }
    }

    /// <summary>
    /// Comprehensive response DTO for PDueUnscheduledJobsInfo stored procedure
    /// Contains all result sets from the stored procedure
    /// </summary>
    public class PastDueGraphResponseDto
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Detailed call status information for past due jobs
        /// </summary>
        public List<PastDueCallStatusDto> CallStatus { get; set; } = new List<PastDueCallStatusDto>();

        /// <summary>
        /// Summary of past due jobs and billable jobs by account manager
        /// </summary>
        public List<PastDueJobsSummaryDto> PastDueJobsSummary { get; set; } = new List<PastDueJobsSummaryDto>();

        /// <summary>
        /// Scheduled percentage by office
        /// </summary>
        public List<ScheduledPercentageDto> ScheduledPercentages { get; set; } = new List<ScheduledPercentageDto>();

        /// <summary>
        /// Total unscheduled jobs by office
        /// </summary>
        public List<TotalJobsDto> TotalUnscheduledJobs { get; set; } = new List<TotalJobsDto>();

        /// <summary>
        /// Total scheduled jobs by office
        /// </summary>
        public List<TotalJobsDto> TotalScheduledJobs { get; set; } = new List<TotalJobsDto>();

        /// <summary>
        /// Total number of records across all result sets
        /// </summary>
        public int TotalRecords => 
            CallStatus.Count + 
            PastDueJobsSummary.Count + 
            ScheduledPercentages.Count + 
            TotalUnscheduledJobs.Count + 
            TotalScheduledJobs.Count;
    }
}