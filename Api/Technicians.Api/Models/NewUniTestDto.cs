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
    /// </summary>
    public class MoveUnitToStrippingDto
    {
        public int RowIndex { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public string PONumber { get; set; } = string.Empty;
        public string ShippingPO { get; set; } = string.Empty;
        public decimal? UnitCost { get; set; }
        public decimal? ShipCost { get; set; }
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
    /// </summary>
    public class SaveUpdateNewUnitTestDto
    {
        public int RowIndex { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string ProblemNotes { get; set; } = string.Empty;
        public bool Approved { get; set; }
        public bool Archive { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for SaveUpdateNewUnitResult stored procedure request
    /// </summary>
    public class SaveUpdateNewUnitResultDto
    {
        public int RowIndex { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public string TestProcedures { get; set; } = string.Empty;
        public string TestedBy { get; set; } = string.Empty;
    }
}