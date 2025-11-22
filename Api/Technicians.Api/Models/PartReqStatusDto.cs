namespace Technicians.Api.Models
{
    public class PartReqStatusDto
    {
        public string Callnbr { get; set; }
        public string Custnumbr { get; set; }
        public string Custname { get; set; } // Used in Key 7 and 8
        public string City { get; set; }
        public string State { get; set; }
        public string Status { get; set; }
        public string ReqDate { get; set; }
        public string Urgent { get; set; }
        public string Technician { get; set; }
        public string Ship_Date { get; set; }
        public int Age { get; set; }
    }
}