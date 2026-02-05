namespace Technicians.Api.Models
{
    public class CapFanUsageByYearResponse
    {
        public List<PartUsageByYearDto> Caps { get; set; }
        public List<PartUsageByYearDto> Fans { get; set; }
        public List<PartUsageByYearDto> Batteries { get; set; }
        public List<PartUsageByYearDto> IGB { get; set; }
        public List<PartUsageByYearDto> SCR { get; set; }
        public List<PartUsageByYearDto> FUS { get; set; }

        public List<PartUsageTotalByYearDto> CapsTotal { get; set; }
        public List<PartUsageTotalByYearDto> FansTotal { get; set; }
        public List<PartUsageTotalByYearDto> BatteriesTotal { get; set; }
        public List<PartUsageTotalByYearDto> IGBTotal { get; set; }
        public List<PartUsageTotalByYearDto> SCRTotal { get; set; }
        public List<PartUsageTotalByYearDto> FUSTotal { get; set; }
    }

    public class PartUsageByYearDto
    {
        public string PartNo { get; set; }
        public int Total { get; set; }
        public int Year { get; set; }
    }

    public class PartUsageTotalByYearDto
    {
        public int Total { get; set; }
        public int Year { get; set; }
    }

}
