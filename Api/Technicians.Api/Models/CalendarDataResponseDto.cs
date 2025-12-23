namespace Technicians.Api.Models
{
    public class CalendarDataResponseDto
    {
        public List<GetCalenderJobDataVM> CalendarJobs { get; set; }
        public CalendarSummaryDto Summary { get; set; }
    }
}
