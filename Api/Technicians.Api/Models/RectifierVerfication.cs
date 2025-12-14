namespace Technicians.Api.Models
{
    public class RectifierVerification
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string RectifierId { get; set; }

        public string Manufacturer { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public int Temp { get; set; }
        public string Status { get; set; }

        public string DCBus_Make { get; set; }
        public int DCBus_Quantity { get; set; }
        public string DCBus_Age { get; set; }

        public string Input_Make { get; set; }
        public int Input_Quantity { get; set; }
        public string Input_Age { get; set; }

        public string Comm_Make { get; set; }
        public int Comm_Quantity { get; set; }
        public string Comm_Age { get; set; }

        public string CurrLimitAlarms { get; set; }
        public string HiVoltAlarm { get; set; }
        public string ShutdownAlarm { get; set; }
        public string LowCurrAlarm { get; set; }
        public string LoadSharing { get; set; }
        public string VisualInspection { get; set; }
        public string Comments { get; set; }

        public double Input208AVoltAtoB_T { get; set; }
        public string Input208AVoltAtoB_PF { get; set; }
        public double Input208CurrA_T { get; set; }
        public string Input208CurrA_PF { get; set; }
        public double Input208AVoltBtoC_T { get; set; }
        public string Input208AVoltBtoC_PF { get; set; }
        public double Input208CurrB_T { get; set; }
        public string Input208CurrB_PF { get; set; }
        public double Input208AVoltCtoA_T { get; set; }
        public string Input208AVoltCtoA_PF { get; set; }
        public double Input208CurrC_T { get; set; }
        public string Input208CurrC_PF { get; set; }

        public double Frequency_T { get; set; }
        public string Frequency_PF { get; set; }

        public double EqVoltage_T { get; set; }
        public string EqVoltage_PF { get; set; }
        public double FilterCurrent_T { get; set; }
        public string FilterCurrent_PF { get; set; }
        public double FloatVoltage_T { get; set; }
        public string FloatVoltage_PF { get; set; }
        public double LoadCurrent_T { get; set; }
        public string LoadCurrent_PF { get; set; }

        public int Used_PartsInstalled { get; set; }
        public int Used_PartsShipped { get; set; }
        public int Used_FaultyCircuits { get; set; }

        public string Add_Type { get; set; }
        public string Add_Manuf { get; set; }
        public int Add_Quantity { get; set; }
        public string Add_ImmedAction { get; set; }
        public string UpgNonCritical { get; set; }

        public string Comments1 { get; set; }
        public string StatusNotes { get; set; }
        public string Maint_Auth_Id { get; set; }
    }

}
