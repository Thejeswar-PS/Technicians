namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for chart data representing parts to be received by warehouse
    /// </summary>
    public class PartsToBeReceivedChartDto
    {
        public int JobsCount { get; set; }
        public int Faulty { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for totals of parts to be received by warehouse
    /// </summary>
    public class PartsToBeReceivedTotalsDto
    {
        public int UnUsedTR { get; set; }
        public int FaultyTR { get; set; }
    }

    /// <summary>
    /// Response DTO containing both chart data and totals for parts to be received by warehouse
    /// </summary>
    public class PartsToBeReceivedResponseDto
    {
        public List<PartsToBeReceivedChartDto> ChartData { get; set; } = new List<PartsToBeReceivedChartDto>();
        public PartsToBeReceivedTotalsDto Totals { get; set; } = new PartsToBeReceivedTotalsDto();
    }
}