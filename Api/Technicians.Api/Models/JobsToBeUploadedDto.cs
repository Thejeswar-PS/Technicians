namespace Technicians.Api.Models
{
    public class JobsToBeUploadedDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string AccMgr { get; set; }
        public string Status { get; set; }
        public DateTime StrtDate { get; set; }
        public string CustName { get; set; }
        public int ChangeAge { get; set; }
    }

}
