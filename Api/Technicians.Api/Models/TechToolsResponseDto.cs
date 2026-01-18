namespace Technicians.Api.Models
{
    public class TechToolsResponseDto
    {
        public List<TechToolDto> Tools { get; set; } = new();
        public TechInfoDto TechInfo { get; set; }
    }

    public class TechToolDto
    {
        public string ToolKitPNMisc { get; set; }
        public string Description { get; set; }
        public string TechValue { get; set; }
        public string TechID { get; set; }
        public string ModifiedOn { get; set; }
        public string ModifiedBy { get; set; }
        public string GroupName { get; set; }
        public string ColumnOrder { get; set; }
    }

    public class TechInfoDto
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public string TechEmail { get; set; }
        public string Manager { get; set; }
    }

}
