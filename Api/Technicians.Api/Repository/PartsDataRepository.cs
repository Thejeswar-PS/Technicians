using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsDataRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public PartsDataRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }
        public async Task<List<PartsDataDto>> GetPartsDataAsync(string callNbr)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var results = await conn.QueryAsync<PartsDataDto>(
                    "[dbo].[GetPartsData]",
                    new { CallNbr = callNbr },
                    commandType: CommandType.StoredProcedure);

                return results.AsList();
            }
        }

        //2. Get Parts Equip Info by Call Number
        public async Task<IEnumerable<PartsEquipInfoDto>> GetPartsEquipInfoAsync(string callNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr, DbType.String, ParameterDirection.Input);

                return await connection.QueryAsync<PartsEquipInfoDto>(
                    "[dbo].[GetPartsEquipInfo]",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }

        //3. Get Tech Return Parts by Call Number
        public async Task<TechReturnPartsDto?> GetTechReturnPartsAsync(string callNbr)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var result = await conn.QueryFirstOrDefaultAsync<TechReturnPartsDto>(
                    "[dbo].[GetTechReturnPartsData]",
                    new { CallNbr = callNbr },
                    commandType: CommandType.StoredProcedure
                );

                // If not found, QueryFirstOrDefault returns null, so handle this:
                if (result == null)
                {
                    // SP will return { UnUsedSentBack = "9999" }, so it's covered
                    return new TechReturnPartsDto { UnUsedSentBack = "9999" };
                }
                return result;
            }
        }

        //4. Get Parts Req Data by Call Number and SCID_Inc
        public async Task<IEnumerable<PartsReqDataDto>> GetPartsReqData(string callNbr, int scidInc)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr, DbType.String);
                parameters.Add("@SCID_Inc", scidInc, DbType.Int32);

                return await conn.QueryAsync<PartsReqDataDto>(
                    "[dbo].[GetPartsReqData]",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }

        //5. Get Tech Parts Req Data by Call Number and SCID_Inc

        public async Task<List<TechPartDto>> GetTechPartsDataAsync(string callNbr, int scidInc)
        {
            var results = new List<TechPartDto>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("GetTechPartsData", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@SCID_Inc", scidInc);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new TechPartDto
                        {
                            Service_Call_ID = reader["Service_Call_ID"].ToString(),
                            SCID_INC = Convert.ToInt32(reader["SCID_INC"]),
                            PART_NUM = reader["PART_NUM"].ToString(),
                            DC_PART_NUM = reader["DC_PART_NUM"].ToString(),
                            TotalQty = Convert.ToInt32(reader["TotalQty"]),
                            DESCRIPTION = reader["DESCRIPTION"].ToString(),
                            InstalledParts = Convert.ToInt32(reader["InstalledParts"]),
                            UNUSEDPARTS = Convert.ToInt32(reader["UNUSEDPARTS"]),
                            FAULTYPARTS = Convert.ToInt32(reader["FAULTYPARTS"]),
                            UNUSED_DESC = reader["UNUSED_DESC"].ToString(),
                            FAULTY_DESC = reader["FAULTY_DESC"].ToString(),
                            MANUFACTURER = reader["MANUFACTURER"].ToString(),
                            MODELNO = reader["MODELNO"].ToString(),
                            PARTSOURCE = reader["PARTSOURCE"].ToString(),
                            CREATE_DATE = Convert.ToDateTime(reader["CREATE_DATE"]),
                            LASTMODIFIED = Convert.ToDateTime(reader["LASTMODIFIED"]),
                            LastModifiedBy = reader["LastModifiedBy"].ToString(),
                            ISRECEIVED = reader["ISRECEIVED"].ToString(),
                            ISBRANDNEW = reader["ISBRANDNEW"].ToString(),
                            IsPartsLeft = reader["IsPartsLeft"].ToString(),
                            TrackingInfo = reader["TrackingInfo"].ToString()
                        });
                    }
                }
            }
            return results;
        }


        //6. Save or Update Tech Returned Parts
        public async Task SaveOrUpdateTechReturnedPartsAsync(TechReturnedPartsDto dto)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("SaveUpdateTechReturnedParts", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Service_Call_ID", dto.Service_Call_ID);
                command.Parameters.AddWithValue("@UnusedSentBack", dto.UnusedSentBack);
                command.Parameters.AddWithValue("@FaultySentBack", dto.FaultySentBack);
                command.Parameters.AddWithValue("@ReturnStatus", dto.ReturnStatus ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ReturnNotes", dto.ReturnNotes ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@TruckStock", dto.TruckStock);
                command.Parameters.AddWithValue("@TechName", dto.TechName ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Maint_Auth_ID", dto.Maint_Auth_ID ?? (object)DBNull.Value);

                await connection.OpenAsync();
                await command.ExecuteNonQueryAsync();
            }
        }

        //7. Save or Update Shipping Info
        public async Task SaveOrUpdateShippingInfoAsync(ShippingInfoDto request)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("SaveUpdateShippingInfo", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Service_Call_ID", request.Service_Call_ID);
                command.Parameters.AddWithValue("@TechID", request.TechID ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Technician", request.Technician ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ContactName", request.ContactName ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ContactPh", request.ContactPh ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@VerifyPh", request.VerifyPh);
                command.Parameters.AddWithValue("@ReqNotes", request.ReqNotes ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ShipNotes", request.ShipNotes ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Status", request.Status ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Source", request.Source);
                command.Parameters.AddWithValue("@Maint_Auth_ID", request.Maint_Auth_ID ?? (object)DBNull.Value);

                await connection.OpenAsync();
                await command.ExecuteNonQueryAsync();
            }
        }
    }
}

