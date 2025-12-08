using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    public class OrderRequestDto
    {
        public int RowIndex { get; set; }
        
        public string? OrderType { get; set; }
        
        public string? Requester { get; set; }
        
        public string? DCGPartNo { get; set; }
        
        public string? ManufPartNo { get; set; }
        
        public string? Vendor { get; set; }
        
        public int? QtyNeeded { get; set; }
        
        public string? PONumber { get; set; }
        
        public DateTime? OrderDate { get; set; }
        
        public DateTime? ArriveDate { get; set; }
        
        public string? Notes { get; set; }
        
        public string? Status { get; set; }
        
        [Required]
        [StringLength(125)]
        public string LastModifiedBy { get; set; } = string.Empty;
    }

    public class OrderRequestResponseDto : OrderRequestDto
    {
        [StringLength(125)]
        public string? CreatedBy { get; set; }
        
        public DateTime? CreatedOn { get; set; }
        
        [StringLength(125)]
        public string? ModifiedBy { get; set; }
        
        public DateTime? ModifiedOn { get; set; }
        
        public bool Archive { get; set; }
    }

    public class FileUploadResult
    {
        public string FileName { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
    }

    /// <summary>
    /// Information about uploaded files for order requests
    /// </summary>
    public class OrderRequestFileInfo
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSizeKB { get; set; }
        public DateTime UploadedOn { get; set; }
        public string FilePath { get; set; } = string.Empty;
    }
}