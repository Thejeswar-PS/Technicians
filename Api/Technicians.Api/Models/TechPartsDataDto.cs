namespace Technicians.Api.Models
{
    public class TechPartDto
    {
        public string Service_Call_ID { get; set; }
        public int SCID_INC { get; set; }
        public string PART_NUM { get; set; }
        public string DC_PART_NUM { get; set; }
        public int TotalQty { get; set; }
        public string DESCRIPTION { get; set; }
        public int InstalledParts { get; set; }
        public int UNUSEDPARTS { get; set; }
        public int FAULTYPARTS { get; set; }
        public string UNUSED_DESC { get; set; }
        public string FAULTY_DESC { get; set; }
        public string MANUFACTURER { get; set; }
        public string MODELNO { get; set; }
        public string PARTSOURCE { get; set; }
        public DateTime CREATE_DATE { get; set; }
        public DateTime LASTMODIFIED { get; set; }
        public string LastModifiedBy { get; set; }
        public string ISRECEIVED { get; set; }
        public string ISBRANDNEW { get; set; }
        public string IsPartsLeft { get; set; }
        public string TrackingInfo { get; set; }
    }
}