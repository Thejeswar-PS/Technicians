using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for DCG_Employees table operations
    /// Maps to the fields used in the legacy DCGEmpDetails.aspx page
    /// </summary>
    public class DCGEmployeeDto
    {
        public int EmpNo { get; set; }
        public string EmpID { get; set; } = string.Empty;
        public string EmpName { get; set; } = string.Empty;
        public string EmpStatus { get; set; } = string.Empty;
        public string WindowsID { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for aaOfficeIDStateAssignments table operations
    /// Maps to the fields used in the legacy DCGEmpDetails.aspx page
    /// </summary>
    public class OfficeStateAssignmentDto
    {
        public string State { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public string OffID { get; set; } = string.Empty;
        public string InvUserID { get; set; } = string.Empty;
        public string SubRegion { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for creating a new DCG employee
    /// All fields from the legacy FooterRow controls with length constraints
    /// </summary>
    public class CreateDCGEmployeeDto
    {
        [Required]
        [StringLength(20, ErrorMessage = "EmpID cannot exceed 20 characters")]
        public string EmpID { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, ErrorMessage = "EmpName cannot exceed 100 characters")]
        public string EmpName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50, ErrorMessage = "EmpStatus cannot exceed 50 characters")]
        public string EmpStatus { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, ErrorMessage = "WindowsID cannot exceed 100 characters")]
        public string WindowsID { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for updating a DCG employee
    /// Includes EmpNo for identification plus all updatable fields with length constraints
    /// </summary>
    public class UpdateDCGEmployeeDto
    {
        [Required]
        public int EmpNo { get; set; }
        
        [Required]
        [StringLength(20, ErrorMessage = "EmpID cannot exceed 20 characters")]
        public string EmpID { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, ErrorMessage = "EmpName cannot exceed 100 characters")]
        public string EmpName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50, ErrorMessage = "EmpStatus cannot exceed 50 characters")]
        public string EmpStatus { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, ErrorMessage = "WindowsID cannot exceed 100 characters")]
        public string WindowsID { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for creating a new office state assignment
    /// All fields from the legacy FooterRow controls
    /// </summary>
    public class CreateOfficeStateAssignmentDto
    {
        [Required]
        public string State { get; set; } = string.Empty;
        
        [Required]
        public string StateName { get; set; } = string.Empty;
        
        [Required]
        public string OffID { get; set; } = string.Empty;
        
        [Required]
        public string InvUserID { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO for updating an office state assignment
    /// Uses State as identifier plus all updatable fields
    /// </summary>
    public class UpdateOfficeStateAssignmentDto
    {
        [Required]
        public string State { get; set; } = string.Empty;
        
        [Required]
        public string StateName { get; set; } = string.Empty;
        
        [Required]
        public string OffID { get; set; } = string.Empty;
        
        [Required]
        public string InvUserID { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for grid operations
    /// Combines both employee and office assignment data for the unified response
    /// </summary>
    public class DCGEmpDetailsResponse
    {
        public List<DCGEmployeeDto> Employees { get; set; } = new();
        public List<OfficeStateAssignmentDto> OfficeAssignments { get; set; } = new();
        public int EmployeeCount => Employees.Count;
        public int AssignmentCount => OfficeAssignments.Count;
        public string SortBy { get; set; } = string.Empty;
        public string GridType { get; set; } = "E"; // E for Employee, I for Inventory/Assignments
    }

    /// <summary>
    /// Generic API response wrapper
    /// </summary>
    public class DCGApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
    }
}