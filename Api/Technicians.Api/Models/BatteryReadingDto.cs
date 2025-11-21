namespace Technicians.Api.Models
{
    public class BatteryReadingDto
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string BatteryStringId { get; set; }
        public int BatteryId { get; set; }
        public int Temp { get; set; }
        public decimal Vdc { get; set; }
        public decimal Mhos { get; set; }
        public decimal Strap1 { get; set; }
        public decimal Strap2 { get; set; }
        public decimal SpGravity { get; set; }
        public decimal Vac { get; set; }
        public string Cracks { get; set; }
        public string ReplacementNeeded { get; set; }
        public string MonitoringBattery { get; set; }
        public string ActionPlan { get; set; }
        public DateTime LastModified { get; set; }
        public string MaintAuthId { get; set; }
    }

}
