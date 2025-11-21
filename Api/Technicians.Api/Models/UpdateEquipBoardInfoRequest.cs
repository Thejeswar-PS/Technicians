using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    public class UpdateEquipBoardInfoRequest
    {
        [Required]
        public string EquipNo { get; set; }

        [Required]
        public int EquipId { get; set; }

        [Required]
        public List<EquipBoardRow> Rows { get; set; } = new List<EquipBoardRow>();
    }

    public class EquipBoardRow
    {
        public string PartNo { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Qty { get; set; } = 0;
        public string Comments { get; set; } = string.Empty;
    }
}