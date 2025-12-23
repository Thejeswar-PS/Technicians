using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/calls-graph")]
    public class NewDisplayCallsGraphController : ControllerBase
    {
        private readonly NewDisplayCallsGraphRepository _repository;

        public NewDisplayCallsGraphController(NewDisplayCallsGraphRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("acct-status")]
        public async Task<ActionResult<AcctStatusGraphDto>> GetAcctStatus()
        {
            return Ok(await _repository.GetAcctStatusAsync());
        }

        [HttpGet("acct-management")]
        public async Task<ActionResult<AccMgmtGraphDto>> GetAccMgmt()
        {
            return Ok(await _repository.GetAccMgmtAsync());
        }

        [HttpGet("account-manager-paperwork")]
        public async Task<ActionResult<IEnumerable<AccountManagerPaperworkDto>>> GetAccountManagerPaperwork()
        {
            try
            {
                var result = await _repository.GetAccountManagerPaperworkAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("account-manager-quote-graph")]
        public async Task<ActionResult<IEnumerable<AccountManagerPaperworkDto>>> GetAccountManagerQuoteGraph()
        {
            try
            {
                var result = await _repository.GetAccountManagerQuoteGraphAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("account-manager-unscheduled")]
        public async Task<ActionResult<IEnumerable<AccountManagerPaperworkDto>>> GetAccountManagerUnscheduled()
        {
            try
            {
                var result = await _repository.GetAccountManagerUnscheduledGraphAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}