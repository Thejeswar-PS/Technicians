using Dapper;
using Hangfire.Storage.Monitoring;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class TechToolsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpconnectionString;

        public TechToolsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        public async Task<TechToolsResponseDto?> GetTechToolsMiscKitAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@TechID", techId, DbType.String, size: 21);

            await connection.OpenAsync();

            using var multi = await connection.QueryMultipleAsync(
                "GetTechToolsMiscKitByTechID",
                parameters,
                commandType: CommandType.StoredProcedure);

            var tools = (await multi.ReadAsync<TechToolDto>()).AsList();
            var techInfo = await multi.ReadFirstOrDefaultAsync<TechInfoDto>();

            if (!tools.Any() && techInfo == null)
                return null;

            return new TechToolsResponseDto
            {
                Tools = tools,
                TechInfo = techInfo
            };
        }

        public async Task<TechToolsPpeMetersDto?> GetByTechIdAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@TechID", techId, DbType.String, size: 31);

            await connection.OpenAsync();

            return await connection.QuerySingleOrDefaultAsync<TechToolsPpeMetersDto>(
                "GetTechToolsPPEMeterMisc",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task SaveUpdateTechToolsPPEMETERSAsync(TechToolsPpeMetersDto ppe)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();

            parameters.Add("@TechID", ppe.TechID);
            parameters.Add("@RapidGate", ppe.RapidGate);

            parameters.Add("@TWIC", DateNormalizer.Normalize(ppe.TWIC));
            parameters.Add("@MineSafety", DateNormalizer.Normalize(ppe.MineSafety));
            parameters.Add("@CPRFAAED", DateNormalizer.Normalize(ppe.CPRFAAED));
            parameters.Add("@OSHA10", DateNormalizer.Normalize(ppe.OSHA10));
            parameters.Add("@SWAC", DateNormalizer.Normalize(ppe.SWAC));

            parameters.Add("@ArcFlashSuitSize", ppe.ArcFlashSuitSize);
            parameters.Add("@ArcFlashSuitDate", DateNormalizer.Normalize(ppe.ArcFlashSuitDate));
            parameters.Add("@Arc40FlashSize", ppe.Arc40FlashSize);
            parameters.Add("@Arc40FlashDate", DateNormalizer.Normalize(ppe.Arc40FlashDate));

            parameters.Add("@GloveSize", ppe.GloveSize);
            parameters.Add("@GloveRecDate", DateNormalizer.Normalize(ppe.GloveRecDate));
            parameters.Add("@ChFrJacket", ppe.ChFrJacket);
            parameters.Add("@ChFrJacketDate", DateNormalizer.Normalize(ppe.ChFrJacketDate));

            parameters.Add("@KleinProTechBP", ppe.KleinProTechBP);
            parameters.Add("@Cal12IUSoftHood", ppe.Cal12IUSoftHood);

            parameters.Add("@LinemansSleeves", ppe.LinemansSleeves);
            parameters.Add("@LinemannSlStraps", ppe.LinemannSlStraps);
            parameters.Add("@NitrileGloves", ppe.NitrileGloves);
            parameters.Add("@HardHatFaceSh", ppe.HardHatFaceSh);
            parameters.Add("@RubberGloves", ppe.RubberGloves);

            parameters.Add("@AcidApron", ppe.AcidApron);
            parameters.Add("@AcidFaceShield", ppe.AcidFaceShield);
            parameters.Add("@AcidFSHeadGear", ppe.AcidFSHeadGear);
            parameters.Add("@AcidSleeves", ppe.AcidSleeves);
            parameters.Add("@BagForGloves", ppe.BagForGloves);
            parameters.Add("@BagForFaceSh", ppe.BagForFaceSh);

            parameters.Add("@ClampMeter", ppe.ClampMeter);
            parameters.Add("@ClampMeterDt", DateNormalizer.Normalize(ppe.ClampMeterDt));
            parameters.Add("@Multimeter", ppe.Multimeter);
            parameters.Add("@MultimeterDt", DateNormalizer.Normalize(ppe.MultimeterDt));
            parameters.Add("@TorqueWrench", ppe.TorqueWrench);
            parameters.Add("@TorqueWrenchDt", DateNormalizer.Normalize(ppe.TorqueWrenchDt));
            parameters.Add("@IRGun", ppe.IRGun);
            parameters.Add("@IRGunDt", DateNormalizer.Normalize(ppe.IRGunDt));

            parameters.Add("@Midtronics6000", ppe.Midtronics6000);
            parameters.Add("@Midtronics6000Dt", DateNormalizer.Normalize(ppe.Midtronics6000Dt));

            parameters.Add("@PhSeqTester", ppe.PhSeqTester);
            parameters.Add("@PhSeqRecvdDt", DateNormalizer.Normalize(ppe.PhSeqRecvdDt));

            parameters.Add("@TSALocks", ppe.TSALocks);
            parameters.Add("@DCGCarMagnet", ppe.DCGCarMagnet);
            parameters.Add("@ChickenWire", ppe.ChickenWire);
            parameters.Add("@Potentiometer", ppe.Potentiometer);
            parameters.Add("@DEWALT", ppe.DEWALT);
            parameters.Add("@TechToolBox", ppe.TechToolBox);
            parameters.Add("@MeterHKit", ppe.MeterHKit);
            parameters.Add("@Fluke225", ppe.Fluke225);
            parameters.Add("@FuseKit", ppe.FuseKit);

            parameters.Add("@PanduitLockout", ppe.PanduitLockout);
            parameters.Add("@NeikoToolSet", ppe.NeikoToolSet);
            parameters.Add("@USBCamera", ppe.USBCamera);
            parameters.Add("@Vacuum", ppe.Vacuum);
            parameters.Add("@LockoutKit", ppe.LockoutKit);
            parameters.Add("@BatterySpillKit", ppe.BatterySpillKit);

            parameters.Add("@HeatSinkPaste", ppe.HeatSinkPaste);
            parameters.Add("@GFCICord", ppe.GFCICord);
            parameters.Add("@MiniGrabber2", ppe.MiniGrabber2);
            parameters.Add("@MiniGrabber4", ppe.MiniGrabber4);
            parameters.Add("@CompactFAKit", ppe.CompactFAKit);
            parameters.Add("@InsMagnTool", ppe.InsMagnTool);
            parameters.Add("@MattedFloorMat", ppe.MattedFloorMat);

            parameters.Add("@Notes", ppe.Notes);
            parameters.Add("@ModifiedBy", ppe.ModifiedBy);

            await connection.ExecuteAsync(
                "SaveUpdateTechToolsPPEMeterMisc",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<int> GetTechToolsMiscCountAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            return await connection.ExecuteScalarAsync<int>(
                "GetTechToolsCount",
                new { TechID = techId },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task DeleteReplaceToolsMiscAsync(string techId, List<TechToolItemDto> items, string modifiedBy)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            using var transaction = connection.BeginTransaction();

            try
            {
                // 1️⃣ Delete existing rows
                await connection.ExecuteAsync(
                    "DeleteTechToolsMisc",
                    new { TechID = techId },
                    transaction,
                    commandType: CommandType.StoredProcedure
                );

                // 2️⃣ Insert rows (parameterized, SAFE)
                const string insertSql = @"
            INSERT INTO dbo.TechToolsMiscKitPNo
            (
                ToolKitPNMisc,
                Description,
                TechValue,
                TechID,
                ModifiedOn,
                ModifiedBy,
                ColumnOrder
            )
            VALUES
            (
                @ToolKitPNMisc,
                @Description,
                @TechValue,
                @TechID,
                CURRENT_TIMESTAMP,
                @ModifiedBy,
                @ColumnOrder
            )";

                foreach (var item in items)
                {
                    await connection.ExecuteAsync(
                        insertSql,
                        new
                        {
                            item.ToolKitPNMisc,
                            item.Description,
                            item.TechValue,
                            TechID = techId,
                            ModifiedBy = modifiedBy,
                            item.ColumnOrder
                        },
                        transaction
                    );
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<List<DcgDisplayReportDto>> GetDCGDiplayReportDetailsAsync(string reportName, string title)
        {
            using var connection = new SqlConnection(_gpconnectionString);

            string sql = title != null && title.Contains("Purchase", StringComparison.OrdinalIgnoreCase)
                ? "EXEC NewDisplayPODetail @ReportName"
                : "EXEC NewDisplayCallsDetail @ReportName";

            var parameters = new DynamicParameters();
            parameters.Add("@ReportName", reportName);

            var rows = await connection.QueryAsync(sql, parameters);

            var result = rows
                .Select(r =>
                {
                    var row = (IDictionary<string, object>)r;

                    return new DcgDisplayReportDto
                    {
                        CustomerNo = row["Customer No"]?.ToString(),
                        CustomerName = row["Customer Name"]?.ToString(),
                        Address = row["Address"]?.ToString(),
                        SalesPerson = row["SalesPerson"]?.ToString(),
                        ContractNo = row["Contract No"]?.ToString(),
                        Type = row["Type"]?.ToString(),
                        InvoicedOn = row["Invoiced On"] == null
                                        ? null
                                        : Convert.ToDateTime(row["Invoiced On"]),
                        Amount = row["Amount"] == null
                                        ? 0
                                        : Convert.ToDecimal(row["Amount"]),
                        MailingDt = row["Mailing Dt"] == null
                                        ? null
                                        : Convert.ToDateTime(row["Mailing Dt"]),
                        PORDNMBR = row["PORDNMBR"]?.ToString()
                    };
                })
                .ToList();

            return result;
        }

        public async Task<PastDueContractResponse> GetPastDueContractDetailsAsync(string status)
        {
            using var connection = new SqlConnection(_gpconnectionString);

            await connection.OpenAsync();

            using var multi = await connection.QueryMultipleAsync(
                "GetPastDueContractDetails",
                new { Status = status },
                commandType: CommandType.StoredProcedure
            );

            // ---------- Result Set 1 (Strongly typed) ----------
            var details = (await multi.ReadAsync<PastDueContractDto>()).ToList();

            // ---------- Result Set 2 (Dynamic with spaces) ----------
            var summaryRaw = await multi.ReadAsync<dynamic>();

            var summary = summaryRaw
                .Select(row =>
                {
                    var dict = (IDictionary<string, object>)row;

                    return new PastDueAccountManagerSummaryDto
                    {
                        AccountManager = dict.ContainsKey("Account Manager")
                            ? dict["Account Manager"]?.ToString()
                            : null,

                        ContractNo = dict.ContainsKey("ContractNo")
                            ? Convert.ToInt32(dict["ContractNo"])
                            : 0
                    };
                })
                .ToList();

            return new PastDueContractResponse
            {
                Details = details,
                Summary = summary
            };
        }

        public async Task<PMNotesSearchResponse> SearchPMNotesAsync(string query, int page, int pageSize)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new PMNotesSearchResponse
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalMatches = 0,
                    TotalPages = 0
                };
            }

            // Stored proc is 1-based page index
            int spPage = page < 1 ? 1 : page;

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            using var multi = await connection.QueryMultipleAsync(
                "dbo.SearchPMNotesInETechJobList",
                new
                {
                    q = query,
                    page = spPage,
                    pageSize = pageSize
                },
                commandType: CommandType.StoredProcedure
            );

            // ---------- Result Set 1 ----------
            var results = (await multi.ReadAsync<PMNotesSearchResultDto>()).ToList();

            // ---------- Result Set 2 ----------
            int totalMatches = 0;
            var totalRow = await multi.ReadFirstOrDefaultAsync<dynamic>();
            if (totalRow != null)
            {
                var dict = (IDictionary<string, object>)totalRow;
                totalMatches = dict.ContainsKey("TotalMatches") ? Convert.ToInt32(dict["TotalMatches"]) : 0;
            }

            int totalPages = pageSize > 0 ? (int)Math.Ceiling((double)totalMatches / pageSize) : 0;

            return new PMNotesSearchResponse
            {
                Page = spPage,
                PageSize = pageSize,
                TotalMatches = totalMatches,
                TotalPages = totalPages,
                Results = results
            };
        }


        public static class DateNormalizer
        {
            public static DateTime Normalize(DateTime value)
            {
                return value == default || value.Year < 1901
                    ? new DateTime(1900, 1, 1)
                    : value;
            }
        }

        public async Task<List<SiteHistoryDto>> GetSiteHistoryAsync(string custNmbr)
        {
            using var connection = new SqlConnection(_gpconnectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CustNmbr", custNmbr, DbType.String);

            await connection.OpenAsync();

            var rows = await connection.QueryAsync(
                "GetPrevSiteNotesByCustNmbr",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var results = rows
                .Select(r =>
                {
                    var row = (IDictionary<string, object>)r;

                    return new SiteHistoryDto
                    {
                        JobNo = row.ContainsKey("Job No") ? row["Job No"]?.ToString() : null,
                        Technician = row.ContainsKey("Technician") ? row["Technician"]?.ToString() : null,
                        TechNotes = row.ContainsKey("TechNotes") ? row["TechNotes"]?.ToString() : null,
                        Status = row.ContainsKey("Status") ? row["Status"]?.ToString() : null,
                        ScheduledOn = row.ContainsKey("Scheduled On") ? row["Scheduled On"]?.ToString() : null,
                        CustomerName = row.ContainsKey("Customer Name") ? row["Customer Name"]?.ToString() : null,
                        Address = row.ContainsKey("Address") ? row["Address"]?.ToString() : null,
                        StrtDate = row.ContainsKey("StrtDate") && row["StrtDate"] != null 
                            ? Convert.ToDateTime(row["StrtDate"]) 
                            : default(DateTime)
                    };
                })
                .ToList();

            return results;
        }


    }
}
