using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExtranetUserClassesController : ControllerBase
    {
        private readonly ExtranetUserClassesRepository _repository;
        private readonly ILogger<ExtranetUserClassesController> _logger;

        public ExtranetUserClassesController(
            ExtranetUserClassesRepository repository,
            ILogger<ExtranetUserClassesController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets ExtranetUserClasses data from the database
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ExtranetUserClassesDto>>> GetExtranetUserClasses()
        {
            try
            {
                _logger.LogInformation("Getting ExtranetUserClasses data");

                var results = await _repository.GetExtranetUserClassesAsync();

                _logger.LogInformation("Successfully retrieved ExtranetUserClasses data - RecordCount: {RecordCount}", 
                    results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    message = "ExtranetUserClasses data retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ExtranetUserClasses data");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve ExtranetUserClasses data", 
                    error = ex.Message 
                });
            }
        }

        [HttpGet("{login}")]
        public async Task<IActionResult> GetByLogin(string login)
        {
            if (string.IsNullOrWhiteSpace(login))
                return BadRequest("Login is required.");

            try
            {
                _logger.LogInformation(
                    "Fetching ExtranetUserInfo for login {Login}", login);

                var user = await _repository.GetByLoginAsync(login);

                if (user == null)
                    return NotFound(new
                    {
                        message = $"No user found for login: {login}"
                    });

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching ExtranetUserInfo for login {Login}",
                    login);

                return StatusCode(500, new
                {
                    message = "Failed to retrieve ExtranetUserInfo",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// GET customer numbers by login
        /// </summary>
        [HttpGet("{login}/customer-numbers")]
        public async Task<IActionResult> GetCustomerNumbers(string login)
        {
            if (string.IsNullOrWhiteSpace(login))
                return BadRequest("Login is required.");

            try
            {
                _logger.LogInformation(
                    "Fetching customer numbers for login {Login}", login);

                var result = await _repository.GetCustomerNumbersAsync(login);

                if (!result.Any())
                    return NotFound(new
                    {
                        message = $"No customer numbers found for login: {login}"
                    });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching customer numbers for login {Login}",
                    login);

                return StatusCode(500, new
                {
                    message = "Failed to retrieve customer numbers",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// POST version (legacy-friendly)
        /// </summary>
        //[HttpPost("customer-numbers")]
        //public async Task<IActionResult> GetCustomerNumbersPost(
        //    [FromBody] string login)
        //{
        //    if (string.IsNullOrWhiteSpace(login))
        //        return BadRequest("Login is required.");

        //    try
        //    {
        //        _logger.LogInformation(
        //            "Fetching customer numbers for login {Login}", login);

        //        var result = await _repository.GetCustomerNumbersAsync(login);

        //        if (!result.Any())
        //            return NotFound(new
        //            {
        //                message = $"No customer numbers found for login: {login}"
        //            });

        //        return Ok(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(
        //            ex,
        //            "Error fetching customer numbers for login {Login}",
        //            login);

        //        return StatusCode(500, new
        //        {
        //            message = "Failed to retrieve customer numbers",
        //            error = ex.Message
        //        });
        //    }
        //}
        /// <summary>
        /// Adds a customer number for a login
        /// </summary>
        [HttpPost("{login}/customer-numbers/{custNmbr}")]
        public async Task<IActionResult> AddCustomerNumber(
            string login,
            string custNmbr)
        {
            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(custNmbr))
                return BadRequest("Login and customer number are required.");

            try
            {
                _logger.LogInformation(
                    "Adding customer number {CustNmbr} for login {Login}",
                    custNmbr, login);

                var message = await _repository.AddCustomerNumberAsync(login, custNmbr);

                // Preserve legacy behavior exactly
                if (message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message });
                }

                return Ok(new { message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error adding customer number {CustNmbr} for login {Login}",
                    custNmbr, login);

                return StatusCode(500, new
                {
                    message = "Failed to add customer number",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Saves or updates an extranet user
        /// </summary>
        /// <param name="request">User data to save/update</param>
        [HttpPost("save-update")]
        public async Task<IActionResult> SaveUpdateUser([FromBody] ExtranetSaveUpdateUserDto request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.Login) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.ClassID))
            {
                return BadRequest("Login, Password, and ClassID are required.");
            }

            try
            {
                _logger.LogInformation(
                    "Saving/updating extranet user {Login}", request.Login);

                var message = await _repository.SaveUpdateUserAsync(
                    request.Login?.Trim() ?? string.Empty,
                    request.Password?.Trim() ?? string.Empty,
                    request.ClassID?.Trim() ?? string.Empty,
                    request.CustomerName?.Trim() ?? string.Empty,
                    request.ContactName?.Trim() ?? string.Empty,
                    request.Address1?.Trim() ?? string.Empty,
                    request.Address2?.Trim() ?? string.Empty,
                    request.City?.Trim() ?? string.Empty,
                    request.State?.Trim() ?? string.Empty,
                    request.Zip?.Trim() ?? string.Empty,
                    request.Phone?.Trim() ?? string.Empty,
                    request.Email?.Trim() ?? string.Empty,
                    request.ViewFinancial,
                    request.UnderContract
                );

                return Ok(new { 
                    success = true,
                    message = message 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error saving/updating extranet user {Login}",
                    request.Login);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to save/update extranet user",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{username}")]
        public async Task<IActionResult> DeleteUser(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest("Username is required.");

            try
            {
                _logger.LogInformation("Deleting extranet user {Username}", username);

                var rowsAffected = await _repository.DeleteUserAsync(username);

                if (rowsAffected == 0)
                    return NotFound($"No user found with username '{username}'.");

                return Ok($"User '{username}' deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting extranet user {Username}", username);

                return StatusCode(500, "Failed to delete extranet user.");
            }
        }

        [HttpDelete("{login}/customer-numbers/{custNmbr}")]
        public async Task<IActionResult> DeleteCustomerNumber(string login, string custNmbr)
        {
            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(custNmbr))
                return BadRequest("Login and customer number are required.");

            try
            {
                _logger.LogInformation(
                    "Deleting customer number {CustNmbr} for login {Login}",
                    custNmbr, login);

                var message = await _repository.DeleteCustomerNumberAsync(login, custNmbr);

                return Ok(new { message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error deleting customer number {CustNmbr} for login {Login}",
                    custNmbr, login);

                return StatusCode(500, "Failed to delete customer number.");
            }
        }

    }
}





