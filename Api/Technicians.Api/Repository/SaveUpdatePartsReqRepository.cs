using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Technicians.Api.Models;

public class SaveUpdatePartsReqRepository
{
     
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public SaveUpdatePartsReqRepository(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection");

    }
    public async Task SaveOrUpdatePartsAsync(SaveUpdatePartsReqDto request)
    {
        using var connection = new SqlConnection(_connectionString);

        var parameters = new DynamicParameters();
        parameters.Add("@Service_Call_ID", request.Service_Call_ID);
        parameters.Add("@SCID_Inc", request.SCID_Inc);
        parameters.Add("@Qty", request.Qty);
        parameters.Add("@Part_Num", request.Part_Num);
        parameters.Add("@DC_Part_Num", request.DC_Part_Num);
        parameters.Add("@Description", request.Description);
        parameters.Add("@Destination", request.Destination);
        parameters.Add("@Required_Date", request.Required_Date);
        parameters.Add("@Required_Time", request.Required_Time);
        parameters.Add("@Urgent", request.Urgent == "Yes" ? 1 : 0);
        parameters.Add("@BackOrder", request.BackOrder == "Yes" ? 1 : 0);
        parameters.Add("@Shipping_Method", request.Shipping_Method);
        parameters.Add("@Maint_Auth_ID", request.Maint_Auth_ID);
        parameters.Add("@TechName", request.TechName);
        parameters.Add("@Location", request.Location);

        await connection.ExecuteAsync(
            "SaveUpdatePartsReq",
            parameters,
            commandType: CommandType.StoredProcedure
        );
    }
}
