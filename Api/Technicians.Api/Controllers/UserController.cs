using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserRepository _repository;

        public UserController(UserRepository repository)
        {
            _repository = repository;
        }

        [HttpPost]
        [Route("Login")]
        public async Task<ActionResult> Login([FromBody] LoginModel model)
        {
            var result = await _repository.ValidateUser(model);
            return Ok(result);
        }
        [HttpPut]
        [Route("UpdatePassword")]
        public async Task<ActionResult> UpdatePassword([FromBody] UpdatePasswordModel model)
        {
            await _repository.UpdatePassword(model);
            return Ok();
        }

    }
}
