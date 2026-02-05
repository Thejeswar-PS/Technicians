namespace Technicians.Api.Models
{
    public class PastDueUnscheduledResponse
    {
        public List<PastDueJobDetailDto> JobDetails { get; set; }
        public List<PastDueSummaryDto> SummaryByManager { get; set; }
        public List<ScheduledPercentDto> ScheduledPercent { get; set; }
        public List<TotalJobsDto> TotalUnscheduledJobs { get; set; }
        public List<TotalJobsDto> TotalScheduledJobs { get; set; }
    }


    public class PastDueJobDetailDto
    {
        public string CallNbr { get; set; }
        public string CustName { get; set; }
        public string CustNmbr { get; set; }
        public string AccMgr { get; set; }
        public string JobStatus { get; set; }
        public DateTime ScheduledStart { get; set; }
        public DateTime ScheduledEnd { get; set; }
        public string TechName { get; set; }
        public string CustClas { get; set; }
        public string ContNbr { get; set; }
        public int ChangeAge { get; set; }
        public int OrigAge { get; set; }
        public string Description { get; set; }
    }

    public class PastDueSummaryDto
    {
        public string AccMgr { get; set; }
        public int PastDueJobs { get; set; }
        public int CouldBeBilled { get; set; }
    }

    public class ScheduledPercentDto
    {
        public string OffId { get; set; }
        public decimal ScheduledPercent { get; set; }
    }

    // Already present
    //public class TotalJobsDto
    //{
    //    public string OffId { get; set; }
    //    public decimal TotalJobs { get; set; }
    //}

}
