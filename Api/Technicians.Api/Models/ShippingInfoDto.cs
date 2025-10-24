namespace Technicians.Api.Models
{
    public class ShippingInfoDto
    {
        public string CallNbr { get; set; }
        public string TechID { get; set; }
        public string TechName { get; set; } // maps to Technician
        public string ContactName { get; set; }
        public string ContactPh { get; set; }
        public bool VerifyPh { get; set; }
        public string Notes { get; set; } // maps to ReqNotes
        public string ShippingNotes { get; set; } // maps to ShipNotes
        public string ShippingStatus { get; set; } // maps to Status
        public int Source { get; set; }
    }

}
