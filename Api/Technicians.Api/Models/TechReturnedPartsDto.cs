namespace Technicians.Api.Models
{
    public class TechReturnedPartsDto
    {
        public string Service_Call_ID { get; set; }
        public int UnusedSentBack { get; set; }
        public int FaultySentBack { get; set; }
        public string ReturnStatus { get; set; }
        public string ReturnNotes { get; set; }
        public int TruckStock { get; set; }
        public string TechName { get; set; }
        public string Maint_Auth_ID { get; set; }
    }
}
