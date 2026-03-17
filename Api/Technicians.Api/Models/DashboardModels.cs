namespace Technicians.Api.Models
{
    public class DashboardModels
    {
    }

    public class TechKpiDto
    {
        public int JobsScheduled { get; set; }
        public int JobsToBeUploaded { get; set; }
        public int EmergencyJobs { get; set; }
        public int MissingJobs { get; set; }
        public int JobsWithParts { get; set; }
        public int JobsThisWeek { get; set; }
        public int JobsUploaded { get; set; }
    }

    public class TechActivityLogDto
    {
        public string? ActivityDate { get; set; }
        public int IsNewDate { get; set; }
        public string? JobID { get; set; }
        public string? Subject { get; set; }
        public string? Message { get; set; }
        public DateTime ChangedOn { get; set; }
    }

    public class WeekJobDto
    {
        public string CallNbr { get; set; }
        public string CustName { get; set; }
        public string AccMgr { get; set; }
        public string JobStatus { get; set; }
        public DateTime DateStatusChanged { get; set; }
    }

    public class MonthlyScheduledChartDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Data { get; set; } = new();
    }

    public class TopTechChartDto
    {
        /// <summary>Labels array mirroring the legacy TopTechLabels string.</summary>
        public List<string> Labels { get; set; } = new();

        /// <summary>Data array mirroring the legacy TopTechData string.</summary>
        public List<decimal> Data { get; set; } = new();
    }
}
