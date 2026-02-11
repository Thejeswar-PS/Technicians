namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for GetPartsTestStatus stored procedure main result
    /// </summary>
    public class PartsTestStatusDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string SiteID { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string ManufPartNo { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Description { get; set; } = string.Empty;
        public string QCWorkStatus { get; set; } = string.Empty;
        public string AssyWorkStatus { get; set; } = string.Empty;
        public bool IsPassed { get; set; }
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string ProblemNotes { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }
        public int RowIndex { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public string UniqueID { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for GetPartsTestStatus endpoint
    /// </summary>
    public class PartsTestStatusRequest
    {
        public string JobType { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public bool Archive { get; set; } = false;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for Make/Model dropdown options
    /// </summary>
    public class MakeModelDto
    {
        public string Make { get; set; } = string.Empty;
    }

    /// <summary>
    /// Complete response DTO for GetPartsTestStatus
    /// </summary>
    public class PartsTestStatusResponse
    {
        public List<PartsTestStatusDto> PartsTestData { get; set; } = new();
        public List<MakeModelDto> DistinctMakes { get; set; } = new();
        public List<MakeModelDto> DistinctModels { get; set; } = new();
    }
}