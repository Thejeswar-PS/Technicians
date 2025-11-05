using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    public class SaveUpdateaaETechUPSDto
    {
        // Keys
        [Required]
        [MaxLength(11)]
        public string CallNbr { get; set; }
        
        [Required]
        public int EquipId { get; set; }
        
        [Required]
        [MaxLength(21)]
        public string UpsId { get; set; }

        // Basic info - Most fields are optional in the SP
        [MaxLength(128)]
        public string? Manufacturer { get; set; }
        
        [MaxLength(10)]
        public string? KVA { get; set; }
        
        [MaxLength(2)]
        public string? MultiModule { get; set; }
        
        [MaxLength(2)]
        public string? MaintByPass { get; set; }
        
        [MaxLength(50)]
        public string? Other { get; set; }
        
        [MaxLength(50)]
        public string? ModelNo { get; set; }
        
        [MaxLength(50)]
        public string? SerialNo { get; set; }
        
        [MaxLength(35)]
        public string? Status { get; set; }
        
        [MaxLength(2)]
        public string? ParallelCabinet { get; set; }

        // Measurement info
        [MaxLength(1)]
        public string? Measure_Input { get; set; }
        
        [MaxLength(1)]
        public string? Measure_LCD { get; set; }
        
        [MaxLength(1)]
        public string? Measure_Load { get; set; }
        
        [MaxLength(1)]
        public string? Measure_3Phase { get; set; }
        
        [MaxLength(1)]
        public string? Measure_KVA { get; set; }
        
        [MaxLength(1)]
        public string? Measure_Normal { get; set; }
        
        [MaxLength(1)]
        public string? Measure_Caliberation { get; set; }
        
        [MaxLength(1)]
        public string? Measure_EOL { get; set; }

        // Visual info
        [MaxLength(1)]
        public string? Visual_NoAlarms { get; set; }
        
        [MaxLength(1)]
        public string? Visual_Tightness { get; set; }
        
        [MaxLength(1)]
        public string? Visual_Broken { get; set; }
        
        [MaxLength(1)]
        public string? Visual_Vaccum { get; set; }
        
        [MaxLength(2)]
        public string? Visual_EPO { get; set; }
        
        [MaxLength(1)]
        public string? Visual_Noise { get; set; }
        
        [MaxLength(1)]
        public string? Visual_FansAge { get; set; }
        
        [MaxLength(1)]
        public string? Visual_ReplaceFilters { get; set; }

        // Environment info
        [MaxLength(1)]
        public string? Environment_RoomTemp { get; set; }
        
        [MaxLength(1)]
        public string? Environment_Saftey { get; set; }
        
        [MaxLength(2)]
        public string? Environment_Clean { get; set; }
        
        [MaxLength(1)]
        public string? Environment_Space { get; set; }
        
        [MaxLength(1)]
        public string? Environment_Circuit { get; set; }

        // Transfer info
        [MaxLength(2)]
        public string? Transfer_Major { get; set; }
        
        [MaxLength(1)]
        public string? Transfer_Static { get; set; }
        
        [MaxLength(2)]
        public string? Transfer_ByPass { get; set; }
        
        [MaxLength(1)]
        public string? Transfer_Wave { get; set; }
        
        [MaxLength(1)]
        public string? Transfer_Normal { get; set; }
        
        [MaxLength(1)]
        public string? Transfer_Alarm { get; set; }

        // Comments
        [MaxLength(500)]
        public string? Comments1 { get; set; }
        
        [MaxLength(500)]
        public string? Comments2 { get; set; }
        
        [MaxLength(500)]
        public string? Comments3 { get; set; }
        
        [MaxLength(500)]
        public string? Comments4 { get; set; }
        
        [MaxLength(500)]
        public string? Comments5 { get; set; }

        // Date Code
        [MaxLength(25)]
        public string? DateCodeMonth { get; set; }
        
        public int DateCodeYear { get; set; }
        
        [MaxLength(500)]
        public string? StatusReason { get; set; }

        // Checkboxes
        public bool chkDCBreak { get; set; }
        public bool chkOverLoad { get; set; }
        public bool chkTransfer { get; set; }
        public bool chkFault { get; set; }

        // Battery / Air Filter
        public int BatteryStringID { get; set; }
        public float AFLength { get; set; }
        public float AFWidth { get; set; }
        public float AFThickness { get; set; }
        public float AFQty { get; set; }
        public float AFLength1 { get; set; }
        public float AFWidth1 { get; set; }
        public float AFThickness1 { get; set; }
        public float AFQty1 { get; set; }
        
        // This field is required by the database - make it non-nullable with default
        [Required]
        [MaxLength(128)]
        public string Maint_Auth_ID { get; set; } = "SYSTEM";

        // Input/Output readings
        [MaxLength(2)]
        public string? Input { get; set; }
        
        public decimal InputVoltA_T { get; set; }
        
        [MaxLength(1)]
        public string? InputVoltA_PF { get; set; }
        
        public decimal InputVoltB_T { get; set; }
        
        [MaxLength(1)]
        public string? InputVoltB_PF { get; set; }
        
        public decimal InputVoltC_T { get; set; }
        
        [MaxLength(1)]
        public string? InputVoltC_PF { get; set; }
        
        public decimal InputCurrA_T { get; set; }
        
        [MaxLength(1)]
        public string? InputCurrA_PF { get; set; }
        
        public decimal InputCurrB_T { get; set; }
        
        [MaxLength(1)]
        public string? InputCurrB_PF { get; set; }
        
        public decimal InputCurrC_T { get; set; }
        
        [MaxLength(1)]
        public string? InputCurrC_PF { get; set; }
        
        public decimal InputFreq_T { get; set; }
        
        [MaxLength(1)]
        public string? InputFreq_PF { get; set; }

        // Bypass
        [MaxLength(2)]
        public string? Bypass { get; set; }
        
        public decimal BypassVoltA_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassVoltA_PF { get; set; }
        
        public decimal BypassVoltB_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassVoltB_PF { get; set; }
        
        public decimal BypassVoltC_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassVoltC_PF { get; set; }
        
        public decimal BypassCurrA_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassCurrA_PF { get; set; }
        
        public decimal BypassCurrB_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassCurrB_PF { get; set; }
        
        public decimal BypassCurrC_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassCurrC_PF { get; set; }
        
        public decimal BypassFreq_T { get; set; }
        
        [MaxLength(1)]
        public string? BypassFreq_PF { get; set; }

        // Output
        [MaxLength(2)]
        public string? Output { get; set; }
        
        public decimal OutputVoltA_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputVoltA_PF { get; set; }
        
        public decimal OutputVoltB_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputVoltB_PF { get; set; }
        
        public decimal OutputVoltC_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputVoltC_PF { get; set; }
        
        public decimal OutputCurrA_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputCurrA_PF { get; set; }
        
        public decimal OutputCurrB_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputCurrB_PF { get; set; }
        
        public decimal OutputCurrC_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputCurrC_PF { get; set; }
        
        public decimal OutputFreq_T { get; set; }
        
        [MaxLength(1)]
        public string? OutputFreq_PF { get; set; }
        
        public decimal OutputLoadA { get; set; }
        public decimal OutputLoadB { get; set; }
        public decimal OutputLoadC { get; set; }
        public decimal TotalLoad { get; set; }

        // Capacitors / DC/AC
        [MaxLength(1)]
        public string? RectFloatVolt_PF { get; set; }
        
        public decimal DCVoltage_T { get; set; }
        
        [MaxLength(1)]
        public string? DCVoltage_PF { get; set; }
        
        public decimal ACRipple_T { get; set; }
        
        [MaxLength(1)]
        public string? ACRipple_PF { get; set; }
        
        public decimal DCCurrent_T { get; set; }
        
        [MaxLength(1)]
        public string? DCCurrent_PF { get; set; }
        
        public decimal ACRippleVolt_T { get; set; }
        
        [MaxLength(1)]
        public string? ACRippleVolt_PF { get; set; }
        
        public decimal POStoGND_T { get; set; }
        
        [MaxLength(1)]
        public string? POStoGND_PF { get; set; }
        
        public decimal ACRippleCurr_T { get; set; }
        
        [MaxLength(1)]
        public string? ACRippleCurr_PF { get; set; }
        
        public decimal NEGtoGND_T { get; set; }
        
        [MaxLength(1)]
        public string? NEGtoGND_PF { get; set; }
        
        [MaxLength(1)]
        public string? OutputLoadA_PF { get; set; }
        
        [MaxLength(1)]
        public string? OutputLoadB_PF { get; set; }
        
        [MaxLength(1)]
        public string? OutputLoadC_PF { get; set; }

        [MaxLength(2)]
        public string? DCCapsLeak_PF { get; set; }
        
        [MaxLength(1)]
        public string? DCCapsAge_PF { get; set; }
        
        [MaxLength(2)]
        public string? ACInputCapsLeak_PF { get; set; }
        
        [MaxLength(1)]
        public string? ACInputCapsAge_PF { get; set; }
        
        [MaxLength(2)]
        public string? ACOutputCapsLeak_PF { get; set; }
        
        [MaxLength(1)]
        public string? ACOutputCapsAge_PF { get; set; }
        
        [MaxLength(2)]
        public string? CommCapsLeak_PF { get; set; }
        
        [MaxLength(1)]
        public string? CommCapsAge_PF { get; set; }
        
        [MaxLength(1)]
        public string? DCGAction1 { get; set; }
        
        [MaxLength(1)]
        public string? CustAction1 { get; set; }
        
        [MaxLength(1)]
        public string? ManufSpecification { get; set; }
        
        [MaxLength(1)]
        public string? DCGAction2 { get; set; }
        
        [MaxLength(1)]
        public string? CustAction2 { get; set; }

        public int DCCapsYear { get; set; }
        public int ACInputCapsYear { get; set; }
        public int ACOutputCapsYear { get; set; }
        public int CommCapsYear { get; set; }
        public int FansYear { get; set; }

        [MaxLength(128)]
        public string? Location { get; set; }
        
        [MaxLength(2)]
        public string? SNMPPresent { get; set; }
        
        public bool SaveAsDraft { get; set; }
        
        [MaxLength(2)]
        public string? ModularUPS { get; set; }
    }
}