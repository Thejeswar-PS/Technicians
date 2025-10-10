namespace Technicians.Api.Models
{
    public class SavePartsEquipInfoDto
    {
        public string ServiceCallId { get; set; }
        public string TechId { get; set; }
        public string Technician { get; set; }

        public string EquipNo { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int KVA { get; set; }
        public int IPVoltage { get; set; }
        public int OPVoltage { get; set; }
        public string AddInfo { get; set; }

        public string EquipNo1 { get; set; }
        public string Make1 { get; set; }
        public string Model1 { get; set; }
        public int KVA1 { get; set; }
        public int IPVoltage1 { get; set; }
        public int OPVoltage1 { get; set; }
        public string AddInfo1 { get; set; }

        public string EmgNotes { get; set; }
        public string MaintAuthId { get; set; }

    }
}
