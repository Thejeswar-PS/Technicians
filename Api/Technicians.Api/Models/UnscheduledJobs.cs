namespace Technicians.Api.Models
{
    public class UnscheduledJobs
    {
    }

    public class UnscheduledJobsByMonthDto
    {
        public string MonthName { get; set; }
        public int Jobs { get; set; }
    }

    public class UnscheduledJobsByAccountManagerDto
    {
        public string OffId { get; set; }
        public int Jobs { get; set; }
    }

}
