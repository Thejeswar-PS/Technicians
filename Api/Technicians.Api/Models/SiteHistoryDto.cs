namespace Technicians.Api.Models;

public class SiteHistoryDto
{
    public string JobNo { get; set; }
    public string Technician { get; set; }
    public string TechNotes { get; set; }
    public string Status { get; set; }
    public string ScheduledOn { get; set; }
    public string CustomerName { get; set; }
    public string Address { get; set; }
    public DateTime StrtDate { get; set; }
}
