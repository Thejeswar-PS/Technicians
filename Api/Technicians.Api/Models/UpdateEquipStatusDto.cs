using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for updating equipment status using the UpdateEquipStatus stored procedure
    /// </summary>
    public class UpdateEquipStatusDto
    {
        [Required]
        [StringLength(11)]
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [Required]
        [JsonPropertyName("equipId")]
        public int EquipId { get; set; }

        [Required]
        [StringLength(31)]
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("notes")]
        public string Notes { get; set; }

        [Required]
        [StringLength(25)]
        [JsonPropertyName("tableName")]
        public string TableName { get; set; }

        [StringLength(128)]
        [JsonPropertyName("manufacturer")]
        public string Manufacturer { get; set; }

        [StringLength(50)]
        [JsonPropertyName("modelNo")]
        public string ModelNo { get; set; }

        [StringLength(50)]
        [JsonPropertyName("serialNo")]
        public string SerialNo { get; set; }

        [StringLength(50)]
        [JsonPropertyName("location")]
        public string Location { get; set; }

        [StringLength(125)]
        [JsonPropertyName("maintAuthID")]
        public string MaintAuthID { get; set; }

        [StringLength(50)]
        [JsonPropertyName("monthName")]
        public string MonthName { get; set; }

        [JsonPropertyName("year")]
        public int Year { get; set; }

        [StringLength(2)]
        [JsonPropertyName("readingType")]
        public string ReadingType { get; set; }

        [JsonPropertyName("batteriesPerString")]
        public int BatteriesPerString { get; set; }

        [JsonPropertyName("batteriesPerPack")]
        public int BatteriesPerPack { get; set; }

        [StringLength(2)]
        [JsonPropertyName("vfSelection")]
        public string VFSelection { get; set; }
    }
}