namespace Technicians.Api.Models
{
    public class PartReqStatusRequestDto
    {
        public int Key { get; set; }
        public string InvUserID { get; set; } = "All";
        public string OffName { get; set; } = "All";
        
        // New properties for role-based filtering
        public string? UserEmpID { get; set; }
        public string? WindowsID { get; set; }
    }
}