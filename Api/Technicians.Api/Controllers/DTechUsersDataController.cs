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
        /// <param name="login">Login filter (optional)</param>
        /// <param name="siteID">Site ID filter (optional)</param>
        /// <param name="custName">Customer name filter (optional)</param>
        /// <param name="address">Address filter (optional)</param>
        /// <param name="email">Email filter (optional)</param>
        /// <param name="contact">Contact filter (optional)</param>
        /// <param name="svcSerialId">Service Serial ID filter (optional)</param>
        /// <returns>Filtered DTech users data</returns>
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

        /// <summary>
        /// Gets a specific DTech user by login
        /// </summary>
        /// <param name="login">The user login to retrieve</param>
        /// <returns>Single DTech user record or not found</returns>
        //[HttpGet("{login}")]
        //public async Task<ActionResult<DTechUsersDataDto>> GetDTechUserByLogin(string login)
        //{
        //    try
        //    {
        //        _logger.LogInformation("Getting DTech user by Login: {Login}", login);

        //        if (string.IsNullOrWhiteSpace(login))
        //        {
        //            return BadRequest(new { 
        //                success = false, 
        //                message = "Login is required" 
        //            });
        //        }

        //        var result = await _repository.GetDTechUserByLoginAsync(login);

        //        if (result == null)
        //        {
        //            return NotFound(new { 
        //                success = false, 
        //                message = $"DTech user with login '{login}' not found" 
        //            });
        //        }

        //        _logger.LogInformation("Successfully retrieved DTech user for Login: {Login}", login);

        //        return Ok(new
        //        {
        //            success = true,
        //            data = result
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting DTech user for Login: {Login}", login);
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to retrieve DTech user", 
        //            error = ex.Message 
        //        });
        //    }
        //}

        /// <summary>
        /// Gets all DTech users without any filtering
        /// </summary>
        ///// <returns>All DTech users</returns>
        //[HttpGet("all")]
        //public async Task<ActionResult<DTechUsersDataResponse>> GetAllDTechUsers()
        //{
        //    try
        //    {
        //        _logger.LogInformation("Getting all DTech users");

        //        var results = await _repository.GetAllDTechUsersAsync();

        //        _logger.LogInformation("Successfully retrieved all DTech users - RecordCount: {RecordCount}", 
        //            results.TotalRecords);

        //        return Ok(new
        //        {
        //            success = true,
        //            data = results,
        //            totalRecords = results.TotalRecords
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting all DTech users");
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to retrieve all DTech users", 
        //            error = ex.Message 
        //        });
        //    }
        //}

        /// <summary>
        /// Searches DTech users by a general search term across multiple fields
        /// </summary>
        /// <param name="searchTerm">Term to search for across login, site, customer, email, etc.</param>
        /// <returns>DTech users matching the search criteria</returns>
        //[HttpGet("search")]
        //public async Task<ActionResult<DTechUsersDataResponse>> SearchDTechUsers([FromQuery] string searchTerm)
        //{
        //    try
        //    {
        //        _logger.LogInformation("Searching DTech users with term: {SearchTerm}", searchTerm);

        //        var results = await _repository.SearchDTechUsersAsync(searchTerm);

        //        _logger.LogInformation("Successfully searched DTech users - RecordCount: {RecordCount}, SearchTerm: {SearchTerm}", 
        //            results.TotalRecords, searchTerm);

        //        return Ok(new
        //        {
        //            success = true,
        //            data = results,
        //            totalRecords = results.TotalRecords,
        //            searchTerm = searchTerm
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error searching DTech users with term: {SearchTerm}", searchTerm);
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to search DTech users", 
        //            error = ex.Message 
        //        });
        //    }
        //}

 
        /// <summary>
        /// Advanced filtering endpoint with POST method for complex queries
        /// </summary>
        /// <param name="request">Detailed filter criteria</param>
        /// <returns>Filtered DTech users data</returns>
        //[HttpPost("filter")]
        //public async Task<ActionResult<DTechUsersDataResponse>> FilterDTechUsers([FromBody] DTechUsersDataRequest request)
        //{
        //    try
        //    {
        //        if (request == null)
        //        {
        //            return BadRequest(new { 
        //                success = false, 
        //                message = "Invalid request payload" 
        //            });
        //        }

        //        _logger.LogInformation("Filtering DTech users with advanced criteria");

        //        // Validate request
        //        var validationErrors = _repository.ValidateRequest(request);
        //        if (validationErrors.Any())
        //        {
        //            return BadRequest(new
        //            {
        //                success = false,
        //                message = "Validation failed",
        //                errors = validationErrors
        //            });
        //        }

        //        var results = await _repository.GetDTechUsersDataAsync(request);

        //        _logger.LogInformation("Successfully filtered DTech users - RecordCount: {RecordCount}, IsFiltered: {IsFiltered}", 
        //            results.TotalRecords, results.IsFiltered);

        //        return Ok(new
        //        {
        //            success = true,
        //            data = results,
        //            totalRecords = results.TotalRecords,
        //            isFiltered = results.IsFiltered,
        //            filterCriteria = results.FilterCriteria
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error filtering DTech users");
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to filter DTech users", 
        //            error = ex.Message 
        //        });
        //    }
        //}
    }
}