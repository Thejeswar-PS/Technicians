using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DCGEmployeeController : ControllerBase
    {
        private readonly DCGEmployeeRepository _repository;
        private readonly ILogger<DCGEmployeeController> _logger;

        public DCGEmployeeController(
            DCGEmployeeRepository repository,
            ILogger<DCGEmployeeController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        #region DCG Employee Operations

        /// <summary>
        /// Gets all DCG employees with optional sorting
        /// GET /api/DCGEmployee/employees?sortBy=EmpName
        /// </summary>
        [HttpGet("employees")]
        public async Task<ActionResult<DCGApiResponse<List<DCGEmployeeDto>>>> GetDCGEmployees([FromQuery] string sortBy = "EmpName")
        {
            try
            {
                _logger.LogInformation("Getting DCG employees with sortBy: {SortBy}", sortBy);

                var employees = await _repository.GetDCGEmployeesAsync(sortBy);

                return Ok(new DCGApiResponse<List<DCGEmployeeDto>>
                {
                    Success = true,
                    Data = employees,
                    Message = $"Successfully retrieved {employees.Count} DCG employees"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DCG employees");
                
                return StatusCode(500, new DCGApiResponse<List<DCGEmployeeDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve DCG employees",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets a specific DCG employee by EmpNo
        /// GET /api/DCGEmployee/employees/123
        /// </summary>
        [HttpGet("employees/{empNo}")]
        public async Task<ActionResult<DCGApiResponse<DCGEmployeeDto>>> GetDCGEmployee(int empNo)
        {
            try
            {
                _logger.LogInformation("Getting DCG employee with EmpNo: {EmpNo}", empNo);

                var employee = await _repository.GetDCGEmployeeByIdAsync(empNo);

                if (employee == null)
                {
                    return NotFound(new DCGApiResponse<DCGEmployeeDto>
                    {
                        Success = false,
                        Message = $"DCG employee with EmpNo {empNo} not found"
                    });
                }

                return Ok(new DCGApiResponse<DCGEmployeeDto>
                {
                    Success = true,
                    Data = employee,
                    Message = "DCG employee retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DCG employee with EmpNo: {EmpNo}", empNo);
                
                return StatusCode(500, new DCGApiResponse<DCGEmployeeDto>
                {
                    Success = false,
                    Message = "Failed to retrieve DCG employee",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Creates a new DCG employee
        /// POST /api/DCGEmployee/employees
        /// </summary>
        [HttpPost("employees")]
        public async Task<ActionResult<DCGApiResponse<int>>> CreateDCGEmployee([FromBody] CreateDCGEmployeeDto employee)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new DCGApiResponse<int>
                {
                    Success = false,
                    Message = "Invalid employee data",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                });
            }

            try
            {
                _logger.LogInformation("Creating DCG employee: {EmpName}", employee.EmpName);

                var empNo = await _repository.CreateDCGEmployeeAsync(employee);

                return CreatedAtAction(
                    nameof(GetDCGEmployee),
                    new { empNo },
                    new DCGApiResponse<int>
                    {
                        Success = true,
                        Data = empNo,
                        Message = "DCG employee created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating DCG employee: {EmpName}", employee.EmpName);
                
                return StatusCode(500, new DCGApiResponse<int>
                {
                    Success = false,
                    Message = "Failed to create DCG employee",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Updates an existing DCG employee
        /// PUT /api/DCGEmployee/employees/123
        /// </summary>
        [HttpPut("employees/{empNo}")]
        public async Task<ActionResult<DCGApiResponse<bool>>> UpdateDCGEmployee(int empNo, [FromBody] UpdateDCGEmployeeDto employee)
        {
            if (empNo != employee.EmpNo)
            {
                return BadRequest(new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "EmpNo in URL does not match EmpNo in request body"
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Invalid employee data",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                });
            }

            try
            {
                _logger.LogInformation("Updating DCG employee with EmpNo: {EmpNo}", empNo);

                var success = await _repository.UpdateDCGEmployeeAsync(employee);

                if (!success)
                {
                    return NotFound(new DCGApiResponse<bool>
                    {
                        Success = false,
                        Message = $"DCG employee with EmpNo {empNo} not found"
                    });
                }

                return Ok(new DCGApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "DCG employee updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating DCG employee with EmpNo: {EmpNo}", empNo);
                
                return StatusCode(500, new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to update DCG employee",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Deletes a DCG employee
        /// DELETE /api/DCGEmployee/employees/123
        /// </summary>
        [HttpDelete("employees/{empNo}")]
        public async Task<ActionResult<DCGApiResponse<bool>>> DeleteDCGEmployee(int empNo)
        {
            try
            {
                _logger.LogInformation("Deleting DCG employee with EmpNo: {EmpNo}", empNo);

                var success = await _repository.DeleteDCGEmployeeAsync(empNo);

                if (!success)
                {
                    return NotFound(new DCGApiResponse<bool>
                    {
                        Success = false,
                        Message = $"DCG employee with EmpNo {empNo} not found"
                    });
                }

                return Ok(new DCGApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "DCG employee deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting DCG employee with EmpNo: {EmpNo}", empNo);
                
                return StatusCode(500, new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete DCG employee",
                    Error = ex.Message
                });
            }
        }

        #endregion

        #region Office State Assignment Operations

        /// <summary>
        /// Gets all office state assignments with optional sorting
        /// GET /api/DCGEmployee/office-assignments?sortBy=State
        /// </summary>
        [HttpGet("office-assignments")]
        public async Task<ActionResult<DCGApiResponse<List<OfficeStateAssignmentDto>>>> GetOfficeStateAssignments([FromQuery] string sortBy = "State")
        {
            try
            {
                _logger.LogInformation("Getting office state assignments with sortBy: {SortBy}", sortBy);

                var assignments = await _repository.GetOfficeStateAssignmentsAsync(sortBy);

                return Ok(new DCGApiResponse<List<OfficeStateAssignmentDto>>
                {
                    Success = true,
                    Data = assignments,
                    Message = $"Successfully retrieved {assignments.Count} office state assignments"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting office state assignments");
                
                return StatusCode(500, new DCGApiResponse<List<OfficeStateAssignmentDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve office state assignments",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets a specific office state assignment by State
        /// GET /api/DCGEmployee/office-assignments/CA
        /// </summary>
        [HttpGet("office-assignments/{state}")]
        public async Task<ActionResult<DCGApiResponse<OfficeStateAssignmentDto>>> GetOfficeStateAssignment(string state)
        {
            try
            {
                _logger.LogInformation("Getting office state assignment for state: {State}", state);

                var assignment = await _repository.GetOfficeStateAssignmentByStateAsync(state);

                if (assignment == null)
                {
                    return NotFound(new DCGApiResponse<OfficeStateAssignmentDto>
                    {
                        Success = false,
                        Message = $"Office state assignment for state {state} not found"
                    });
                }

                return Ok(new DCGApiResponse<OfficeStateAssignmentDto>
                {
                    Success = true,
                    Data = assignment,
                    Message = "Office state assignment retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting office state assignment for state: {State}", state);
                
                return StatusCode(500, new DCGApiResponse<OfficeStateAssignmentDto>
                {
                    Success = false,
                    Message = "Failed to retrieve office state assignment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Creates a new office state assignment
        /// POST /api/DCGEmployee/office-assignments
        /// </summary>
        [HttpPost("office-assignments")]
        public async Task<ActionResult<DCGApiResponse<bool>>> CreateOfficeStateAssignment([FromBody] CreateOfficeStateAssignmentDto assignment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Invalid assignment data",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                });
            }

            try
            {
                _logger.LogInformation("Creating office state assignment for state: {State}", assignment.State);

                var success = await _repository.CreateOfficeStateAssignmentAsync(assignment);

                return CreatedAtAction(
                    nameof(GetOfficeStateAssignment),
                    new { state = assignment.State },
                    new DCGApiResponse<bool>
                    {
                        Success = true,
                        Data = success,
                        Message = "Office state assignment created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating office state assignment for state: {State}", assignment.State);
                
                return StatusCode(500, new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to create office state assignment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Updates an existing office state assignment
        /// PUT /api/DCGEmployee/office-assignments/CA
        /// </summary>
        [HttpPut("office-assignments/{state}")]
        public async Task<ActionResult<DCGApiResponse<bool>>> UpdateOfficeStateAssignment(string state, [FromBody] UpdateOfficeStateAssignmentDto assignment)
        {
            if (state != assignment.State)
            {
                return BadRequest(new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "State in URL does not match State in request body"
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Invalid assignment data",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                });
            }

            try
            {
                _logger.LogInformation("Updating office state assignment for state: {State}", state);

                var success = await _repository.UpdateOfficeStateAssignmentAsync(assignment);

                if (!success)
                {
                    return NotFound(new DCGApiResponse<bool>
                    {
                        Success = false,
                        Message = $"Office state assignment for state {state} not found"
                    });
                }

                return Ok(new DCGApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Office state assignment updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating office state assignment for state: {State}", state);
                
                return StatusCode(500, new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to update office state assignment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Deletes an office state assignment
        /// DELETE /api/DCGEmployee/office-assignments/CA
        /// </summary>
        [HttpDelete("office-assignments/{state}")]
        public async Task<ActionResult<DCGApiResponse<bool>>> DeleteOfficeStateAssignment(string state)
        {
            try
            {
                _logger.LogInformation("Deleting office state assignment for state: {State}", state);

                var success = await _repository.DeleteOfficeStateAssignmentAsync(state);

                if (!success)
                {
                    return NotFound(new DCGApiResponse<bool>
                    {
                        Success = false,
                        Message = $"Office state assignment for state {state} not found"
                    });
                }

                return Ok(new DCGApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Office state assignment deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting office state assignment for state: {State}", state);
                
                return StatusCode(500, new DCGApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete office state assignment",
                    Error = ex.Message
                });
            }
        }

        #endregion

        #region Combined Operations

        /// <summary>
        /// Gets DCG employee details (employees and/or office assignments)
        /// Replicates the dual-grid functionality from legacy page
        /// GET /api/DCGEmployee/details?gridType=E&sortBy=EmpName
        /// </summary>
        [HttpGet("details")]
        public async Task<ActionResult<DCGApiResponse<DCGEmpDetailsResponse>>> GetDCGEmpDetails(
            [FromQuery] string gridType = "E", 
            [FromQuery] string sortBy = "")
        {
            try
            {
                _logger.LogInformation("Getting DCG employee details with gridType: {GridType}, sortBy: {SortBy}", gridType, sortBy);

                var details = await _repository.GetDCGEmpDetailsAsync(gridType, sortBy);

                return Ok(new DCGApiResponse<DCGEmpDetailsResponse>
                {
                    Success = true,
                    Data = details,
                    Message = $"Successfully retrieved DCG employee details (GridType: {gridType})"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DCG employee details");
                
                return StatusCode(500, new DCGApiResponse<DCGEmpDetailsResponse>
                {
                    Success = false,
                    Message = "Failed to retrieve DCG employee details",
                    Error = ex.Message
                });
            }
        }

        #endregion
    }
}