namespace Technicians.Api.Models
{
    public class ReplaceTechToolsMiscRequest
    {
        public string TechId { get; set; } = string.Empty;
        public List<TechToolItemDto> ToolKitItems { get; set; } = new();
        public string ModifiedBy { get; set; } = string.Empty;
    }


    public class TechToolItemDto
    {
        public string ToolKitPNMisc { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TechValue { get; set; } = string.Empty;
        public int ColumnOrder { get; set; }
    }


}
