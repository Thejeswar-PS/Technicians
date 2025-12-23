namespace Technicians.Api.Models
{
    public class SCCDto
    {
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string SCCId { get; set; }

        public string Manufacturer { get; set; }
        public string ModelNo { get; set; }
        public string SerialNo { get; set; }
        public int? Temp { get; set; }
        public string Status { get; set; }

        public string BypassVoltA { get; set; }
        public string BypassVoltB { get; set; }
        public string BypassVoltC { get; set; }

        public string SupplyVoltA { get; set; }
        public string SupplyVoltB { get; set; }
        public string SupplyVoltC { get; set; }

        public string OutputVoltA { get; set; }
        public string OutputVoltB { get; set; }
        public string OutputVoltC { get; set; }

        public string FirmwareVersion { get; set; }
        public string PhaseError { get; set; }
        public string PartNos { get; set; }
        public string LoadCurrent { get; set; }

        public string Comments { get; set; }
        public string StatusNotes { get; set; }
        public string Maint_Auth_ID { get; set; }
        public string SprocName { get; set; }
    }

}
