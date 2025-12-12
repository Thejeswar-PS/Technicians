namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for SaveUpdatePartsTestList stored procedure
    /// </summary>
    public class SaveUpdatePartsTestDto
    {
        public string JobFrom { get; set; } = string.Empty;
        public string CallNbr { get; set; } = string.Empty;
        public string SiteID { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string ManufPartNo { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string WorkType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string ProblemNotes { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public int RowIndex { get; set; }
        public string BoardStatus { get; set; } = string.Empty;
        public string CompWorkDone { get; set; } = string.Empty;
        public string CompWorkStatus { get; set; } = string.Empty;
        public string TestWorkDone { get; set; } = string.Empty;
        public string TestWorkStatus { get; set; } = string.Empty;
        public string CompletedBy { get; set; } = string.Empty;
        public string ReviewedBy { get; set; } = string.Empty;
        public bool IsPassed { get; set; }
        public string AssyWorkDone { get; set; } = string.Empty;
        public string AssyProcFollowed { get; set; } = string.Empty;
        public string AssyWorkStatus { get; set; } = string.Empty;
        public string QCWorkDone { get; set; } = string.Empty;
        public string QCProcFollowed { get; set; } = string.Empty;
        public string QCApproved { get; set; } = string.Empty;
        public string QCWorkStatus { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public bool Approved { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
    }
}