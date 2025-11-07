namespace Technicians.Api.Models

{
    public class BatteryStringInfo
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string BatteryStringId { get; set; }
        public string Manufacturer { get; set; }
        public string BatteryHousing { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public string BatteryType { get; set; }
        public string EquipStatus { get; set; }
        public string BatteryDateCodeMonth { get; set; }
        public int? BatteryDateCodeYear { get; set; }
        public string Comments_Used { get; set; }
        public bool? Bulged_Check { get; set; }
        public string Bulged_PF { get; set; }
        public bool? Cracked_Check { get; set; }
        public string Cracked_PF { get; set; }
        public bool? Debris_Check { get; set; }
        public string Debris_PF { get; set; }
        public string Rotten { get; set; }
        public string VerifySaftey { get; set; }
        public string ContainerComments { get; set; }
        public string EnvironmentComments { get; set; }
        public double? BatteryVoltage { get; set; }
        public double? PlusTerminalToGround { get; set; }
        public double? MinusTerminalToGround { get; set; }
        public double? DCChargingCurrent { get; set; }
        public double? ACRipple { get; set; }
        public double? ACRippleCurrent { get; set; }
        public string VoltageStatus { get; set; }
        public string PlusTermStatus { get; set; }
        public string MinusTermStatus { get; set; }
        public string DCChargingStatus { get; set; }
        public string ACRippleStatus { get; set; }
        public string ACRippleCurrentStatus { get; set; }
        public string InterCellStatus { get; set; }
        public string TorqueStatus { get; set; }
        public string Comment { get; set; }
        public string PlusWrapped_PF { get; set; }
        public bool? PlusWrapped_Check { get; set; }
        public bool? PlusSulfated_Check { get; set; }
        public bool? PlusMisPos_Check { get; set; }
        public bool? Missing_Check { get; set; }
        public string Missing_PF { get; set; }
        public bool? Broken_Check { get; set; }
        public bool? NeedsCleaning_Check { get; set; }
        public string PlatesComments { get; set; }
        public string WaterLevel_T { get; set; }
        public string WaterLevel_PF { get; set; }
        public string ElectrolytesComments { get; set; }
        public string BatteryTemp_PF { get; set; }
        public int? Temp { get; set; }
        public int? Quantity_Used { get; set; }
        public int? TobeMonitored { get; set; }
        public string Reason_Replace { get; set; }
        public string FloatVoltS { get; set; }
        public string FloatVoltV { get; set; }
        public string IntercellConnector { get; set; }
        public bool? ReplaceWholeString { get; set; }
        public DateTime? CreatedOn { get; set; }
        public DateTime? LastModified { get; set; }
        public string Maint_Auth_Id { get; set; }
        public string RepMonCalc { get; set; }
        public int? BatteryPackCount { get; set; }
        public string IndBattDisconnect { get; set; }
        public string IndBattInterConn { get; set; }
        public string RackIntegrity { get; set; }
        public string VFOperation { get; set; }
        public string Location { get; set; }
        public string ReadingType { get; set; }
        public bool? SaveAsDraft { get; set; }
        public bool? chkmVAC { get; set; }
        public bool? chkStrap { get; set; }
        public int? BattTemp { get; set; }
        public string BattTemp_PF { get; set; }
        public string BatteryTypeName { get; set; }
        public string StringType { get; set; }
        public string BattTerminalS { get; set; }
        public string BattTerminalT { get; set; }
        public string BattTypeTerminal { get; set; }
        public string BattProActiveReplace { get; set; }
        public string ReadingMethod { get; set; }
        public bool? chkGraph { get; set; }
    }

}

