namespace Technicians.Api.Models
{
    public class SavePartsEquipInfoDto
    {
        public string CallNbr { get; set; }
        public string TechID { get; set; }
        public string TechName { get; set; }

        public string EquipNo { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public decimal? KVA { get; set; }
        public decimal? IPVolt { get; set; }
        public decimal? OPVolt { get; set; }
        public string AddInfo { get; set; }

        public string EquipNo1 { get; set; }
        public string Make1 { get; set; }
        public string Model1 { get; set; }
        public decimal? KVA1 { get; set; }
        public decimal? IPVolt1 { get; set; }
        public decimal? OPVolt1 { get; set; }
        public string AddInfo1 { get; set; }

        public string EmgNotes { get; set; }
    }
}
