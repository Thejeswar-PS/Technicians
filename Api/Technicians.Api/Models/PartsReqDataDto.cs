namespace Technicians.Api.Models
{
    public class PartsReqDataDto
    {
        public string Service_Call_ID { get; set; }
        public int SCID_Inc { get; set; }
        public string Part_Num { get; set; }
        public string DC_Part_Num { get; set; }
        public int? Qty { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public string Destination { get; set; }
        public DateTime? Required_Date { get; set; }
        public DateTime? Required_Time { get; set; }
        public bool? Urgent { get; set; }
        public string Shipping_Method { get; set; }
        public DateTime? Create_Date { get; set; }
        public DateTime? LastModified { get; set; }

        public bool BackOrder { get; set; }
        public string Maint_Auth_ID { get; set; }
    }
}
