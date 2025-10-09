using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReconciliationEmailNotesController : Controller
    {
        private readonly ReconciliationEmailNotesRepository _ReconciliationEmailNotesRepository;

        public ReconciliationEmailNotesController(ReconciliationEmailNotesRepository ReconciliationEmailNotesRepository)
        {
            _ReconciliationEmailNotesRepository = ReconciliationEmailNotesRepository;
        }

        /// <summary>
        /// Gets reconciliation email notes for a call number.
        /// </summary>
        /// <param name="callNbr">The call number.</param>
        /// <returns>List of reconciliation email notes.</returns>
        [HttpGet("email-notes/{callNbr}")]
        [ProducesResponseType(typeof(IEnumerable<ReconciliationEmailNoteDto>), 200)]
        public async Task<IActionResult> GetReconciliationEmailNotes(string callNbr)
        {
            var result = await _ReconciliationEmailNotesRepository.GetReconciliationEmailNotesAsync(callNbr);
            return Ok(result);
        }
    }
}
