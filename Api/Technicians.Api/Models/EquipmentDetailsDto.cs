namespace Technicians.Api.Models
{
    public class EquipmentDetailsDto
    {
        public int EquipId { get; set; }
        public string EquipNo { get; set; }
        public string SCHEDULED { get; set; }
        public string Location { get; set; }
        public string SerialID { get; set; }
        public string Probcde { get; set; }
        public string CodeEquipmentStatus { get; set; }
        public DateTime Create_Date { get; set; }
        public DateTime Last_Modifed { get; set; }
        public string Maint_Auth_ID { get; set; }
        public string EquipType { get; set; }
        public string ReadingType { get; set; }
        public int BatteriesPerString { get; set; }
        public int Upskva { get; set; }
        public int BatteriesPerPack { get; set; }
        public string SaveStatus { get; set; }
        public string VendorId { get; set; }
        public string Rating { get; set; }
        public string Version { get; set; }
        public string TaskDescription { get; set; }
        public string DateCode { get; set; }
    }
}
