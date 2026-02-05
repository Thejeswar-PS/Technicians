namespace Technicians.Api.Models
{
    public class BillAfterPMJobDto
    {
        public string CallNbr { get; set; }
        public string CustNbr { get; set; }
        public string CustName { get; set; }
        public string PMType { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string TechName { get; set; }
        public string AccMgr { get; set; }
        public DateTime? StrtDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string ContNbr { get; set; }
    }

    public class MoveBillAfterPMJobsRequest
    {
        public List<string> JobIds { get; set; }
        public string Archive { get; set; }   // "1" = true, "0" = false
    }

}
