namespace Technicians.Api.Models
{
    public class PartReturnStatusDto
    {
        public string Service_Call_ID { get; set; } = string.Empty;
        public string Part_Num { get; set; } = string.Empty;
        public string Dc_Part_Num { get; set; } = string.Empty;
        public int TotalQty { get; set; }
        public string Description { get; set; } = string.Empty;
        public int FaultyParts { get; set; }
        public int UnusedParts { get; set; }
        public string InvUserID { get; set; } = string.Empty;
        public string Technician { get; set; } = string.Empty;
        public DateTime? LastModified { get; set; }
    }

    public class PartReturnStatusRequestDto
    {
        public int Key { get; set; }
        public string Source { get; set; } = "Web";
        public string InvUserID { get; set; } = "All";
        public int Year { get; set; } = DateTime.Now.Year;
    }
}