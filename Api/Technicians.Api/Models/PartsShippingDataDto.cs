namespace Technicians.Api.Models
{
    public class PartsShippingDataDto
    {
        public string Service_Call_ID { get; set; }
        public int SCID_Inc { get; set; }
        public string Part_Num { get; set; }
        public string DC_Part_Num { get; set; }
        public string Description { get; set; }
        public string Shipping_Company { get; set; }
        public string Tracking_Num { get; set; }
        public string Courier { get; set; }
        public string Destination { get; set; }
        public DateTime? Ship_Date { get; set; }
        public int? Qty { get; set; }
        public string Shipment_Type { get; set; }
        public decimal? Shipping_Cost { get; set; }     // parsed from varchar
        public decimal? Courier_Cost { get; set; }      // parsed from varchar
        public DateTime? ETA { get; set; }
        public string Shipped_from { get; set; }
        public DateTime? Create_Date { get; set; }
        public DateTime? LastModified { get; set; }
        public string Maint_Auth_ID { get; set; }
        public bool? BackOrder { get; set; }            // matches table bit
    }

}
