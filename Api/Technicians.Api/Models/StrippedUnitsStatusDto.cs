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
        
        // These fields may not be returned by GetStrippedUnitsStatus but are used for updates
        public string PartsLocation { get; set; } = string.Empty;
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }
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

    /// <summary>
    /// DTO for SaveUpdateStrippedPartsInUnit stored procedure
    /// </summary>
    public class StrippedPartsInUnitDto
    {
        public int MasterRowIndex { get; set; }
        public int RowIndex { get; set; }
        public string DCGPartGroup { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string PartDesc { get; set; } = string.Empty;
        public string KeepThrow { get; set; } = string.Empty;
        public int StripNo { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public DateTime? LastModifiedOn { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for strip part codes dropdown data
    /// </summary>
    public class StripPartCodeDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for GetStrippedPartsInUnit stored procedure - Parts list result set
    /// </summary>
    public class StrippedPartsDetailDto
    {
        public string DCGPartNo { get; set; } = string.Empty;
        public string PartDesc { get; set; } = string.Empty;
        public string KeepThrow { get; set; } = string.Empty;
        public int StripNo { get; set; }
        public int RowIndex { get; set; }
        public string Group { get; set; } = string.Empty; // Maps to DCGPartGroup as 'Group'
    }

    /// <summary>
    /// DTO for GetStrippedPartsInUnit stored procedure - Group counts result set
    /// </summary>
    public class StrippedPartsGroupCountDto
    {
        public string DCGPartGroup { get; set; } = string.Empty;
        public int Count { get; set; }
        public string KeepThrow { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for GetStrippedPartsInUnit stored procedure - Cost analysis result set
    /// </summary>
    public class StrippedPartsCostAnalysisDto
    {
        public decimal PartPercent { get; set; } // Maps to 'Part %'
        public decimal DollarOfTotal { get; set; } // Maps to '$ of Total'
        public int Quantity { get; set; }
        public decimal DollarPerPart { get; set; } // Maps to '$Per Part'
        public string PartsStripped { get; set; } = string.Empty; // Maps to 'Parts Stripped'
    }

    /// <summary>
    /// DTO for GetStrippedPartsInUnit stored procedure - Parts location result set
    /// </summary>
    public class StrippedPartsLocationDto
    {
        public string PartsLocation { get; set; } = string.Empty;
    }

    /// <summary>
    /// Complete response DTO for GetStrippedPartsInUnit
    /// </summary>
    public class StrippedPartsInUnitResponse
    {
        public List<StrippedPartsDetailDto> PartsDetails { get; set; } = new();
        public List<StrippedPartsGroupCountDto> GroupCounts { get; set; } = new();
        public List<StrippedPartsCostAnalysisDto> CostAnalysis { get; set; } = new();
        public List<StrippedPartsLocationDto> PartsLocations { get; set; } = new();
        public bool HasData { get; set; }
        public int MasterRowIndex { get; set; }
    }
}