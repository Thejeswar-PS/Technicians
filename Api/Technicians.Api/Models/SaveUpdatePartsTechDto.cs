namespace Technicians.Api.Models
{
    public class SaveUpdatePartsTechDto
    {
        public string Service_Call_ID { get; set; }
        public int SCID_Inc { get; set; }
        public string Part_Num { get; set; }
        public string DC_Part_Num { get; set; }
        public int TotalQty { get; set; }
        public string Description { get; set; }
        public int InstalledParts { get; set; }
        public int UnusedParts { get; set; }
        public int FaultyParts { get; set; }
        public string Unused_Desc { get; set; }
        public string Faulty_Desc { get; set; }
        public string Manufacturer { get; set; }
        public string ModelNo { get; set; }
        public int PartSource { get; set; }
        public string Maint_Auth_ID { get; set; }
        public string IsReceived { get; set; }
        public string SaveSource { get; set; }
        public bool IsBrandNew { get; set; }
        public bool IsPartsLeft { get; set; }
        public string TrackingInfo { get; set; }
    }
}
