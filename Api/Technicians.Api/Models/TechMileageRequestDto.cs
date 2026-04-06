using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    public class TechMileageDto
    {
        public DateTime Date { get; set; }
        public string JobNumber { get; set; }
        public string TechName { get; set; }
        public string JobType { get; set; }
        public string CustomerName { get; set; }
        public string Origin { get; set; }
        public string SiteAddress { get; set; }
        public decimal MilesReported { get; set; }
        public int TotalMinutes { get; set; }
        public decimal HoursDecimal { get; set; }
        public string TimeTakenHHMM { get; set; }
    }

    public class TechMileageMonthlySummaryDto
    {
        public IEnumerable<T> Data { get; set; }
        public int TotalRecords { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}

    public class PagedResult<T>
    {
        public IEnumerable<T> Data { get; set; }
        public int TotalRecords { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}
