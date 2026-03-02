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

            public IEnumerable<dynamic>? Totals { get; set; }
        }
    
}