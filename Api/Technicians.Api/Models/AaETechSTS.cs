namespace Technicians.Api.Models
{
    public class AaETechSTS
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string STSId { get; set; }

        public string Manufacturer { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public string Location { get; set; }
        public string Month { get; set; }
        public int Year { get; set; }
        public int Temp { get; set; }
        public string Status { get; set; }

        public string Busswork { get; set; }
        public string Transformers { get; set; }
        public string PowerConn { get; set; }
        public string MainCirBreaks { get; set; }
        public string SubfeedCirBreaks { get; set; }
        public string CurrentCTs { get; set; }
        public string CircuitBoards { get; set; }
        public string FanCapacitors { get; set; }
        public string EPOConn { get; set; }
        public string WiringConn { get; set; }
        public string RibbonCables { get; set; }
        public string CompAirClean { get; set; }
        public string FrontPanel { get; set; }
        public string InternalPower { get; set; }
        public string LocalMonitoring { get; set; }
        public string LocalEPO { get; set; }

        public string KVA { get; set; }
        public string StatusNotes { get; set; }
        public string Comments { get; set; }
        public string Comments1 { get; set; }
        public string Comments5 { get; set; }

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

        public string OutputLoadA_PF { get; set; }
        public string OutputLoadB_PF { get; set; }
        public string OutputLoadC_PF { get; set; }

        public string TVerification { get; set; }
        public string PrefAlter { get; set; }
        public string TransByPass { get; set; }
        public string STSByPass { get; set; }
        public string VerifyAlarm { get; set; }

        public string SrcTwo { get; set; }
        public double SrcTwoVoltA_T { get; set; }
        public string SrcTwoVoltA_PF { get; set; }
        public double SrcTwoVoltB_T { get; set; }
        public string SrcTwoVoltB_PF { get; set; }
        public double SrcTwoVoltC_T { get; set; }
        public string SrcTwoVoltC_PF { get; set; }
        public double SrcTwoCurrA_T { get; set; }
        public string SrcTwoCurrA_PF { get; set; }
        public double SrcTwoCurrB_T { get; set; }
        public string SrcTwoCurrB_PF { get; set; }
        public double SrcTwoCurrC_T { get; set; }
        public string SrcTwoCurrC_PF { get; set; }
        public double SrcTwoFreq_T { get; set; }
        public string SrcTwoFreq_PF { get; set; }

        public string Maint_Auth_Id { get; set; }
        public bool SaveAsDraft { get; set; }
    }

}
