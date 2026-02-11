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
        private readonly string _connectionStringProd;
        private readonly string _gpconnectionString;

        public TechToolsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _connectionStringProd = _configuration.GetConnectionString("DefaultConnectionProd");
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

        public async Task<JobExistsDto?> CheckJobExistsAsync(string jobNo, string jobStatus)
        {
            var callNbr = AddPrefixToCallNbr(jobNo);

            const string sql = @"
            SELECT 
                a.CallNbr,
                ISNULL(c.Name, '') AS TechName
            FROM SVC00200 a
            JOIN aaETechJobExt b 
                ON a.CallNbr = b.CallNbr 
               AND a.SrvrecType = b.SrvrecType
            LEFT JOIN SVC00100 c 
                ON c.TechID = a.TechID
            WHERE 
                a.SrvrecType > 1
                AND a.CallNbr = @CallNbr
                AND b.JobStatus = @JobStatus";

            using var conn = new SqlConnection(_gpconnectionString);

            return await conn.QueryFirstOrDefaultAsync<JobExistsDto>(
                sql,
                new
                {
                    CallNbr = callNbr,
                    JobStatus = jobStatus
                });
        }

        public async Task<string> ExecuteMiscTaskAsync(
        string jobNo,
        string operation)
        {
            var callNbr = AddPrefixToCallNbr(jobNo);

            string storedProc = operation.ToLower() switch
            {
                "redownload" => "ManualJobDownload",
                "remove" => "RemoveTheTechFromGP",
                _ => throw new ArgumentException("Invalid operation")
            };

            string paramName = operation.ToLower() == "redownload"
                ? "@CallNbr"
                : "@JobId";

            try
            {
                using var conn = new SqlConnection(_connectionString);

                return await conn.ExecuteScalarAsync<string>(
                    storedProc,
                    new DynamicParameters(new Dictionary<string, object>
                    {
                    { paramName, callNbr }
                    }),
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception ex)
            {
                // Optional: log to DB if you want same legacy behavior
                return $"Error Occured : {ex.Message}";
            }
        }


        private string AddPrefixToCallNbr(string callNbr)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                return callNbr;

            // Example: adjust if you have real prefix logic
            return callNbr.Trim();
        }

        public async Task<List<JobsToBeUploadedDto>> GetJobsToBeUploadedAsync(
        string technicianId,
        string accountManagerName,
        string empId)
        {
            var result = new List<JobsToBeUploadedDto>();

            try
            {
                using var conn = new SqlConnection(_connectionStringProd);
                //Need to be reverted to dev
                using var cmd = new SqlCommand("JobsToBeUploadedByTech", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@TechID", technicianId);
                cmd.Parameters.AddWithValue("@OffId", accountManagerName);
                cmd.Parameters.AddWithValue("@EmpID", empId);

                await conn.OpenAsync();

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    result.Add(new JobsToBeUploadedDto
                    {
                        CallNbr = reader["CallNbr"].ToString(),
                        TechName = reader["TechName"].ToString(),
                        AccMgr = reader["AccMgr"].ToString(),
                        Status = reader["Status"].ToString(),
                        StrtDate = Convert.ToDateTime(reader["StrtDate"]),
                        CustName = reader["CustName"].ToString(),
                        ChangeAge = Convert.ToInt32(reader["ChangeAge"])
                    });
                }
            }
            catch (Exception ex)
            {
                throw;
            }

            return result;
        }

        public async Task<CapFanUsageByYearResponse> GetCapFanUsageByYearAsync(
        string capPartNo,
        string fanPartNo,
        string battNo,
        string igbNo,
        string scrNo,
        string fusNo,
        string year)
        {
            using var conn = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CapPartNo", capPartNo);
            parameters.Add("@FanPartNo", fanPartNo);
            parameters.Add("@BattNo", battNo);
            parameters.Add("@IGB", igbNo);
            parameters.Add("@SCR", scrNo);
            parameters.Add("@FUS", fusNo);
            parameters.Add("@Year", year);

            await conn.OpenAsync();

            using var multi = await conn.QueryMultipleAsync(
                "CapFanUsageByYears",
                parameters,
                commandType: CommandType.StoredProcedure);

            // Read result sets with dynamic mapping for columns with spaces
            var capsRaw = await multi.ReadAsync();
            var caps = capsRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("Cap Part No") ? dict["Cap Part No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total Caps") ? Convert.ToInt32(dict["Total Caps"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var fansRaw = await multi.ReadAsync();
            var fans = fansRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("Fan Part No") ? dict["Fan Part No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total Fans") ? Convert.ToInt32(dict["Total Fans"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var batteriesRaw = await multi.ReadAsync();
            var batteries = batteriesRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("Batt No") ? dict["Batt No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total Batts") ? Convert.ToInt32(dict["Total Batts"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var igbRaw = await multi.ReadAsync();
            var igb = igbRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("IGB No") ? dict["IGB No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total IGB") ? Convert.ToInt32(dict["Total IGB"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var scrRaw = await multi.ReadAsync();
            var scr = scrRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("SCR No") ? dict["SCR No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total SCR") ? Convert.ToInt32(dict["Total SCR"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var fusRaw = await multi.ReadAsync();
            var fus = fusRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageByYearDto
                {
                    PartNo = dict.ContainsKey("FUS No") ? dict["FUS No"]?.ToString() : null,
                    Total = dict.ContainsKey("Total FUS") ? Convert.ToInt32(dict["Total FUS"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            // Read total result sets
            var capsTotalRaw = await multi.ReadAsync();
            var capsTotal = capsTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total Caps") ? Convert.ToInt32(dict["Total Caps"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var fansTotalRaw = await multi.ReadAsync();
            var fansTotal = fansTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total Fans") ? Convert.ToInt32(dict["Total Fans"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var batteriesTotalRaw = await multi.ReadAsync();
            var batteriesTotal = batteriesTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total Batts") ? Convert.ToInt32(dict["Total Batts"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var igbTotalRaw = await multi.ReadAsync();
            var igbTotal = igbTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total IGB") ? Convert.ToInt32(dict["Total IGB"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var scrTotalRaw = await multi.ReadAsync();
            var scrTotal = scrTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total SCR") ? Convert.ToInt32(dict["Total SCR"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            var fusTotalRaw = await multi.ReadAsync();
            var fusTotal = fusTotalRaw.Select(r =>
            {
                var dict = (IDictionary<string, object>)r;
                return new PartUsageTotalByYearDto
                {
                    Total = dict.ContainsKey("Total FUS") ? Convert.ToInt32(dict["Total FUS"]) : 0,
                    Year = dict.ContainsKey("Year") ? Convert.ToInt32(dict["Year"]) : 0
                };
            }).ToList();

            return new CapFanUsageByYearResponse
            {
                Caps = caps,
                Fans = fans,
                Batteries = batteries,
                IGB = igb,
                SCR = scr,
                FUS = fus,
                CapsTotal = capsTotal,
                FansTotal = fansTotal,
                BatteriesTotal = batteriesTotal,
                IGBTotal = igbTotal,
                SCRTotal = scrTotal,
                FUSTotal = fusTotal
            };
        }

        public async Task<List<UnscheduledJobsByMonthDto>> GetUnscheduledJobsByMonthAsync()
        {
            using var conn = new SqlConnection(_gpconnectionString);
            await conn.OpenAsync();

            var result = await conn.QueryAsync<UnscheduledJobsByMonthDto>(
                "DisplayUnscheduledGraph",
                commandType: CommandType.StoredProcedure);

            return result.ToList();
        }
        public async Task<List<UnscheduledJobsByAccountManagerDto>> GetUnscheduledJobsByAccountManagerAsync(string month)
        {
            using var conn = new SqlConnection(_gpconnectionString);
            await conn.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@pMonth", month);

            var result = await conn.QueryAsync<UnscheduledJobsByAccountManagerDto>(
                "DisplayUnscheduledActMngrGraph",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result.ToList();
        }

        public async Task<PastDueUnscheduledResponse> GetPastDueUnscheduledJobsAsync()
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            using var multi = await conn.QueryMultipleAsync(
                "PDueUnscheduledJobsInfo",
                commandType: CommandType.StoredProcedure);

            var response = new PastDueUnscheduledResponse
            {
                JobDetails = (await multi.ReadAsync<PastDueJobDetailDto>()).ToList(),
                SummaryByManager = (await multi.ReadAsync<PastDueSummaryDto>()).ToList(),
                ScheduledPercent = (await multi.ReadAsync<ScheduledPercentDto>()).ToList(),
                TotalUnscheduledJobs = (await multi.ReadAsync<TotalJobsDto>()).ToList(),
                TotalScheduledJobs = (await multi.ReadAsync<TotalJobsDto>()).ToList()
            };

            return response;
        }

        public async Task<AccountingStatusResponse> GetAccountingStatusDataAsync()
        {
            var result = new AccountingStatusResponse
            {
                AccountingStatus = new List<GraphPoint>(),
                ContractBillingStatus = new List<GraphPoint>()
            };

            using var conn = new SqlConnection(_gpconnectionString);
            await conn.OpenAsync();

            // -------- BindData1 equivalent ----------
            using (var cmd = new SqlCommand("NewDisplayCallsGraph", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@pDetailPage", "AcctStatus");

                using var reader = await cmd.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    result.AccountingStatus = new List<GraphPoint>
                {
                    new GraphPoint { Label = "Jobs in Technical Review", Value = ToInt(reader["CompletedTechReview"]) },
                    new GraphPoint { Label = "Jobs in review by Part Dep.", Value = ToInt(reader["Completedparts"]) },
                    new GraphPoint { Label = "Jobs in Manager Review", Value = ToInt(reader["CompletedMngrReview"]) },
                    new GraphPoint { Label = "TM job Costing by accounting", Value = ToInt(reader["Completedcosting"]) },
                    new GraphPoint { Label = "FS Job Costing", Value = ToInt(reader["CompletedFScosting"]) },
                    new GraphPoint { Label = "Jobs Invoiced Today", Value = ToInt(reader["Invoicedtoday"]) },
                    new GraphPoint { Label = "Completed and Returned with Missing Data", Value = ToInt(reader["MissingData"]) },
                    new GraphPoint { Label = "Jobs Invoiced Month to Date", Value = ToInt(reader["Invoicemonthtodate"]) },
                    new GraphPoint { Label = "Contracts Invoiced Month to Date", Value = ToInt(reader["ContractInvoicemonthtodate"]) },
                    new GraphPoint { Label = "Jobs Invoiced yesterday", Value = ToInt(reader["Invoicedyesterdate"]) }
                };
                }
            }

            // -------- BindData2 equivalent ----------
            using (var cmd = new SqlCommand("NewDisplayContractsGraph", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using var reader = await cmd.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    result.ContractBillingStatus = new List<GraphPoint>
                {
                    new GraphPoint { Label = "Liebert Contracts not billed as of yesterday", Value = ToInt(reader["PastNonBilledContracts"]) },
                    new GraphPoint { Label = "Non Liebert Contracts not billed as of yesterday", Value = ToInt(reader["NonLiebertPastNonBilledContracts"]) },

                    new GraphPoint { Label = "Liebert Contracts to be billed in next 30 days", Value = ToInt(reader["ContractToInvoiceNext30"]) },
                    new GraphPoint { Label = "Non Liebert Contracts to be billed in next 30 days", Value = ToInt(reader["NonLiebertContractToInvoiceNext30"]) },

                    new GraphPoint { Label = "Liebert Contracts to be billed in next 60 days", Value = ToInt(reader["ContractToInvoiceNext60"]) },
                    new GraphPoint { Label = "Non Liebert Contracts to be billed in next 60 days", Value = ToInt(reader["NonLiebertContractToInvoiceNext60"]) },

                    new GraphPoint { Label = "Liebert Contracts to be billed in next 90 days", Value = ToInt(reader["ContractToInvoiceNext90"]) },
                    new GraphPoint { Label = "Non Liebert Contracts to be billed in next 90 days", Value = ToInt(reader["NonLiebertContractToInvoiceNext90"]) },

                    new GraphPoint { Label = "Liebert Contracts to be billed after 90 days", Value = ToInt(reader["ContractToInvoiceOver90"]) },
                    new GraphPoint { Label = "Non Liebert Contracts to be billed after 90 days", Value = ToInt(reader["NonLiebertContractToInvoiceOver90"]) }
                };
                }
            }

            return result;
        }

        public async Task<PartsPerformanceResponse> GetPartsPerformanceDataAsync()
        {
            var response = new PartsPerformanceResponse
            {
                FoldersPerMonth = new List<MonthlyCountDto>(),
                AvgFolderDays = new List<MonthlyAvgDto>(),
                PartsReturnedStatus = new List<ReturnStatusDto>(),
                AvgReturnDays = new List<MonthlyAvgDto>(),
                PartsTestedStatus = new List<TestStatusDto>(),
                AvgTestingDays = new List<MonthlyAvgDto>(),
                PartsUnitsByCategory = new List<CategoryCountDto>()
            };

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = new SqlCommand("PartsPerformanceDashboard", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 3000
            };

            using var da = new SqlDataAdapter(cmd);
            var ds = new DataSet();
            da.Fill(ds);

            // ---------- Table 0 : Monthly Folders + Return/Test Status ----------
            foreach (DataRow row in ds.Tables[0].Rows)
            {
                var month = row["MonthName"].ToString();

                response.FoldersPerMonth.Add(new MonthlyCountDto
                {
                    MonthName = month,
                    Folders = ToInt(row["Folders"])
                });

                response.PartsReturnedStatus.Add(new ReturnStatusDto
                {
                    MonthName = month,
                    ReturnedParts = ToInt(row["ReturnedParts"]),
                    NotReturned = ToInt(row["NotReturned"])
                });

                response.PartsTestedStatus.Add(new TestStatusDto
                {
                    MonthName = month,
                    Tested = ToInt(row["Tested"]),
                    NotTested = ToInt(row["NotTested"])
                });
            }

            // ---------- Table 1 : Avg Days to Process Folders ----------
            foreach (DataRow row in ds.Tables[1].Rows)
            {
                response.AvgFolderDays.Add(new MonthlyAvgDto
                {
                    MonthName = row["MonthName"].ToString(),
                    AvgDays = ToDecimal(row["AvgDays"])
                });
            }

            // ---------- Table 2 : Avg Days to Return Parts ----------
            foreach (DataRow row in ds.Tables[2].Rows)
            {
                response.AvgReturnDays.Add(new MonthlyAvgDto
                {
                    MonthName = row["MonthName"].ToString(),
                    AvgDays = ToDecimal(row["AvgDays"])
                });
            }

            // ---------- Table 3 : Avg Days to Test Parts ----------
            foreach (DataRow row in ds.Tables[3].Rows)
            {
                response.AvgTestingDays.Add(new MonthlyAvgDto
                {
                    MonthName = row["MonthName"].ToString(),
                    AvgDays = ToDecimal(row["AvgDays"])
                });
            }

            // ---------- Table 4 : Parts / Units by Category ----------
            foreach (DataRow row in ds.Tables[4].Rows)
            {
                response.PartsUnitsByCategory.Add(new CategoryCountDto
                {
                    Category = row["Category"].ToString(),
                    PartsCount = ToInt(row["PartsCount"])
                });
            }

            return response;
        }

        private int ToInt(object value)
        => int.TryParse(value?.ToString(), out int v) ? v : 0;

        private decimal ToDecimal(object value)
            => decimal.TryParse(value?.ToString(), out decimal v) ? v : 0;

        public async Task<List<BatteryMakeDto>> GetBatteryMakesAsync()
        {
            var list = new List<BatteryMakeDto>();

            // Add "Please Select" at the TOP (same as your legacy UI)
            list.Add(new BatteryMakeDto
            {
                Text = "Please Select",
                Value = "PS"
            });

            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            var query = "SELECT DISTINCT RTRIM(Make) AS Make FROM [MidtronicsRefValues] ORDER BY Make";

            using var cmd = new SqlCommand(query, con);

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var make = reader["Make"].ToString();

                list.Add(new BatteryMakeDto
                {
                    Text = make,
                    Value = make
                });
            }

            return list;
        }

        public async Task<List<MidtronicsRefValueDto>> GetRefValuesByMakeAsync(string make)
        {
            var results = new List<MidtronicsRefValueDto>();
            var dataTable = new DataTable();

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            var query = @"SELECT * 
                      FROM [MidtronicsRefValues] 
                      WHERE Make = @Make 
                      ORDER BY Make";

            using var cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Make", make);

            using var adapter = new SqlDataAdapter(cmd);
            adapter.Fill(dataTable);


            foreach (DataRow row in dataTable.Rows)
            {
                var dict = new Dictionary<string, object>();

                foreach (DataColumn col in dataTable.Columns)
                {
                    dict[col.ColumnName] = row[col];
                }

                results.Add(new MidtronicsRefValueDto
                {
                    Columns = dict
                });
            }

            return results;
        }

        public async Task<bool> UpdateRefValueAsync(UpdateMidtronicsRefValueRequest request)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            string query = @"
        UPDATE [MidtronicsRefValues] 
        SET 
            RefValue = @RefValue,
            Resistance = @Resistance,
            LastModified = CURRENT_TIMESTAMP
        WHERE 
            EquipID = @EquipID 
            AND Make = @Make 
            AND Model = @Model";

            using var cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@EquipID", request.EquipID);
            cmd.Parameters.AddWithValue("@Make", request.Make);
            cmd.Parameters.AddWithValue("@Model", request.Model);
            cmd.Parameters.AddWithValue("@RefValue", request.RefValue);
            cmd.Parameters.AddWithValue("@Resistance", request.Resistance);

            int rowsAffected = await cmd.ExecuteNonQueryAsync();

            return rowsAffected > 0;
        }

        public async Task<bool> AddRefValueAsync(UpdateMidtronicsRefValueRequest request)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            string query = @"
    INSERT INTO [MidtronicsRefValues]
    (EquipID, Make, Model, RefValue, Resistance, LastModified)
    VALUES
    (@EquipID, @Make, @Model, @RefValue, @Resistance, CURRENT_TIMESTAMP)";

            using var cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@EquipID", request.EquipID);
            cmd.Parameters.AddWithValue("@Make", request.Make);
            cmd.Parameters.AddWithValue("@Model", request.Model);
            cmd.Parameters.AddWithValue("@RefValue", request.RefValue);
            cmd.Parameters.AddWithValue("@Resistance", request.Resistance);

            int rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0;
        }

        public async Task<bool> DeleteRefValueAsync(int equipID, string make, string model)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            string query = @"
    DELETE FROM [MidtronicsRefValues]
    WHERE EquipID = @EquipID 
      AND Make = @Make 
      AND Model = @Model";

            using var cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@EquipID", equipID);
            cmd.Parameters.AddWithValue("@Make", make);
            cmd.Parameters.AddWithValue("@Model", model);

            int rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0;
        }

        public async Task<List<BillAfterPMJobDto>> GetBillAfterPMJobsAsync(
    string archive,
    string pmType,
    int fiscalYear,
    int month)
        {
            var result = new List<BillAfterPMJobDto>();

            using var conn = new SqlConnection(_gpconnectionString);
            using var cmd = new SqlCommand("GetBillAfterPMJobs", conn);

            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Archive", archive);
            cmd.Parameters.AddWithValue("@Desc", pmType);
            cmd.Parameters.AddWithValue("@Year", fiscalYear);
            cmd.Parameters.AddWithValue("@Month", month);

            await conn.OpenAsync();

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                result.Add(new BillAfterPMJobDto
                {
                    CallNbr = reader["CallNbr"] as string,
                    CustNbr = reader["CustNbr"] as string,
                    CustName = reader["CustName"] as string,
                    PMType = reader["PMType"] as string,
                    Description = reader["Description"] as string,
                    Status = reader["status"] as string,
                    TechName = reader["TechName"] as string,
                    AccMgr = reader["AccMgr"] as string,
                    StrtDate = reader["StrtDate"] == DBNull.Value
                                ? null
                                : Convert.ToDateTime(reader["StrtDate"]),
                    EndDate = reader["EndDate"] == DBNull.Value
                                ? null
                                : Convert.ToDateTime(reader["EndDate"]),
                    ContNbr = reader["ContNbr"] as string
                });
            }

            return result;
        }

        public async Task<bool> MoveBillAfterPMJobsAsync(List<string> jobIds, string archive)
        {
            if (jobIds == null || jobIds.Count == 0)
                return false;

            using var conn = new SqlConnection(_gpconnectionString);
            await conn.OpenAsync();

            // Build parameterized IN clause
            var parameters = new List<string>();
            for (int i = 0; i < jobIds.Count; i++)
            {
                parameters.Add($"@job{i}");
            }

            string inClause = string.Join(",", parameters);

            string query = archive == "1"
                ? $"UPDATE BillAfterPMJobs SET Archive = 'True', ModifiedOn = GETDATE() WHERE CallNbr IN ({inClause})"
                : $"UPDATE BillAfterPMJobs SET Archive = 'False', ModifiedOn = GETDATE() WHERE CallNbr IN ({inClause})";

            using var cmd = new SqlCommand(query, conn);

            for (int i = 0; i < jobIds.Count; i++)
            {
                cmd.Parameters.AddWithValue($"@job{i}", jobIds[i].Trim());
            }

            int rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }



    }
}
