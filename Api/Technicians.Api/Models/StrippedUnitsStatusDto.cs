namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for GetStrippedUnitsStatus stored procedure main result
    /// </summary>
    public class StrippedUnitsStatusDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string PONumber { get; set; } = string.Empty;
        public string ShippingPO { get; set; } = string.Empty;
        public decimal? UnitCost { get; set; }
        public decimal? ShipCost { get; set; }
        public string StrippedBy { get; set; } = string.Empty;
        public string PutAwayBy { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public int RowIndex { get; set; }
        public int StripExists { get; set; }
    }

    /// <summary>
    /// DTO for Make count statistics from GetStrippedUnitsStatus
    /// </summary>
    public class MakeCountDto
    {
        public string Make { get; set; } = string.Empty;
        public int MakeCount { get; set; }
    }

    /// <summary>
    /// Request DTO for GetStrippedUnitsStatus endpoint
    /// </summary>
    public class StrippedUnitsStatusRequest
    {
        public string Status { get; set; } = "All";
        public int RowIndex { get; set; } = 0;
    }

    /// <summary>
    /// Complete response DTO for GetStrippedUnitsStatus
    /// </summary>
    public class StrippedUnitsStatusResponse
    {
        public List<StrippedUnitsStatusDto> UnitsData { get; set; } = new();
        public List<MakeCountDto> MakeCounts { get; set; } = new();
    }
}