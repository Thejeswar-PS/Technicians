namespace Technicians.Api.Models
{
    public class JobDto
    {
        public string CallNbr { get; set; }
        public string Description { get; set; }
        public string CustName { get; set; }
        public string Status { get; set; }
        public string TechName { get; set; }
        public string TechId { get; set; }
        public string Address { get; set; }
        public string AccMgr { get; set; }
        public string Archive { get; set; }
        public string SvcDescr { get; set; }
        public DateTime? StrtDate { get; set; }
        public DateTime? StrtTime { get; set; }
        public DateTime? ReturnJob { get; set; }
    }

}
