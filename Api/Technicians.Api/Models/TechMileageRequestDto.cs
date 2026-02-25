using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    /// Request DTO for GetTechMileageReport stored procedure
    public class TechMileageRequestDto
    {
        [Required]
        public string StartDate { get; set; } = string.Empty;

        [Required]
        public string EndDate { get; set; } = string.Empty;

        public string? TechName { get; set; }
    }

    /// DTO for individual tech mileage report record
    public class TechMileageRecordDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty;
        public string CustName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public decimal MilesReported { get; set; }
        public decimal HoursDecimal { get; set; }
        public string JobType { get; set; } = string.Empty;

        // Additional fields from stored procedure
        public int TotalMinutes { get; set; }
        public string TimeTaken { get; set; } = string.Empty;

    }

    /// DTO for monthly mileage summary chart data
    public class TechMileageMonthlySummaryDto
    {
        public string Month { get; set; } = string.Empty;
        public int TotalMiles { get; set; }
        public decimal TotalHours { get; set; }
    }

    /// Response DTO containing mileage records and summary data
    public class TechMileageResponseDto
    {
        public List<TechMileageRecordDto> MileageRecords { get; set; } = new();
        public List<TechMileageMonthlySummaryDto> MonthlySummary { get; set; } = new();
        public decimal TotalMiles { get; set; }
        public decimal TotalHours { get; set; }
        public int TotalJobs { get; set; }
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
    }

    /// DTO for technician dropdown
    public class TechMileageTechnicianDto
    {
        public string TechID { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty;
    }
}