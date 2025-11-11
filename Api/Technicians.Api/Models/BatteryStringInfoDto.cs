namespace Technicians.Api.Models
{
    public class BatteryStringInfoDto
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string BatStrId { get; set; }
        public double BatVoltage { get; set; }
        public string BatVoltatePf { get; set; }
        public double PlusTerminal { get; set; }
        public string PlusTerminalPf { get; set; }
        public double MinusTerminal { get; set; }
        public string MinusTerminalPf { get; set; }
        public double DcCharging { get; set; }
        public string DcChargingPf { get; set; }
        public double AcRipple { get; set; }
        public string AcRipplePf { get; set; }
        public double AcRippleCurrent { get; set; }
        public string AcRippleCurrentPf { get; set; }
        public string ResistancePf { get; set; }
        public string CodeTorquePf { get; set; }
        public string Comment { get; set; }
        public string EquipStatus { get; set; }
        public string MaintAuthId { get; set; }

        public string Manufacturer { get; set; }
        public string BatteryHousing { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public string BatteryType { get; set; }
        public string BatteryTypeName { get; set; }

        public string MonthName { get; set; }
        public int Year { get; set; }
        public string CommentsUsed { get; set; }
        public bool BulgedCheck { get; set; }
        public string BulgedPf { get; set; }
        public bool CrackedCheck { get; set; }
        public string CrackedPf { get; set; }
        public bool DebrisCheck { get; set; }
        public string DebrisPf { get; set; }
        public string Rotten { get; set; }
        public string VerifySaftey { get; set; }
        public string ContainerComments { get; set; }
        public string EnvironmentComments { get; set; }

        public string ReadingType { get; set; }
        public string StringType { get; set; }
        public string ElectrolytesComments { get; set; }
        public string BatteryTempPf { get; set; }
        public int RoomTemp { get; set; }
        public int BattTemp { get; set; }
        public string BattTempPf { get; set; }
        public int QuantityUsed { get; set; }
        public int QuantityNeeded { get; set; }
        public string ReasonReplace { get; set; }
        public string FloatVoltS { get; set; }
        public string FloatVoltV { get; set; }
        public string IntercellConnector { get; set; }
        public bool ReplaceWholeString { get; set; }
        public bool ChckmVac { get; set; }
        public bool ChkStrap { get; set; }
        public string RepMonCalc { get; set; }
        public int BatteryPackCount { get; set; }
        public string IndBattDisconnect { get; set; }
        public string IndBattInterConn { get; set; }
        public string RackIntegrity { get; set; }
        public string VentFanOperation { get; set; }
        public string DdlBattTerminal { get; set; }
        public string DdlBattTypeTerminal { get; set; }
        public string TxtBattTerminal { get; set; }
        public string ReadingMethod { get; set; }
        public bool ChkGraph { get; set; }
        public bool SaveAsDraft { get; set; }
        public string Location { get; set; }
    }
}
