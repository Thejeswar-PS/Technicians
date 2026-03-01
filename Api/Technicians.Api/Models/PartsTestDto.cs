namespace Technicians.Api.Models
{
    public class PartsTestRequest
    {
        public int RowIndex { get; set; } = 0;
        public string? Source { get; set; } = "PartsTest";
    }

    /// Complete DTO for Parts Test operations including SaveUpdate functionality
    public class PartsTestDto
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

        // Work Status Information
        public string BoardStatus { get; set; } = string.Empty;
        public string CompWorkDone { get; set; } = string.Empty;
        public string CompWorkStatus { get; set; } = string.Empty;
        public string TestWorkDone { get; set; } = string.Empty;
        public string TestWorkStatus { get; set; } = string.Empty;
        public string CompletedBy { get; set; } = string.Empty;
        public string ReviewedBy { get; set; } = string.Empty;
        public bool IsPassed { get; set; }

        // Assembly Work Information
        public string AssyWorkDone { get; set; } = string.Empty;
        public string AssyProcFollowed { get; set; } = string.Empty;
        public string AssyWorkStatus { get; set; } = string.Empty;

        // Quality Control Information
        public string QCWorkDone { get; set; } = string.Empty;
        public string QCProcFollowed { get; set; } = string.Empty;
        public string QCApproved { get; set; } = string.Empty;
        public string QCWorkStatus { get; set; } = string.Empty;

        // Audit Information
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }
        public bool Approved { get; set; }
        public DateTime? ApprovedOn { get; set; }
        public bool Archive { get; set; } = false;
        public string? SubmittedDate { get; set; }

        // Legacy Compatibility Properties (for backward compatibility)
        public string TestedBy { get; set; } = string.Empty;        // Maps to CompletedBy
        public string VerifiedBy { get; set; } = string.Empty;      // Maps to ReviewedBy  
        public string Maint_Auth_ID { get; set; } = string.Empty;   // Maps to CreatedBy

        // ADD MISSING PROPERTIES FROM LEGACY:
        public string AutoGenID { get; set; } = string.Empty;           
        public string SubmittedOn { get; set; } = string.Empty;         
        public string InvUserID { get; set; } = string.Empty;          
        public bool QCPassed { get; set; }                              // Legacy: chkQCPassed.Checked
        public string BoardSetupStatus { get; set; } = string.Empty;    // Legacy: ddlBoardSetup.SelectedValue
        public string QCApprovedBy { get; set; } = string.Empty;        // Legacy: ddlQCApprovedBy.SelectedValue
    }

    /// <summary>
    /// Response wrapper for Parts Test operations
    /// </summary>
    public class PartsTestResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public PartsTestDto? Data { get; set; }
        public object? Tables { get; set; } // For DataSet responses
    }

    /// <summary>
    /// Response for Save/Update operations
    /// </summary>
    public class SaveUpdatePartsTestResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public int RowIndex { get; set; }
    }

    /// <summary>
    /// Request for archiving a parts test record
    /// </summary>
    public class ArchiveRecordRequest
    {
        public int RowIndex { get; set; }
    }
}