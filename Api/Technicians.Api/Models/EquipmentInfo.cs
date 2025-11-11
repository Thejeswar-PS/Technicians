namespace Technicians.Api.Models
{
    public class EquipmentInfo
    {
        public string EquipNo { get; set; }
        public string SerialNo { get; set; }
        public string Location { get; set; }
        public string ModelNo { get; set; }
        public string VendorId { get; set; }
        public string EquipMonth { get; set; }
        public string EquipYear { get; set; }
        public int? BatteriesPerString { get; set; }
        public int? BatteriesPerPack { get; set; }
        public string ReadingType { get; set; }
    }
}
