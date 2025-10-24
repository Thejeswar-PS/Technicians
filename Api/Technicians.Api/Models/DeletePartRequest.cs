namespace Technicians.Api.Models
{
    public class DeletePartRequest
    {
        public string CallNbr { get; set; }
        public int ScidInc { get; set; }
        public int Display { get; set; }
        public string EmpId { get; set; }  // Optional
    }

}
