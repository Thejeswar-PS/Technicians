namespace Technicians.Api.Models
{
    public class PartsTobeReceivedByWHDto
    {
        public int JobsCount { get; set; }
        public int Faulty { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class PartsTobeReceivedByWHSummaryDto
    {
        public int UnUsedTR { get; set; }
        public int FaultyTR { get; set; }
    }

    public class PartsTobeReceivedByWHRequestDto
    {
        public int Year { get; set; }
    }

    public class PartsTobeReceivedByWHResponseDto
    {
        public List<PartsTobeReceivedByWHDto> StaffData { get; set; } = new List<PartsTobeReceivedByWHDto>();
        public PartsTobeReceivedByWHSummaryDto Summary { get; set; } = new PartsTobeReceivedByWHSummaryDto();
    }
}