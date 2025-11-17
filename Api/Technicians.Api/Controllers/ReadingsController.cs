using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Text.Json;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReadingsController : ControllerBase
    {
        private readonly ReadingsRepository _repository;

        public ReadingsController(ReadingsRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("GetManufacturerNames")]
        public async Task<IActionResult> GetManufacturerNames()
        {
            try
            {
                var manufacturers = await _repository.GetManufacturerNamesAsync();

                if (manufacturers == null)
                    return NotFound("No manufacturer names found.");

                return Ok(manufacturers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching manufacturer names: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryInfo")]
        public async Task<IActionResult> GetBatteryInfo([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var batteries = await _repository.GetBatteryInfoAsync(callNbr, equipId, batStrId);
                return Ok(batteries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching battery info: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryInfoTemp")]
        public async Task<IActionResult> GetBatteryInfoTemp([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var batteries = await _repository.GetBatteryInfoTempAsync(callNbr, equipId, batStrId);
                return Ok(batteries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching battery info: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryStringReadingsInfo")]
        public async Task<IActionResult> GetBatteryStringReadingsInfo([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var result = await _repository.GetBatteryStringReadingsInfoAsync(callNbr, equipId, batStrId);

                if (result == null)
                    return NotFound("No readings found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log if desired
                return StatusCode(500, $"Error fetching battery string readings: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryStringReadingsInfoTemp")]
        public async Task<IActionResult> GetBatteryStringReadingsInfoTemp([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            if (string.IsNullOrWhiteSpace(callNbr) || string.IsNullOrWhiteSpace(batStrId))
                return BadRequest("Call number and Battery String ID are required.");

            try
            {
                var result = await _repository.GetBatteryStringReadingsInfoTempAsync(callNbr, equipId, batStrId);

                if (result == null)
                    return NotFound("No readings found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log if desired
                return StatusCode(500, $"Error fetching battery string readings: {ex.Message}");
            }
        }

        [HttpGet("GetBatteryTypeValues")]
        public async Task<IActionResult> GetBatteryTypeValues([FromQuery] string batteryType, [FromQuery] string batteryTypeName, [FromQuery] string floatVoltS, [FromQuery] int floatVoltV)
        {
            var result = await _repository.GetBatteryTypeValuesAsync(batteryType, batteryTypeName, floatVoltS, floatVoltV);
            return Ok(result);
        }

        [HttpGet("GetReferenceValues")]
        public async Task<IActionResult> GetReferenceValues(
            [FromQuery] int equipId,
            [FromQuery] string type)
        {
            var result = await _repository.SaveOrGetReferenceValuesAsync(equipId, type, "", "", 0, 0);
            return Ok(result);
        }

        [HttpPost("SaveUpdateBatteryStringReadings")]
        public async Task<IActionResult> SaveUpdateBatteryStringReadings([FromBody] BatteryStringInfo binfo)
        {
            if (binfo == null)
                return BadRequest("Invalid input");

            try
            {
                await _repository.SaveOrUpdateBatteryStringReadingsAsync(binfo);
                return Ok(new { success = true, message = "Battery string readings saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("SaveUpdateBatteryStringReadingsTemp")]
        public async Task<IActionResult> SaveUpdateBatteryStringReadingsTemp([FromBody] BatteryStringInfo binfo)
        {
            if (binfo == null)
                return BadRequest("Invalid input");

            try
            {
                await _repository.SaveOrUpdateBatteryStringReadingsTempAsync(binfo);
                return Ok(new { success = true, message = "Battery string readings saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("SaveBatteryData")]
        public async Task<IActionResult> SaveBatteryData([FromBody] List<BatteryReadingDto> batteries)
        {
            if (batteries == null || batteries.Count == 0)
                return BadRequest("Battery data is required.");

            try
            {
                bool success = await _repository.SaveBatteryDataAsync(batteries);
                //if (success)
                    return Ok(new { message = "Battery data saved successfully." });
                //else
                //    return BadRequest("No data was processed.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("SaveBatteryDataTemp")]
        public async Task<IActionResult> SaveBatteryDataTemp([FromBody] List<BatteryReadingDto> batteries)
        {
            if (batteries == null || batteries.Count == 0)
                return BadRequest("Battery data is required.");

            try
            {
                bool success = await _repository.SaveBatteryDataTempAsync(batteries);
                if (success)
                    return Ok(new { message = "Battery data saved successfully." });
                else
                    return BadRequest("No data was processed.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetEquipmentInfo")]
        public IActionResult GetEquipInfo([FromQuery] string callNbr, [FromQuery] int equipId)
        {
            try
            {
                var ds = _repository.EditEquipInfo(callNbr, equipId);

                if (ds == null || ds.Tables.Count < 1)
                    return NotFound(new { success = false, message = "No equipment data found" });

                // --- 🧱 Get Battery Info Table (Table[1]) ---
                BatteryLookupInfo batteryInfo = null;
                if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
                {
                    var dr1 = ds.Tables[1].Rows[0];
                    batteryInfo = new BatteryLookupInfo
                    {
                        BatteryHousing = dr1["BatteryHousing"]?.ToString()?.Trim(),
                        BatteryType = dr1["BatteryType"]?.ToString()?.Trim(),
                        FloatVoltS = dr1["FloatVoltS"]?.ToString()?.Trim(),
                        FloatVoltV = dr1["FloatVoltV"]?.ToString()?.Trim()
                    };
                }

                // --- 🧱 Get Equipment Info Table (Table[0]) ---
                var equipInfoTable = ds.Tables[0];
                if (equipInfoTable.Rows.Count == 0)
                    return NotFound(new { success = false, message = "Equipment info not found" });

                var dr = equipInfoTable.Rows[0];

                // Safe numeric conversion helper
                int? SafeToInt(object value)
                {
                    if (value == DBNull.Value || value == null) return null;
                    try
                    {
                        return Convert.ToInt32(value); // works for Int16, Int32, Int64
                    }
                    catch
                    {
                        return null;
                    }
                }

                var equipmentInfo = new EquipmentInfo
                {
                    EquipNo = dr["EquipNo"]?.ToString()?.Trim(),
                    SerialNo = dr["SerialID"]?.ToString()?.Trim(),
                    Location = dr["Location"]?.ToString()?.Trim(),
                    ModelNo = dr["Version"]?.ToString()?.Trim(),
                    VendorId = dr["VendorId"]?.ToString()?.Trim(),
                    EquipMonth = dr["EquipMonth"]?.ToString()?.Trim(),
                    EquipYear = dr["EquipYear"]?.ToString()?.Trim(),
                    BatteriesPerString = dr.Table.Columns.Contains("BatteriesPerString") ? SafeToInt(dr["BatteriesPerString"]) : null,
                    BatteriesPerPack = dr.Table.Columns.Contains("BatteriesPerPack") ? SafeToInt(dr["BatteriesPerPack"]) : null,
                    ReadingType = dr.Table.Columns.Contains("ReadingType") ? dr["ReadingType"]?.ToString()?.Trim() : null
                };

                return Ok(new EquipmentInfoResponse
                {
                    Success = true,
                    Message = "Equipment data retrieved successfully",
                    Equipment = equipmentInfo,
                    Battery = batteryInfo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpPost("UpdateBatteryInfo")]
        public IActionResult UpdateBatteryInfo([FromBody] JsonElement payload)
        {
            try
            {
                // Safely extract fields from JsonElement
                string callNbr = payload.GetProperty("CallNbr").GetString();
                int equipId = payload.GetProperty("EquipId").GetInt32();
                string batStrId = payload.GetProperty("BatStrId").GetString();
                int i = payload.GetProperty("i").GetInt32();

                // Optional fields — handle gracefully if missing or null
                int? batteriesPerString = payload.TryGetProperty("batteriesPerString", out JsonElement bpsElem) && bpsElem.ValueKind != JsonValueKind.Null
                    ? bpsElem.GetInt32()
                    : (int?)null;

                int? batteriesPerPack = payload.TryGetProperty("batteriesPerPack", out JsonElement bppElem) && bppElem.ValueKind != JsonValueKind.Null
                    ? bppElem.GetInt32()
                    : (int?)null;

                string readingType = payload.TryGetProperty("readingType", out JsonElement rtElem) && rtElem.ValueKind == JsonValueKind.String
                    ? rtElem.GetString()
                    : null;

                // ✅ Call your repo method
                bool result = _repository.UpdateBatteryInfo(callNbr, equipId, batStrId, i, batteriesPerString, batteriesPerPack, readingType);

                return Ok(new
                {
                    success = result,
                    message = result ? "Update successful" : "No records updated"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpDelete("DeleteBattery")]
        public IActionResult DeleteBattery([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            try
            {
                bool result = _repository.DeleteBattery(callNbr, equipId, batStrId);

                //if (result)
                    return Ok(new { success = true, message = "Battery deleted successfully." });
                //else
                    //return NotFound(new { success = false, message = "Battery not found or could not be deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("DeleteBatteryTemp")]
        public IActionResult DeleteBatteryTemp([FromQuery] string callNbr, [FromQuery] int equipId, [FromQuery] string batStrId)
        {
            try
            {
                bool result = _repository.DeleteBatteryTemp(callNbr, equipId, batStrId);

                //if (result)
                return Ok(new { success = true, message = "Battery deleted successfully." });
                //else
                //return NotFound(new { success = false, message = "Battery not found or could not be deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


    }
}
