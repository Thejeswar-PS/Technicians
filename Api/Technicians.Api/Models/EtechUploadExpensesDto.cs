namespace Technicians.Api.Models
{
    public class EtechUploadExpensesDto
    {
        public string CallNbr { get; set; } = string.Empty;
        public string TechName { get; set; } = string.Empty; // or TechId if more appropriate
    }
}
