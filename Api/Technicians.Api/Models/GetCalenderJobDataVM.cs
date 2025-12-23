namespace Technicians.Api.Models
{
    public class GetCalenderJobDataVM : ICloneable
    {
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Address1 { get; set; }
        public string? SiteContact { get; set; }
        public string? SitePhone { get; set; }
        public string? Offname { get; set; }
        public string? CustName { get; set; }
        public string? JobNotes { get; set; }
        public string? BackColor { get; set; }
        public string? ForeColor { get; set; }
        public string? CallNbr { get; set; }
        public string? TechName { get; set; }
        public string? Status { get; set; }
        public object Clone()
        {
            return this.MemberwiseClone();
        }
    }
}
