namespace Technicians.Api.Models
{
    public class EquipReconciliationInfoDto
    {
        public string CallNbr { get; set; }
        public int EquipID { get; set; }

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

        public int ASCStringsNo { get; set; }
        public string ASCStringsCorrect { get; set; }
        public int ActASCStringNo { get; set; }

        public int BattPerString { get; set; }
        public string BattPerStringCorrect { get; set; }
        public int ActBattPerString { get; set; }

        public int TotalEquips { get; set; }
        public string TotalEquipsCorrect { get; set; }
        public int ActTotalEquips { get; set; }

        public string NewEquipment { get; set; }
        public string EquipmentNotes { get; set; }
        public bool Verified { get; set; }
    }


}
