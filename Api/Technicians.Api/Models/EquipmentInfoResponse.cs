namespace Technicians.Api.Models
{
    public class EquipmentInfoResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public EquipmentInfo Equipment { get; set; }
        public BatteryLookupInfo Battery { get; set; }
    }
}
