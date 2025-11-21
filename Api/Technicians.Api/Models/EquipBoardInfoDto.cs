namespace Technicians.Api.Models
{
    public class EquipBoardInfoDto
    {
        public string EquipNo { get; set; }
        public int EquipID { get; set; }
        public int RowID { get; set; }
        public string PartNo { get; set; }
        public string Description { get; set; }
        public int? Qty { get; set; }
        public string Comments { get; set; }
        public System.DateTime? LastModifiedOn { get; set; }
        public string LastModifiedBy { get; set; }
    }
}
