namespace Technicians.Api.Models
{
    public class etechJobInfoDto
    {
        public string CallNbr { get; set; }
        public string Status { get; set; }
        public string CustNmbr { get; set; }
        public string Ponumber { get; set; }
        public string TechName { get; set; }
        public string CustName { get; set; }
        public string Addr1 { get; set; }
        public string TechCell { get; set; }
        public string TechPhone { get; set; }
        public string Contact { get; set; }
        public string TechEmail { get; set; }
        public string ContactPhone { get; set; }
        public string AccMgr { get; set; }
        public DateTime? StrtDate { get; set; }
        public DateTime? StrtTime { get; set; }
        public string SvcDescr { get; set; }
        public string RecordNotes { get; set; }
        public string PmVisualNotes { get; set; }
        public string QtePriority { get; set; }
        public string ContType { get; set; }
        public string Country { get; set; }
        public bool DefCheck { get; set; } // Nullable if needed
    }
}
