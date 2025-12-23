using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class NewDisplayCallsGraphRepository
    {
        private readonly string _connectionString;

        public NewDisplayCallsGraphRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
        }

        public async Task<AcctStatusGraphDto?> GetAcctStatusAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryFirstOrDefaultAsync<AcctStatusGraphDto>(
                "NewDisplayCallsGraph",
                new { pDetailPage = "AcctStatus" },
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120  // 2 minutes timeout
            );
        }

        public async Task<AccMgmtGraphDto?> GetAccMgmtAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryFirstOrDefaultAsync<AccMgmtGraphDto>(
                "NewDisplayCallsGraph",
                new { pDetailPage = "AccMgmtGraph" },
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120  // 2 minutes timeout
            );
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerPaperworkAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryAsync<AccountManagerPaperworkDto>(
                "DisplayActMngrGraph",
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120  // 2 minutes timeout
            );
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerQuoteGraphAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryAsync<AccountManagerPaperworkDto>(
                "DisplayActMngrQuoteGraph",
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120  // 2 minutes timeout
            );
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerUnscheduledGraphAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            return await connection.QueryAsync<AccountManagerPaperworkDto>(
                "DisplayActMngrUnschGraph",
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120  // 2 minutes timeout
            );
        }
    }
}
