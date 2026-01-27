namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for GetNewUPSTestStatus stored procedure main result
    /// </summary>
    public class UPSTestStatusDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNo { get; set; } = string.Empty;
        public string KVA { get; set; } = string.Empty;
        public string Voltage { get; set; } = string.Empty;
        public string PONumber { get; set; } = string.Empty;
        public string ShippingPO { get; set; } = string.Empty;
        
        // Change these to string to handle formatted currency values from database
        public string UnitCost { get; set; } = string.Empty;
        public string ShipCost { get; set; } = string.Empty;
        
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string TestProcedures { get; set; } = string.Empty;
        public string ProblemNotes { get; set; } = string.Empty;
        public string ResolveNotes { get; set; } = string.Empty;
        public string TestedBy { get; set; } = string.Empty;
        public string TestedOn { get; set; } = string.Empty;
        public bool Archive { get; set; }
        public bool Approved { get; set; }
        public DateTime? ApprovedOn { get; set; }
        public int RowIndex { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? CreatedOn { get; set; }
        public string LastModifiedBy { get; set; } = string.Empty;
        public DateTime? LastModifiedOn { get; set; }
        public bool ApprovalSent { get; set; }
        public bool ArchiveSent { get; set; }
        
        // Keep existing property for backward compatibility
        public string StripSNo { get; set; } = string.Empty;
        
        // Computed properties for parsed decimal values (optional, for calculations)
        public decimal? UnitCostDecimal 
        { 
            get 
            {
                if (string.IsNullOrEmpty(UnitCost)) return null;
                
                // Remove currency symbols and parse
                var cleanValue = UnitCost.Replace("$", "").Replace(",", "").Trim();
                return decimal.TryParse(cleanValue, out decimal result) ? result : null;
            }
        }
        
        public decimal? ShipCostDecimal 
        { 
            get 
            {
                if (string.IsNullOrEmpty(ShipCost)) return null;
                
                // Remove currency symbols and parse
                var cleanValue = ShipCost.Replace("$", "").Replace(",", "").Trim();
                return decimal.TryParse(cleanValue, out decimal result) ? result : null;
            }
        }
    }

    /// <summary>
    /// Request DTO for GetNewUPSTestStatus endpoint
    /// </summary>
    public class UPSTestStatusRequest
    {
        public string AssignedTo { get; set; } = "All";
        public string Status { get; set; } = "All";
        public string Priority { get; set; } = "All";
        public bool Archive { get; set; } = false;
    }

    /// <summary>
    /// Complete response DTO for GetNewUPSTestStatus
    /// </summary>
    public class UPSTestStatusResponse
    {
        public List<UPSTestStatusDto> UnitsData { get; set; } = new();
        public List<MakeCountDto> MakeCounts { get; set; } = new();
    }
}