using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

[ApiController]
[Route("api/[controller]")]
public class PartsController : ControllerBase
{
    private readonly SaveUpdatePartsReqRepository _repository;

    public PartsController(SaveUpdatePartsReqRepository repository)
    {
        _repository = repository;
    }

    [HttpPost("SaveOrUpdateParts")]
    public async Task<IActionResult> SaveOrUpdateParts([FromBody] SaveUpdatePartsReqDto request)
    {
        if (request == null)
            return BadRequest("Request body is null");

        await _repository.SaveOrUpdatePartsAsync(request);

        return Ok(new { message = "Parts request saved/updated successfully" });
    }
}
