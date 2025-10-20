namespace Technicians.Api.Models
{
    public class TechPartsDto
    {
        public int ScidInc { get; set; }
        public string ServiceCallID { get; set; }
        public string CallNbr { get; set; }
        public string PartNum { get; set; }
        public string DcPartNum { get; set; }
        public int TotalQty { get; set; }
        public string Description { get; set; }
        public string PartSource { get; set; }
        public int InstalledParts { get; set; }
        public int UnusedParts { get; set; }
        public int FaultyParts { get; set; }
        public string UnusedDesc { get; set; }
        public string FaultyDesc { get; set; }
        public bool IsReceived { get; set; }
        public string? ReceivedStatus { get; set; }
        public bool BrandNew { get; set; }
        public bool PartsLeft { get; set; }
        public string TrackingInfo { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime LastModified { get; set; }
    }
}
