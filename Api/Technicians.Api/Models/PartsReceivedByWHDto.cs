namespace Technicians.Api.Models
{
    public class PartsReceivedByWHDto
    {
        public int JobsCount { get; set; }
        public int Faulty { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class PartsReceivedByWHSummaryDto
    {
        public int UnUsedR { get; set; }
        public int FaultyR { get; set; }
    }

    public class PartsReceivedByWHRequestDto
    {
        public int Year { get; set; }
    }

    public class PartsReceivedByWHResponseDto
    {
        public List<PartsReceivedByWHDto> StaffData { get; set; } = new List<PartsReceivedByWHDto>();
        public PartsReceivedByWHSummaryDto Summary { get; set; } = new PartsReceivedByWHSummaryDto();
    }
}