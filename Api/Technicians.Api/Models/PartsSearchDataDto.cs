namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for GetPartsSearchData stored procedure
    /// </summary>
    public class PartsSearchRequestDto
    {
        public string Address { get; set; } = string.Empty;
        public string Status { get; set; } = "%";
        public string SiteID { get; set; } = "%";
        public string Make { get; set; } = "%";
        public string Model { get; set; } = "%";
        public string KVA { get; set; } = "%";
        public string IPVoltage { get; set; } = "%";
        public string OPVoltage { get; set; } = "%";
        public string ManufPartNo { get; set; } = "%";
        public string DCGPartNo { get; set; } = "%";
    }

    /// <summary>
    /// Response DTO for GetPartsSearchData stored procedure results
    /// Matches the actual SP output columns exactly
    /// </summary>
    public class PartsSearchDataDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string CUSTNMBR { get; set; } = string.Empty; // Maps to SiteID from SP
        public string Status { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        
        public string IOVolt { get; set; } = string.Empty;
        
        public string ManufPartNo { get; set; } = string.Empty;
        public string DCGPartNo { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty; // Maps to SvcDescr from SP
        public DateTime? RequestedDate { get; set; }
    }

    /// <summary>
    /// Response wrapper for PartsSearchData
    /// </summary>
    public class PartsSearchDataResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public List<PartsSearchDataDto> Data { get; set; } = new List<PartsSearchDataDto>();
        public int TotalRecords { get; set; }
    }
}