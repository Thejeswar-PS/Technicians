namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for GetEmployeeNamesByDept stored procedure
    /// </summary>
    public class EmployeeDto
    {
        public string EmpID { get; set; } = string.Empty;
        public string EmpName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string WindowsID { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for GetEmployeeNamesByDept endpoint
    /// </summary>
    public class EmployeeRequest
    {
        public string Department { get; set; } = string.Empty;
    }
}