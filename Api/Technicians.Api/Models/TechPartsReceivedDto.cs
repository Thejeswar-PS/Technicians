namespace Technicians.Api.Models
{
    public class TechPartsReceivedDto
    {
        public string ServiceCallId { get; set; }
        public List<int> ScidIncList { get; set; } 
        public string MaintAuthId { get; set; }
    }
}
