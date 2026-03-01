namespace Technicians.Api.Models
{
    public class NewDisplayCallsDetailRequest
    {
        public string DetailPage { get; set; } = string.Empty;
        public string? OffId { get; set; }
    }

        public class NewDisplayCallsDetailResponse
        {
            public IEnumerable<dynamic> Data { get; set; } = new List<dynamic>();

            // Some SP cases return total as second result set
            public IEnumerable<dynamic>? Totals { get; set; }
        }
    
}