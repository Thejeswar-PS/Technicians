using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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

    [StringLength(1)]
    [JsonPropertyName("scheduled")]
    public string Scheduled { get; set; } = "Y"; // Default to 'Y'
}