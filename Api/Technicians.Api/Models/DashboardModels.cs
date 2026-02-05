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
    }

    public class TechActivityLogDto
    {
        public string CallNbr { get; set; }
        public string TechID { get; set; }
        public string AccMgr { get; set; }
        public string Activity { get; set; }
        public string Status { get; set; }
        public DateTime ActivityDate { get; set; }
    }

    public class WeekJobDto
    {
        public string CallNbr { get; set; }
        public string CustNbr { get; set; }
        public string CustName { get; set; }
        public string TechID { get; set; }
        public string TechName { get; set; }
        public string AccMgr { get; set; }
        public string Status { get; set; }
        public DateTime ScheduledDate { get; set; }
    }

    public class MonthlyScheduledChartDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Data { get; set; } = new();
    }

}
