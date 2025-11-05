namespace Technicians.Api.Models
{
    public class aaETechUPS
    {
        // Keys
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string UPSId { get; set; }

        // Basic info
        public string Manufacturer { get; set; }
        public string KVA { get; set; }
        public string MultiModule { get; set; }
        public string MaintByPass { get; set; }
        public string Other { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public string Status { get; set; }
        public string StatusReason { get; set; }
        public string ParallelCabinet { get; set; }

        // Measurement info
        public string Measure_LCD { get; set; }
        public string Measure_Input { get; set; }
        public string Measure_Load { get; set; }
        public string Measure_3Phase { get; set; }
        public string Measure_KVA { get; set; }
        public string Measure_Normal { get; set; }
        public string Measure_Caliberation { get; set; }
        public string Measure_EOL { get; set; }

        // Visual info
        public string Visual_NoAlarms { get; set; }
        public string Visual_Tightness { get; set; }
        public string Visual_Broken { get; set; }
        public string Visual_Vaccum { get; set; }
        public string Visual_EPO { get; set; }
        public string Visual_Noise { get; set; }
        public string Visual_FansAge { get; set; }
        public string Visual_ReplaceFilters { get; set; }

        // Environment info
        public string Environment_RoomTemp { get; set; }
        public string Environment_Saftey { get; set; }
        public string Environment_Clean { get; set; }
        public string Environment_Space { get; set; }
        public string Environment_Circuit { get; set; }

        // Transfer info
        public string Transfer_Major { get; set; }
        public string Transfer_Static { get; set; }
        public string Transfer_ByPass { get; set; }
        public string Transfer_Wave { get; set; }
        public string Transfer_Normal { get; set; }
        public string Transfer_Alarm { get; set; }

        // Comments
        public string Comments1 { get; set; }
        public string Comments2 { get; set; }
        public string Comments3 { get; set; }
        public string Comments4 { get; set; }
        public string Comments5 { get; set; }

        // Checkboxes
        public bool chkDCBreak { get; set; }
        public bool chkOverLoad { get; set; }
        public bool chkTransfer { get; set; }
        public bool chkFault { get; set; }

        // Battery / Air Filter
        public int BatteryStringID { get; set; }
        public string AFLength { get; set; }
        public string AFWidth { get; set; }
        public string AFThick { get; set; }
        public string AFQty { get; set; }
        public string AFLength1 { get; set; }
        public string AFWidth1 { get; set; }
        public string AFThick1 { get; set; }
        public string AFQty1 { get; set; }

        // Date Code fields (missing from original model)
        public string UpsDateCodeMonth { get; set; }
        public int UpsDateCodeYear { get; set; }

        // Maintenance fields
        public DateTime Create_Date { get; set; }
        public string Maint_Auth_ID { get; set; }

        // Input/Output readings
        public string Input { get; set; }
        public double InputVoltA_T { get; set; }
        public string InputVoltA_PF { get; set; }
        public double InputVoltB_T { get; set; }
        public string InputVoltB_PF { get; set; }
        public double InputVoltC_T { get; set; }
        public string InputVoltC_PF { get; set; }

        public double InputCurrA_T { get; set; }
        public string InputCurrA_PF { get; set; }
        public double InputCurrB_T { get; set; }
        public string InputCurrB_PF { get; set; }
        public double InputCurrC_T { get; set; }
        public string InputCurrC_PF { get; set; }

        public double InputFreq_T { get; set; }
        public string InputFreq_PF { get; set; }

        // Bypass
        public string Bypass { get; set; }
        public double BypassVoltA_T { get; set; }
        public string BypassVoltA_PF { get; set; }
        public double BypassVoltB_T { get; set; }
        public string BypassVoltB_PF { get; set; }
        public double BypassVoltC_T { get; set; }
        public string BypassVoltC_PF { get; set; }
        public double BypassCurrA_T { get; set; }
        public string BypassCurrA_PF { get; set; }
        public double BypassCurrB_T { get; set; }
        public string BypassCurrB_PF { get; set; }
        public double BypassCurrC_T { get; set; }
        public string BypassCurrC_PF { get; set; }
        public double BypassFreq_T { get; set; }
        public string BypassFreq_PF { get; set; }

        // Output
        public string Output { get; set; }
        public double OutputVoltA_T { get; set; }
        public string OutputVoltA_PF { get; set; }
        public double OutputVoltB_T { get; set; }
        public string OutputVoltB_PF { get; set; }
        public double OutputVoltC_T { get; set; }
        public string OutputVoltC_PF { get; set; }
        public double OutputCurrA_T { get; set; }
        public string OutputCurrA_PF { get; set; }
        public double OutputCurrB_T { get; set; }
        public string OutputCurrB_PF { get; set; }
        public double OutputCurrC_T { get; set; }
        public string OutputCurrC_PF { get; set; }
        public double OutputFreq_T { get; set; }
        public string OutputFreq_PF { get; set; }
        public double OutputLoadA { get; set; }
        public double OutputLoadB { get; set; }
        public double OutputLoadC { get; set; }
        public double TotalLoad { get; set; }

        // Capacitors / DC/AC
        public string RectFloatVolt_PF { get; set; }
        public double DCVoltage_T { get; set; }
        public string DCVoltage_PF { get; set; }
        public double POStoGND_T { get; set; }
        public string POStoGND_PF { get; set; }
        public double NEGtoGND_T { get; set; }
        public string NEGtoGND_PF { get; set; }

        public string DCCapsLeak_PF { get; set; }
        public string DCCapsAge_PF { get; set; }
        public string ACInputCapsLeak_PF { get; set; }
        public string ACInputCapsAge_PF { get; set; }
        public string ACOutputCapsLeak_PF { get; set; }
        public string ACOutputCapsAge_PF { get; set; }
        public string CommCapsLeak_PF { get; set; }
        public string CommCapsAge_PF { get; set; }

        public string DCGAction1 { get; set; }
        public string CustAction1 { get; set; }
        public string ManufSpecification { get; set; }
        public string DCGAction2 { get; set; }
        public string CustAction2 { get; set; }

        public int DCCapsYear { get; set; }
        public int ACInputCapsYear { get; set; }
        public int ACOutputCapsYear { get; set; }
        public int CommCapsYear { get; set; }
        public int FansYear { get; set; }

        public string Location { get; set; }
        public string SNMPPresent { get; set; }
        public bool SaveAsDraft { get; set; }
        public string ModularUPS { get; set; }

        // Air Filter Email field (from SP)
        public bool AFEmailSent { get; set; }

        public string SvcDescr { get; set; }
    }


}
