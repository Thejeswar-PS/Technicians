namespace Technicians.Api.Models
{
    public class PartReqStatusResponseDto
    {
        public List<PartReqStatusDto> PartRequests { get; set; } = new List<PartReqStatusDto>();
        public int CrashKitCount { get; set; }
        public int LoadBankCount { get; set; }
    }
}