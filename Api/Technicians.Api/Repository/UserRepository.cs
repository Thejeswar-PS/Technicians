using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class UserRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        public UserRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");

        }

        public async Task UpdatePassword(UpdatePasswordModel model)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Username", model.Username, DbType.String, ParameterDirection.Input);
            parameters.Add("@Password", model.Password, DbType.String, ParameterDirection.Input);
            parameters.Add("@NewPassword", model.NewPassword, DbType.String, ParameterDirection.Input);

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                var results = (await connection.QueryAsync<int>("UpdatePassword", parameters, commandType: CommandType.StoredProcedure)).ToList();

                if (results.First() != 1)
                    throw new Exception("Something went wrong");
            }
        }


        public async Task<LoginVM> ValidateUser(LoginModel model)
        {

            var parameters = new DynamicParameters();
            parameters.Add("@Username", model.Username, DbType.String, ParameterDirection.Input);
            parameters.Add("@Password", model.Password, DbType.String, ParameterDirection.Input);

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                var results = (await connection.QueryAsync<LoginVM>("ValidateUser", parameters, commandType: CommandType.StoredProcedure)).ToList();
                if (results.Any())
                {
                    return results.First();
                }
                throw new Exception("Invalid username/password");
            }
        }
    }
}
