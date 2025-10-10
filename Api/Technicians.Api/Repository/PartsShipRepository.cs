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
    public class PartsShipRepository
    {
        private readonly string _connectionString;

        public PartsShipRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<int> SaveUpdatePartsShipAsync(SaveUpdatePartsShipDto model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("SaveUpdatePartsShip", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@Service_Call_ID", model.Service_Call_ID);
                    cmd.Parameters.AddWithValue("@SCID_Inc", model.SCID_Inc);
                    cmd.Parameters.AddWithValue("@Part_Num", model.Part_Num);
                    cmd.Parameters.AddWithValue("@DC_Part_Num", model.DC_Part_Num);
                    cmd.Parameters.AddWithValue("@Description", model.Description);
                    cmd.Parameters.AddWithValue("@Shipping_Company", model.Shipping_Company);
                    cmd.Parameters.AddWithValue("@Tracking_Num", model.Tracking_Num);
                    cmd.Parameters.AddWithValue("@Courier", model.Courier);
                    cmd.Parameters.AddWithValue("@Destination", model.Destination);
                    cmd.Parameters.AddWithValue("@Ship_Date", model.Ship_Date);
                    cmd.Parameters.AddWithValue("@Qty", model.Qty);
                    cmd.Parameters.AddWithValue("@Shipment_Type", model.Shipment_Type);
                    cmd.Parameters.AddWithValue("@Shipping_Cost", model.Shipping_Cost);
                    cmd.Parameters.AddWithValue("@Courier_Cost", model.Courier_Cost);
                    cmd.Parameters.AddWithValue("@ETA", model.ETA);
                    cmd.Parameters.AddWithValue("@Shipped_from", model.Shipped_from);
                    cmd.Parameters.AddWithValue("@Maint_Auth_ID", model.Maint_Auth_ID);
                    cmd.Parameters.AddWithValue("@BackOrder", model.BackOrder);

                    await conn.OpenAsync();
                    return await cmd.ExecuteNonQueryAsync();
                }
            }
        }
    }
}
