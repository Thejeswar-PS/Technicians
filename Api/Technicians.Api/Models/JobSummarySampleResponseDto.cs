using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for GetJobSummarySample request parameters
    /// </summary>
    public class JobSummarySampleRequestDto
    {
        [Required]
        [StringLength(11)]
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [Required]
        [JsonPropertyName("equipId")]
        public int EquipID { get; set; }

        [Required]
        [StringLength(31)]
        [JsonPropertyName("equipType")]
        public string EquipType { get; set; }

        [Required]
        [StringLength(1)]
        [JsonPropertyName("scheduled")]
        public string Scheduled { get; set; }
    }

    /// <summary>
    /// DTO for GetJobSummarySample response containing dynamic equipment data
    /// Since the SP returns different result sets based on EquipType, we use dynamic approach
    /// </summary>
    public class JobSummarySampleResponseDto
    {
        [JsonPropertyName("equipType")]
        public string EquipType { get; set; }

        [JsonPropertyName("primaryData")]
        public object PrimaryData { get; set; }

        [JsonPropertyName("secondaryData")]
        public object SecondaryData { get; set; }

        [JsonPropertyName("hasSecondaryData")]
        public bool HasSecondaryData { get; set; }
    }

    /// <summary>
    /// Specific DTO for BATTERY equipment type primary data
    /// </summary>
    public class BatteryStringDto
    {
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [JsonPropertyName("equipId")]
        public int EquipId { get; set; }

        [JsonPropertyName("stringId")]
        public int StringId { get; set; }

        [JsonPropertyName("battPerString")]
        public int BattPerString { get; set; }

        [JsonPropertyName("voltageV")]
        public decimal? VoltageV { get; set; }

        [JsonPropertyName("voltageS")]
        public decimal? VoltageS { get; set; }

        [JsonPropertyName("floatVoltV")]
        public decimal? FloatVoltV { get; set; }

        [JsonPropertyName("floatVoltS")]
        public decimal? FloatVoltS { get; set; }

        [JsonPropertyName("discharge")]
        public string Discharge { get; set; }

        [JsonPropertyName("dischargeTime")]
        public string DischargeTime { get; set; }

        [JsonPropertyName("condition")]
        public string Condition { get; set; }

        [JsonPropertyName("notes")]
        public string Notes { get; set; }

        [JsonPropertyName("targetVoltage")]
        public decimal? TargetVoltage { get; set; }

        [JsonPropertyName("batteryType")]
        public string BatteryType { get; set; }

        [JsonPropertyName("batteryHousing")]
        public string BatteryHousing { get; set; }

        [JsonPropertyName("created")]
        public DateTime? Created { get; set; }

        [JsonPropertyName("maintAuthID")]
        public string MaintAuthID { get; set; }
    }

    /// <summary>
    /// Specific DTO for BATTERY equipment type secondary data
    /// </summary>
    public class BatteryDetailsDto
    {
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [JsonPropertyName("equipId")]
        public int EquipId { get; set; }

        [JsonPropertyName("stringId")]
        public int StringId { get; set; }

        [JsonPropertyName("batteryNo")]
        public int BatteryNo { get; set; }

        [JsonPropertyName("voltageV")]
        public decimal? VoltageV { get; set; }

        [JsonPropertyName("voltageS")]
        public decimal? VoltageS { get; set; }

        [JsonPropertyName("condition")]
        public string Condition { get; set; }

        [JsonPropertyName("replacementNeeded")]
        public string ReplacementNeeded { get; set; }

        [JsonPropertyName("monitoringBattery")]
        public string MonitoringBattery { get; set; }

        [JsonPropertyName("cracks")]
        public string Cracks { get; set; }

        [JsonPropertyName("notes")]
        public string Notes { get; set; }

        [JsonPropertyName("created")]
        public DateTime? Created { get; set; }
    }
}