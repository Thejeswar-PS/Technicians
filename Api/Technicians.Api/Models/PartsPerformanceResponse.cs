namespace Technicians.Api.Models
{
    public class PartsPerformanceResponse
    {
        public List<MonthlyCountDto> FoldersPerMonth { get; set; }
        public List<MonthlyAvgDto> AvgFolderDays { get; set; }
        public List<ReturnStatusDto> PartsReturnedStatus { get; set; }
        public List<MonthlyAvgDto> AvgReturnDays { get; set; }
        public List<TestStatusDto> PartsTestedStatus { get; set; }
        public List<MonthlyAvgDto> AvgTestingDays { get; set; }
        public List<CategoryCountDto> PartsUnitsByCategory { get; set; }
    }

    public class MonthlyCountDto
    {
        public string MonthName { get; set; }
        public int Folders { get; set; }
    }

    public class MonthlyAvgDto
    {
        public string MonthName { get; set; }
        public decimal AvgDays { get; set; }
    }

    public class ReturnStatusDto
    {
        public string MonthName { get; set; }
        public int ReturnedParts { get; set; }
        public int NotReturned { get; set; }
    }

    public class TestStatusDto
    {
        public string MonthName { get; set; }
        public int Tested { get; set; }
        public int NotTested { get; set; }
    }

    public class CategoryCountDto
    {
        public string Category { get; set; }
        public int PartsCount { get; set; }
    }

}
