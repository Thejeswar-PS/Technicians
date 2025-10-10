namespace Technicians.Api.Models
{
    public class ShippingInfoDto
    {
        public string Service_Call_ID { get; set; }
        public string TechID { get; set; }
        public string Technician { get; set; }
        public string ContactName { get; set; }
        public string ContactPh { get; set; }
        public bool VerifyPh { get; set; }
        public string ReqNotes { get; set; }
        public string ShipNotes { get; set; }
        public string Status { get; set; }
        public int Source { get; set; }
        public string Maint_Auth_ID { get; set; }
    }
}
