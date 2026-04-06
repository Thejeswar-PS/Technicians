using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechMileageController : ControllerBase
    {
        private readonly ITechMileageRepository _repository;

        public TechMileageController(ITechMileageRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("report")]
        public async Task<IActionResult> GetMileageReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string techName = "ALL",
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100)
        {
            if (pageNumber <= 0) pageNumber = 1;
            if (pageSize <= 0 || pageSize > 500) pageSize = 100;

            var result = await _repository.GetMileageReport(
                startDate,
                endDate,
                techName,
                pageNumber,
                pageSize
            );

            return Ok(result);
        }

        [HttpGet("GetTechMileageMonthlySummary")]
        public async Task<IActionResult> GetTechMileageMonthlySummary(
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate,
    [FromQuery] string techName = "ALL")
        {
            var result = await _repository.GetTechMileageMonthlySummary(
                startDate,
                endDate,
                techName
            );

            return Ok(result);
        }
    }
}
    
