namespace Technicians.Api.Models
{
    public class CalendarSummaryDto
    {
        public int OverDue { get; set; }
        public int Tomorrow { get; set; }
        public int Due3 { get; set; }
        public int Due5 { get; set; }
        public int Due10 { get; set; }
    }
}
