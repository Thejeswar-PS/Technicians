using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;
using System.Threading.Tasks;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckSaveAsDraftEquipController : ControllerBase
    {
        private readonly CheckSaveAsDraftEquipRepository _repository;

        public CheckSaveAsDraftEquipController(CheckSaveAsDraftEquipRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("check-draft")]
        public async Task<ActionResult<CheckSaveAsDraftEquipResponse>> CheckSaveAsDraftEquip([FromBody] CheckSaveAsDraftEquipDto request)
        {
            var message = await _repository.CheckSaveAsDraftEquipAsync(request.CallNbr);
            return Ok(new CheckSaveAsDraftEquipResponse { Message = message });
        }

        // Change the accessibility of the nested class to public to match the method's accessibility
        public class CheckSaveAsDraftEquipResponse
        {
            public string Message { get; set; }
        }
    }
}