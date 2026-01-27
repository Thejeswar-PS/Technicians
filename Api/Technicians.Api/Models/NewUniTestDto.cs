using Technicians.Api.Models;

namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for GetNewUniTestList endpoint
    /// </summary>
    public class NewUniTestRequest
    {
        public int RowIndex { get; set; } = 0;
    }

    /// <summary>
    /// Complete response DTO for GetNewUniTestList
    /// Reuses UPSTestStatusDto to avoid duplication since both come from UPSTestUnits table
    /// </summary>
    public class NewUniTestResponse
    {
        public List<UPSTestStatusDto> UnitsData { get; set; } = new();
        public int TotalRecords => UnitsData.Count;
        public bool IsFiltered { get; set; } = false;
        public int FilteredRowIndex { get; set; } = 0;
    }

    /// <summary>
    /// DTO for MoveUnitToStripping stored procedure request
    /// Financial Information + Basic Info copied from main record
    /// </summary>
    public class MoveUnitToStrippingDto
    {
        // System Fields
        public int RowIndex { get; set; }
        
        // Basic Info (copied from main record)
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        
        // Financial Information
        public string PONumber { get; set; } = string.Empty;
        public string ShippingPO { get; set; } = string.Empty;
        public decimal? UnitCost { get; set; }
        public decimal? ShipCost { get; set; }
        
        // System Fields
        public string CreatedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for MoveUnitToStripping stored procedure
    /// </summary>
    public class MoveUnitToStrippingResponse
    {
        public bool Success { get; set; }
        public string Result { get; set; } = string.Empty;
        public int RowIndex { get; set; }
        public string Make { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for SaveUpdateNewUnitTest stored procedure request
    /// Complete field set matching legacy system usage
    /// </summary>
    public class SaveUpdateNewUnitTestDto
    {
        // System Fields
        public int RowIndex { get; set; }
        
        // Basic Unit Information (PT.ManufPartNo, PT.DCGPartNo, etc.)
        public string Make { get; set; } = string.Empty;  // PT.ManufPartNo - Equipment manufacturer
        public string Model { get; set; } = string.Empty; // PT.DCGPartNo - Equipment model
        public string KVA { get; set; } = string.Empty;   // PT.KVA - Power rating
        public string Voltage { get; set; } = string.Empty; // PT.Voltage - Voltage specification
        public string SerialNo { get; set; } = string.Empty; // PT.SerialNo - Unit serial number
        
        // Assignment & Scheduling
        public string Priority { get; set; } = string.Empty;   // PT.Priority - High, Normal, Low, At Convenience
        public string AssignedTo { get; set; } = string.Empty; // PT.AssignedTo - Technician assigned to the unit
        public DateTime? DueDate { get; set; }                 // PT.DueDate - Target completion date
        
        // Problem & Status
        public string ProblemNotes { get; set; } = string.Empty; // PT.ProblemNotes - Description of issues found (Deficiency Notes)
        public bool Approved { get; set; }                      // PT.Approved - Approval status (boolean)
        public bool Archive { get; set; }                       // PT.Archive - Archive status (boolean)
        
        // System Fields
        public string LastModifiedBy { get; set; } = string.Empty; // Automatically set to current user (getUID())
    }

    /// <summary>
    /// DTO for SaveUpdateNewUnitResult stored procedure request
    /// Test Results fields matching legacy system
    /// </summary>
    public class SaveUpdateNewUnitResultDto
    {
        // System Fields
        public int RowIndex { get; set; } // PT.RowIndex - Record identifier
        
        // Test Results
        public string Status { get; set; } = string.Empty;       // PT.Status - INP, NCR, MPJ, COM
        public string TestedBy { get; set; } = string.Empty;     // PT.TestedBy - Test Engineer (Who performed the test)
        public string ResolveNotes { get; set; } = string.Empty; // PT.ResolveNotes - Inspection Notes (Test results and resolution notes)
        public string TestProcedures { get; set; } = string.Empty; // PT.LoadTest - Test Procedures Followed (Yes, No, N/A)
    }

    /// <summary>
    /// Response DTO for DeleteNewUnitTest stored procedure
    /// </summary>
    public class DeleteNewUnitTestResponse
    {
        public bool Success { get; set; }
        public string Result { get; set; } = string.Empty;
        public int RowIndex { get; set; }
    }
}