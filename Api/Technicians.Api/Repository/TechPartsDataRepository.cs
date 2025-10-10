using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class TechPartsDataRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public TechPartsDataRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");

        }

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
    }
}
