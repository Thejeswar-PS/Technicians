
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
    // MASTER RESPONSE DTO
    // =========================
    public class AccMgrPerformanceReportResponseDto
    {
        public string OfficeId { get; set; }
        public string ROJobs { get; set; }
        public DateTime GeneratedAt { get; set; }

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
    }
}

//using System.ComponentModel.DataAnnotations;
//using System.Text.Json.Serialization;

//namespace Technicians.Api.Models
//{
//    /// <summary>
//    /// Request DTO for DisplayPerformanceEmail stored procedure
//    /// </summary>
//    public class AccMgrPerformanceReportRequestDto
//    {
//        /// <summary>
//        /// Office ID parameter
//        /// </summary>
//        [Required]
//        [StringLength(11)]
//        [JsonPropertyName("pOffId")]
//        public string POffId { get; set; } = string.Empty;

//        /// <summary>
//        /// RO Jobs filter parameter
//        /// </summary>
//        // [StringLength(11)]
//        // [JsonPropertyName("roJobs")]
//        // public string ROJobs { get; set; } = string.Empty;
//    }

//    /// <summary>
//    /// Base DTO for call status information in Account Manager Performance Report
//    /// </summary>
//    public class AccMgrCallStatusDto
//    {
//        [JsonPropertyName("callnbr")]
//        public string CallNbr { get; set; } = string.Empty;

//        [JsonPropertyName("custnmbr")]
//        public string CustNmbr { get; set; } = string.Empty;

//        [JsonPropertyName("offid")]
//        public string OffId { get; set; } = string.Empty;

//        [JsonPropertyName("jobstatus")]
//        public string JobStatus { get; set; } = string.Empty;

//        [JsonPropertyName("responseDate")]
//        public DateTime ResponseDate { get; set; }

//        [JsonPropertyName("scheduledstart")]
//        public DateTime ScheduledStart { get; set; }

//        [JsonPropertyName("scheduledend")]
//        public DateTime ScheduledEnd { get; set; }

//        [JsonPropertyName("returned")]
//        public DateTime Returned { get; set; }

//        [JsonPropertyName("invoicedate")]
//        public DateTime InvoiceDate { get; set; }

//        [JsonPropertyName("historic")]
//        public byte Historic { get; set; }

//        [JsonPropertyName("invoiceamount")]
//        public decimal InvoiceAmount { get; set; }

//        [JsonPropertyName("invoicetotal")]
//        public decimal InvoiceTotal { get; set; }

//        [JsonPropertyName("jobType")]
//        public string JobType { get; set; } = string.Empty;

//        [JsonPropertyName("totalAmount")]
//        public decimal TotalAmount { get; set; }

//        [JsonPropertyName("techName")]
//        public string TechName { get; set; } = string.Empty;

//        [JsonPropertyName("custclas")]
//        public string CustClas { get; set; } = string.Empty;

//        [JsonPropertyName("custname")]
//        public string CustName { get; set; } = string.Empty;

//        [JsonPropertyName("contractNo")]
//        public string ContractNo { get; set; } = string.Empty;

//        [JsonPropertyName("description")]
//        public string Description { get; set; } = string.Empty;

//        [JsonPropertyName("changeAge")]
//        public int ChangeAge { get; set; }

//        [JsonPropertyName("origAge")]
//        public int OrigAge { get; set; }
//    }

//    /// <summary>
//    /// DTO for completed jobs not returned from technician
//    /// </summary>
//    public class AccMgrCompletedNotReturnedDto : AccMgrCallStatusDto
//    {
//        // Inherits all properties from AccMgrCallStatusDto
//    }

//    /// <summary>
//    /// DTO for jobs returned from technician for processing by account manager
//    /// </summary>
//    public class AccMgrReturnedForProcessingDto : AccMgrCallStatusDto
//    {
//        [JsonPropertyName("changeAge1")]
//        public int ChangeAge1 { get; set; }
//    }

//    /// <summary>
//    /// DTO for jobs scheduled today
//    /// </summary>
//    public class AccMgrJobsScheduledTodayDto : AccMgrCallStatusDto
//    {
//        [JsonPropertyName("changeAge1")]
//        public int ChangeAge1 { get; set; }
//    }

//    /// <summary>
//    /// DTO for jobs confirmed for next 120 hours
//    /// </summary>
//    public class AccMgrJobsConfirmedNext120HoursDto : AccMgrCallStatusDto
//    {
//        [JsonPropertyName("changeAge1")]
//        public int ChangeAge1 { get; set; }
//    }

//    /// <summary>
//    /// DTO for jobs returned with incomplete data
//    /// </summary>
//    public class AccMgrReturnedWithIncompleteDataDto : AccMgrCallStatusDto
//    {
//        // Inherits all properties from AccMgrCallStatusDto
//    }

//    /// <summary>
//    /// DTO for past due unscheduled jobs
//    /// </summary>
//    public class AccMgrPastDueUnscheduledDto
//    {
//        [JsonPropertyName("callnbr")]
//        public string CallNbr { get; set; } = string.Empty;

//        [JsonPropertyName("custnmbr")]
//        public string CustNmbr { get; set; } = string.Empty;

//        [JsonPropertyName("custname")]
//        public string CustName { get; set; } = string.Empty;

//        [JsonPropertyName("siteContact")]
//        public string SiteContact { get; set; } = string.Empty;

//        [JsonPropertyName("city")]
//        public string City { get; set; } = string.Empty;

//        [JsonPropertyName("jobstatus")]
//        public string JobStatus { get; set; } = string.Empty;

//        [JsonPropertyName("scheduledstart")]
//        public DateTime ScheduledStart { get; set; }

//        [JsonPropertyName("description")]
//        public string Description { get; set; } = string.Empty;

//        [JsonPropertyName("changeAge")]
//        public int ChangeAge { get; set; }

//        [JsonPropertyName("origAge")]
//        public int OrigAge { get; set; }
//    }

//    /// <summary>
//    /// DTO for monthly unscheduled jobs (First through Fifth Month)
//    /// </summary>
//    public class AccMgrMonthlyUnscheduledJobsDto
//    {
//        [JsonPropertyName("callnbr")]
//        public string CallNbr { get; set; } = string.Empty;

//        [JsonPropertyName("custnmbr")]
//        public string CustNmbr { get; set; } = string.Empty;

//        [JsonPropertyName("custname")]
//        public string CustName { get; set; } = string.Empty;

//        [JsonPropertyName("siteContact")]
//        public string SiteContact { get; set; } = string.Empty;

//        [JsonPropertyName("city")]
//        public string City { get; set; } = string.Empty;

//        [JsonPropertyName("jobstatus")]
//        public string JobStatus { get; set; } = string.Empty;

//        [JsonPropertyName("scheduledstart")]
//        public DateTime ScheduledStart { get; set; }

//        [JsonPropertyName("description")]
//        public string Description { get; set; } = string.Empty;

//        [JsonPropertyName("changeAge")]
//        public int ChangeAge { get; set; }

//        [JsonPropertyName("origAge")]
//        public int OrigAge { get; set; }
//    }

//    /// <summary>
//    /// Comprehensive response DTO for Account Manager Performance Report containing all result sets
//    /// </summary>
//    public class AccMgrPerformanceReportResponseDto
//    {
//        [JsonPropertyName("success")]
//        public bool Success { get; set; } = true;

//        [JsonPropertyName("message")]
//        public string Message { get; set; } = string.Empty;

//        [JsonPropertyName("officeId")]
//        public string OfficeId { get; set; } = string.Empty;

//        // [JsonPropertyName("roJobs")]
//        // public string ROJobs { get; set; } = string.Empty;

//        [JsonPropertyName("generatedAt")]
//        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

//        [JsonPropertyName("completedNotReturned")]
//        public List<AccMgrCompletedNotReturnedDto> CompletedNotReturned { get; set; } = new();

//        [JsonPropertyName("returnedForProcessing")]
//        public List<AccMgrReturnedForProcessingDto> ReturnedForProcessing { get; set; } = new();

//        [JsonPropertyName("jobsScheduledToday")]
//        public List<AccMgrJobsScheduledTodayDto> JobsScheduledToday { get; set; } = new();

//        [JsonPropertyName("jobsConfirmedNext120Hours")]
//        public List<AccMgrJobsConfirmedNext120HoursDto> JobsConfirmedNext120Hours { get; set; } = new();

//        [JsonPropertyName("returnedWithIncompleteData")]
//        public List<AccMgrReturnedWithIncompleteDataDto> ReturnedWithIncompleteData { get; set; } = new();

//        [JsonPropertyName("pastDueUnscheduled")]
//        public List<AccMgrPastDueUnscheduledDto> PastDueUnscheduled { get; set; } = new();

//        [JsonPropertyName("firstMonth")]
//        public List<AccMgrMonthlyUnscheduledJobsDto> FirstMonth { get; set; } = new();

//        [JsonPropertyName("secondMonth")]
//        public List<AccMgrMonthlyUnscheduledJobsDto> SecondMonth { get; set; } = new();

//        [JsonPropertyName("thirdMonth")]
//        public List<AccMgrMonthlyUnscheduledJobsDto> ThirdMonth { get; set; } = new();

//        [JsonPropertyName("fourthMonth")]
//        public List<AccMgrMonthlyUnscheduledJobsDto> FourthMonth { get; set; } = new();

//        [JsonPropertyName("fifthMonth")]
//        public List<AccMgrMonthlyUnscheduledJobsDto> FifthMonth { get; set; } = new();

//        [JsonPropertyName("totalRecords")]
//        public int TotalRecords => 
//            CompletedNotReturned.Count + 
//            ReturnedForProcessing.Count + 
//            JobsScheduledToday.Count + 
//            JobsConfirmedNext120Hours.Count + 
//            ReturnedWithIncompleteData.Count + 
//            PastDueUnscheduled.Count + 
//            FirstMonth.Count + 
//            SecondMonth.Count + 
//            ThirdMonth.Count + 
//            FourthMonth.Count + 
//            FifthMonth.Count;
//    }

//    /// <summary>
//    /// Summary statistics DTO for Account Manager Performance Report data
//    /// </summary>
//    public class AccMgrPerformanceReportSummaryDto
//    {
//        [JsonPropertyName("completedNotReturnedCount")]
//        public int CompletedNotReturnedCount { get; set; }

//        [JsonPropertyName("returnedForProcessingCount")]
//        public int ReturnedForProcessingCount { get; set; }

//        [JsonPropertyName("jobsScheduledTodayCount")]
//        public int JobsScheduledTodayCount { get; set; }

//        [JsonPropertyName("jobsConfirmedNext120HoursCount")]
//        public int JobsConfirmedNext120HoursCount { get; set; }

//        [JsonPropertyName("returnedWithIncompleteDataCount")]
//        public int ReturnedWithIncompleteDataCount { get; set; }

//        [JsonPropertyName("pastDueUnscheduledCount")]
//        public int PastDueUnscheduledCount { get; set; }

//        [JsonPropertyName("monthlyScheduledCounts")]
//        public Dictionary<string, int> MonthlyScheduledCounts { get; set; } = new();

//        [JsonPropertyName("totalJobs")]
//        public int TotalJobs { get; set; }

//        [JsonPropertyName("officeId")]
//        public string OfficeId { get; set; } = string.Empty;

//        [JsonPropertyName("roJobsFilter")]
//        public string ROJobsFilter { get; set; } = string.Empty;

//        [JsonPropertyName("generatedAt")]
//        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
//    }
//}