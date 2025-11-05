namespace Technicians.Api.Models
{
    public class TechReturnUpdateDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string TechID { get; set; }
        public int TrunkStock { get; set; }
        public int UnusedSent { get; set; }
        public int FaultySent { get; set; }
        public string ReturnStatus { get; set; }
        public string ReturnNotes { get; set; }
    }

}
