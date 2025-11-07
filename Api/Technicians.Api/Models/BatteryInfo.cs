namespace Technicians.Api.Models
{
    public class BatteryInfo
    {
        public string BatteryId { get; set; }
        public decimal? Temp { get; set; }
        public decimal? Vdc { get; set; }
        public decimal? Vac { get; set; }
        public decimal? Milliohms { get; set; }
        public string Strap1 { get; set; }
        public string Strap2 { get; set; }
        public decimal? SpGravity { get; set; }
        public string Cracks { get; set; }
        public string ReplacementNeeded { get; set; }
        public string MonitoringBattery { get; set; }
        public string ActionPlan { get; set; }
        public DateTime? LastModified { get; set; }
        public string MaintAuthId { get; set; }
    }

}
