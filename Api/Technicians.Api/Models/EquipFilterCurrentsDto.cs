using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for EquipFilterCurrents data
    /// </summary>
    public class EquipFilterCurrentsDto
    {
        [Required]
        [StringLength(11)]
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [Required]
        [JsonPropertyName("equipId")]
        public int EquipID { get; set; }

        [JsonPropertyName("chkIpFilter")]
        public bool? ChkIPFilter { get; set; }

        [JsonPropertyName("chkIpThd")]
        public bool? ChkIPTHD { get; set; }

        // Input Filter Current Phase A
        [JsonPropertyName("ipFilterCurrA_T")]
        public decimal? IPFilterCurrA_T { get; set; }

        [JsonPropertyName("ipFilterCurrA_PF")]
        [StringLength(1)]
        public string IPFilterCurrA_PF { get; set; }

        // Input Filter Current Phase B
        [JsonPropertyName("ipFilterCurrB_T")]
        public decimal? IPFilterCurrB_T { get; set; }

        [JsonPropertyName("ipFilterCurrB_PF")]
        [StringLength(1)]
        public string IPFilterCurrB_PF { get; set; }

        // Input Filter Current Phase C
        [JsonPropertyName("ipFilterCurrC_T")]
        public decimal? IPFilterCurrC_T { get; set; }

        [JsonPropertyName("ipFilterCurrC_PF")]
        [StringLength(1)]
        public string IPFilterCurrC_PF { get; set; }

        // Input Filter THD Phase A
        [JsonPropertyName("ipFilterThdA_T")]
        public decimal? IPFilterTHDA_T { get; set; }

        [JsonPropertyName("ipFilterThdA_PF")]
        [StringLength(1)]
        public string IPFilterTHDA_PF { get; set; }

        // Input Filter THD Phase B
        [JsonPropertyName("ipFilterThdB_T")]
        public decimal? IPFilterTHDB_T { get; set; }

        [JsonPropertyName("ipFilterThdB_PF")]
        [StringLength(1)]
        public string IPFilterTHDB_PF { get; set; }

        // Input Filter THD Phase C
        [JsonPropertyName("ipFilterThdC_T")]
        public decimal? IPFilterTHDC_T { get; set; }

        [JsonPropertyName("ipFilterThdC_PF")]
        [StringLength(1)]
        public string IPFilterTHDC_PF { get; set; }

        [JsonPropertyName("chkOpFilter")]
        public bool? ChkOPFilter { get; set; }

        [JsonPropertyName("chkOpThd")]
        public bool? ChkOPTHD { get; set; }

        // Output Filter Current Phase A
        [JsonPropertyName("opFilterCurrA_T")]
        public decimal? OPFilterCurrA_T { get; set; }

        [JsonPropertyName("opFilterCurrA_PF")]
        [StringLength(1)]
        public string OPFilterCurrA_PF { get; set; }

        // Output Filter Current Phase B
        [JsonPropertyName("opFilterCurrB_T")]
        public decimal? OPFilterCurrB_T { get; set; }

        [JsonPropertyName("opFilterCurrB_PF")]
        [StringLength(1)]
        public string OPFilterCurrB_PF { get; set; }

        // Output Filter Current Phase C
        [JsonPropertyName("opFilterCurrC_T")]
        public decimal? OPFilterCurrC_T { get; set; }

        [JsonPropertyName("opFilterCurrC_PF")]
        [StringLength(1)]
        public string OPFilterCurrC_PF { get; set; }

        // Output Filter THD Phase A
        [JsonPropertyName("opFilterThdA_T")]
        public decimal? OPFilterTHDA_T { get; set; }

        [JsonPropertyName("opFilterThdA_PF")]
        [StringLength(1)]
        public string OPFilterTHDA_PF { get; set; }

        // Output Filter THD Phase B
        [JsonPropertyName("opFilterThdB_T")]
        public decimal? OPFilterTHDB_T { get; set; }

        [JsonPropertyName("opFilterThdB_PF")]
        [StringLength(1)]
        public string OPFilterTHDB_PF { get; set; }

        // Output Filter THD Phase C
        [JsonPropertyName("opFilterThdC_T")]
        public decimal? OPFilterTHDC_T { get; set; }

        [JsonPropertyName("opFilterThdC_PF")]
        [StringLength(1)]
        public string OPFilterTHDC_PF { get; set; }

        [JsonPropertyName("modifiedBy")]
        [StringLength(50)]
        public string ModifiedBy { get; set; }
    }
}