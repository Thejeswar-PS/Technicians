namespace Technicians.Api.Models
{
    public class PartsRequestDto
    {
        public int ScidInc { get; set; }
        public string ServiceCallID { get; set; }
        public string CallNbr { get; set; }
        public string PartNum { get; set; }
        public string DcPartNum { get; set; }
        public int Qty { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public string Destination { get; set; }
        public DateTime RequiredDate { get; set; }
        public string ShippingMethod { get; set; }
        public bool Urgent { get; set; }
        public bool BackOrder { get; set; }
        public string TechName { get; set; }
        public string MaintAuthId { get; set; } // usually set from context or session user
    }

}
