namespace Technicians.Api.Models
{
    public class WeeklyPartsReturnedDto
    {
        public string WkEnd { get; set; } = string.Empty;
        public int UnUsed { get; set; }
        public int Faulty { get; set; }
        public int WeekNo { get; set; }
    }

    public class WeeklyPartsReturnedResponseDto
    {
        public List<WeeklyPartsReturnedDto> WeeklyData { get; set; } = new List<WeeklyPartsReturnedDto>();
    }
}
