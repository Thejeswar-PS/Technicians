namespace Technicians.Api.Models
{
    public class NewDisplayCallsDetailRequest
    {
        public string DetailPage { get; set; } = string.Empty;
        public string? OffId { get; set; }
        
        /// <summary>
        /// Page number (1-based indexing). If not provided, returns all results.
        /// </summary>
        public int? Page { get; set; }
        
        /// <summary>
        /// Number of items per page (default: 100, max: 1000). Only used if Page is specified.
        /// </summary>
        public int PageSize { get; set; } = 100;
        
        /// <summary>
        /// Maximum number of results to return (default: unlimited, max: 10000)
        /// </summary>
        public int? MaxResults { get; set; }
    }

    public class NewDisplayCallsDetailResponse
    {
        public IEnumerable<dynamic> Data { get; set; } = new List<dynamic>();
        public IEnumerable<dynamic>? Totals { get; set; }
        
        /// <summary>
        /// Current page number (only set when pagination is used)
        /// </summary>
        public int? Page { get; set; }
        
        /// <summary>
        /// Number of items per page (only set when pagination is used)
        /// </summary>
        public int? PageSize { get; set; }
        
        /// <summary>
        /// Total number of records available
        /// </summary>
        public int TotalRecords { get; set; }
        
        /// <summary>
        /// Total pages available (only set when pagination is used)
        /// </summary>
        public int? TotalPages { get; set; }
        
        /// <summary>
        /// Whether results were limited/truncated
        /// </summary>
        public bool IsLimited { get; set; }
        
        /// <summary>
        /// Maximum results limit that was applied
        /// </summary>
        public int? MaxResultsApplied { get; set; }
    }
}