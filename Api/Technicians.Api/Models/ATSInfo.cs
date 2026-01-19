namespace Technicians.Api.Models
{
    public class ATSInfo
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public int ATSId { get; set; }
        public string Manufacturer { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public string Temp { get; set; }
        public string Status { get; set; }
        public string Voltage { get; set; }
        public string Amps { get; set; }
        public string Poles { get; set; }
        public string Manuals { get; set; }
        public string Clean { get; set; }
        public string Inspect { get; set; }
        public string CheckContact { get; set; }
        public string InspectARC { get; set; }
        public string TransferSwitch { get; set; }
        public string TestSwitch { get; set; }
        public string Comments1 { get; set; }
        public string EngineStart { get; set; }
        public string TransferEmergency { get; set; }
        public string ReTransferNormal { get; set; }
        public string GensetCooldown { get; set; }
        public string ClockTime { get; set; }
        public string PickupVoltA { get; set; }
        public string PickupVoltB { get; set; }
        public string PickupVoltC { get; set; }
        public string DropoutVoltA { get; set; }
        public string DropoutVoltB { get; set; }
        public string DropoutVoltC { get; set; }
        public string EmVoltPickup { get; set; }
        public string EmVoltDropout { get; set; }
        public string FreqPick { get; set; }
        public string FreqDropout { get; set; }
        public string Comments2 { get; set; }
        public string StatusNotes { get; set; }
        public string Maint_Auth_ID { get; set; }
    }

}
