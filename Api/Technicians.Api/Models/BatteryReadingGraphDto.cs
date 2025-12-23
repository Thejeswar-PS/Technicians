namespace Technicians.Api.Models
{
    public class BatteryReadingGraphDto
    {
        public int EquipID { get; set; }
        public int BatteryId { get; set; }
        public string CallNbr { get; set; }

        public string Status1 { get; set; }
        public string Status2 { get; set; }

        public decimal? ErrorVDC { get; set; }
        public decimal? LowErrorVDC { get; set; }
        public decimal? WarningVDC { get; set; }
        public decimal? LowWarningVDC { get; set; }

        public decimal? VDC { get; set; }
        public decimal? NVDC { get; set; }

        public decimal? RefValue { get; set; }
        public decimal? RefPercent { get; set; }
        public decimal? WarRef { get; set; }
        public decimal? ErrorRef { get; set; }

        public string ReplacementNeeded { get; set; }
        public string MonitoringBattery { get; set; }
        public string Cracks { get; set; }

        public decimal? SpGravity { get; set; }
        public decimal? Strap1 { get; set; }
        public decimal? Strap2 { get; set; }

        public string ActionPlan { get; set; }
        public int ReadingType { get; set; }
        public string FloatVoltS { get; set; }

        public string BatteryTypeName { get; set; }
        public string ChkmVAC { get; set; }
        public string ChkStrap { get; set; }
    }

}
