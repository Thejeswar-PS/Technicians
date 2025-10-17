namespace Technicians.Api.Models
{
    public class EquipmentInsertUpdateDto
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string EquipNo { get; set; }
        public string VendorId { get; set; }
        public string EquipType { get; set; }
        public string Version { get; set; }
        public string SerialID { get; set; }
        public string SVC_Asset_Tag { get; set; }
        public string Location { get; set; }
        public string ReadingType { get; set; }
        public string Contract { get; set; }
        public string TaskDesc { get; set; }
        public int BatPerStr { get; set; }
        public string EquipStatus { get; set; }
        public string MaintAuth { get; set; }
        public string KVA { get; set; }
        public string EquipMonth { get; set; }
        public int EquipYear { get; set; }
        public string DCFCapsPartNo { get; set; }
        public string ACFIPCapsPartNo { get; set; }
        public int DCFQty { get; set; }
        public int ACFIPQty { get; set; }
        public string DCFCapsMonthName { get; set; }
        public string ACFIPCapsMonthName { get; set; }
        public int DCFCapsYear { get; set; }
        public int ACFIPYear { get; set; }
        public string DCCommCapsPartNo { get; set; }
        public string ACFOPCapsPartNo { get; set; }
        public int DCCommQty { get; set; }
        public int ACFOPQty { get; set; }
        public string DCCommCapsMonthName { get; set; }
        public string ACFOPCapsMonthName { get; set; }
        public int DCCommCapsYear { get; set; }
        public int ACFOPYear { get; set; }
        public int BatteriesPerPack { get; set; }
        public string VFSelection { get; set; }
        public string FansPartNo { get; set; }
        public int FansQty { get; set; }
        public string FansMonth { get; set; }
        public int FansYear { get; set; }
        public string BlowersPartNo { get; set; }
        public int BlowersQty { get; set; }
        public string BlowersMonth { get; set; }
        public int BlowersYear { get; set; }
        public string MiscPartNo { get; set; }
        public int MiscQty { get; set; }
        public string MiscMonth { get; set; }
        public int MiscYear { get; set; }
        public string Comments { get; set; }
    }
}
