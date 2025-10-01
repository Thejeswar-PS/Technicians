namespace Technicians.Api.Models
{
    public class LoginVM
    {
        public int EmpNo { get; set; }
        public string EmpID { get; set; }
        public string EmpName { get; set; }
        public string EmpStatus { get; set; }
        public string WindowsID { get; set; }
        public int EmpLevel { get; set; }
        public bool FirstTimeLogin { get; set; }
    }
}
