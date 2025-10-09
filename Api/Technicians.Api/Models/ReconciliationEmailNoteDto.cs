namespace Technicians.Api.Models
{
    public class ReconciliationEmailNoteDto
    {
        public int EquipID { get; set; }
        public string EquipType { get; set; }
        public string Make { get; set; }
        public string MakeCorrect { get; set; }
        public string ActMake { get; set; }
        public string Model { get; set; }
        public string ModelCorrect { get; set; }
        public string ActModel { get; set; }
        public string SerialNo { get; set; }
        public string SerialNoCorrect { get; set; }
        public string ActSerialNo { get; set; }
        public string KVA { get; set; }
        public string KVACorrect { get; set; }
        public string ActKVA { get; set; }
        public string BattPerString { get; set; }
        public string BattPerStringCorrect { get; set; }
        public string ActBattPerString { get; set; }
    }
}
