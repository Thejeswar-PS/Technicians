using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DTechUsersDataController : ControllerBase
    {
        private readonly DTechUsersDataRepository _repository;
        private readonly ILogger<DTechUsersDataController> _logger;

        public DTechUsersDataController(
            DTechUsersDataRepository repository, 
            ILogger<DTechUsersDataController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets DTech users data with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<DTechUsersDataResponse>> GetDTechUsersData(
            [FromQuery] string? login = null,
            [FromQuery] string? siteID = null,
            [FromQuery] string? custName = null,
            [FromQuery] string? address = null,
            [FromQuery] string? email = null,
            [FromQuery] string? contact = null,
            [FromQuery] string? svcSerialId = null)
        {
            try
            {
                _logger.LogInformation("Getting DTech users data with filters - Login: {Login}, SiteID: {SiteID}, CustName: {CustName}", 
                    login, siteID, custName);

                var request = new DTechUsersDataRequest
                {
                    Login = string.IsNullOrEmpty(login) ? "%" : login,
                    SiteID = string.IsNullOrEmpty(siteID) ? "%" : siteID,
                    CustName = string.IsNullOrEmpty(custName) ? "%" : custName,
                    Address = address ?? string.Empty,
                    Email = string.IsNullOrEmpty(email) ? "%" : email,
                    Contact = string.IsNullOrEmpty(contact) ? "%" : contact,
                    SVC_Serial_ID = string.IsNullOrEmpty(svcSerialId) ? "%" : svcSerialId
                };

                // Validate request
                var validationErrors = _repository.ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                var results = await _repository.GetDTechUsersDataAsync(request);

                _logger.LogInformation("Successfully retrieved DTech users data - RecordCount: {RecordCount}, IsFiltered: {IsFiltered}", 
                    results.TotalRecords, results.IsFiltered);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.TotalRecords,
                    isFiltered = results.IsFiltered,
                    filterCriteria = results.FilterCriteria
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DTech users data");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve DTech users data", 
                    error = ex.Message 
                });
            }
        }
    }
}