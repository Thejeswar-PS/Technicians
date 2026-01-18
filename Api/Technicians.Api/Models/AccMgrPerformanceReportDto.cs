
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

