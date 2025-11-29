namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for parts received by warehouse chart data
    /// </summary>
    public class PartsReceivedByWHChartDto
    {
        public string Name { get; set; } = string.Empty;
        public int JobsCount { get; set; }
        public int Faulty { get; set; }
    }

    /// <summary>
    /// DTO for parts received by warehouse totals
    /// </summary>
    public class PartsReceivedByWHTotalsDto
    {
        public int UnUsedR { get; set; }
        public int FaultyR { get; set; }
    }

    /// <summary>
    /// Response DTO containing both chart data and totals for parts received by warehouse
    /// </summary>
    public class PartsReceivedByWHResponseDto
    {
        public List<PartsReceivedByWHChartDto> ChartData { get; set; } = new List<PartsReceivedByWHChartDto>();
        public PartsReceivedByWHTotalsDto Totals { get; set; } = new PartsReceivedByWHTotalsDto();
    }
}