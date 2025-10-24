namespace Technicians.Api.Models
{
    public class ShippingPartDto
    {
        public int ScidInc { get; set; }
        public string ServiceCallID { get; set; }
        public string CallNbr { get; set; }
        public string PartNum { get; set; }
        public string DcPartNum { get; set; }
        public int Qty { get; set; }
        public string Description { get; set; }
        public string Destination { get; set; }
        public string ShippingCompany { get; set; }
        public string TrackingNum { get; set; }
        public string ShipmentType { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal CourierCost { get; set; }
        public DateTime ShipDate { get; set; }
        public DateTime Eta { get; set; }
        public string ShippedFrom { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime LastModified { get; set; }
        public bool BackOrder { get; set; }
    }
}
