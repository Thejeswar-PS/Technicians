namespace Technicians.Api.Models
{
    public class EditEquipInfoDto
    {
        // Equipment Info
        public int EquipId { get; set; }
        public string EquipNo { get; set; }
        public string EquipName { get; set; }
        public string EquipType { get; set; }
        public string Location { get; set; }
        public string Status { get; set; }

        public string FansPartNo { get; set; }
        public string FansQty { get; set; }
        public string FansMonth { get; set; }
        public string FansYear { get; set; }

        public string BlowersPartNo { get; set; }
        public string BlowersQty { get; set; }
        public string BlowersMonth { get; set; }
        public string BlowersYear { get; set; }

        public string MiscPartNo { get; set; }
        public string MiscQty { get; set; }
        public string MiscMonth { get; set; }
        public string MiscYear { get; set; }

        // Battery Info (previously separate DTO)
        public string BatteryHousing { get; set; }
        public string BatteryType { get; set; }
        public string FloatVoltV { get; set; }
        public string FloatVoltS { get; set; }

        public int DCCapsYear { get; set; }
        public int ACInputCapsYear { get; set; }
        public int DCCommCapsYear { get; set; }
        public int ACOutputCapsYear { get; set; }

        // You can add additional fields from SP as needed
    }

}
