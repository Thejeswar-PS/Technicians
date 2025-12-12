namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for GetPartsTestList endpoint
    /// </summary>
    public class PartsTestRequest
    {
        public int RowIndex { get; set; } = 0;
        public string? Source { get; set; } = "PartsTest";
    }
}