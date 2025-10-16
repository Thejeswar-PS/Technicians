using System.Data;

namespace Technicians.Api.Models
{
    public class AutoTechNotesByEquipTypeDto
    {
        public string EquipNo { get; set; }
        public int BatteryID { get; set; }
        public string ColumnName { get; set; }
        public string Deficiency { get; set; }
        public string Action { get; set; }
        public string Status { get; set; }
        public string ColumnSection { get; set; }
        public string Tag { get; set; }
        public string Location { get; set; }
        public string SerialNo { get; set; }
    }
}
