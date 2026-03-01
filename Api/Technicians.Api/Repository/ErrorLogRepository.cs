using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Technicians.Api.Repository
{
    /// <summary>
    /// Central error logging repository that writes to [DCGETech].[dbo].[Log].
    /// Inject this into any repository or controller that needs DB error logging.
    /// 
    /// Table schema:
    ///   ID        int (identity)
    ///   Date      datetime
    ///   Logger    nvarchar   – e.g. "Technicians.CommonRepository"
    ///   Message   nvarchar   – exception message
    ///   AppName   nvarchar   – method name where the error occurred
    ///   CreatedBy nvarchar   – user / empId that triggered the operation
    /// </summary>
    public class ErrorLogRepository
    {
        private readonly string _connectionString;

        public ErrorLogRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found in configuration.");
        }

        /// <summary>
        /// Inserts an error log entry into the Log table.
        /// This method never throws – logging failures are silently swallowed
        /// so they do not mask the original exception.
        /// </summary>
        /// <param name="logger">Source identifier, e.g. "Technicians.CommonRepository"</param>
        /// <param name="message">The error/exception message</param>
        /// <param name="appName">Method name where the error occurred</param>
        /// <param name="createdBy">User ID or EmpId of the caller (can be empty)</param>
        public async Task LogErrorAsync(string logger, string message, string appName, string createdBy = "")
        {
            try
            {
                const string sql = @"
                    INSERT INTO [dbo].[Log] ([Date], [Logger], [Message], [AppName], [CreatedBy])
                    VALUES (@Date, @Logger, @Message, @AppName, @CreatedBy)";

                await using var connection = new SqlConnection(_connectionString);

                await connection.ExecuteAsync(sql, new
                {
                    Date = DateTime.Now,
                    Logger = logger,
                    Message = message,
                    AppName = appName,
                    CreatedBy = createdBy ?? string.Empty
                });
            }
            catch
            {
                // Swallow – logging must never break the caller.
            }
        }

        /// <summary>
        /// Convenience overload that extracts the message from an Exception object.
        /// </summary>
        public async Task LogErrorAsync(string logger, Exception ex, string appName, string createdBy = "")
        {
            var message = ex.InnerException != null
                ? $"{ex.Message} | InnerException: {ex.InnerException.Message}"
                : ex.Message;

            await LogErrorAsync(logger, message, appName, createdBy);
        }
    }
}
