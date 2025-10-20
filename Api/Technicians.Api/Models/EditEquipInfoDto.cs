using System.ComponentModel.DataAnnotations.Schema;

namespace Technicians.Api.Models
{
    public class EditEquipInfoDto
    {
        // Core Equipment Information
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string EquipNo { get; set; }
        public string EquipName { get; set; }
        public string EquipType { get; set; }
        public string Location { get; set; }
        public string VendorId { get; set; }
        public string Version { get; set; }
        //public string SVC_Asset_tag { get; set; }  // ✅ FIXED: lowercase 't'
        public string SerialID { get; set; }
        public string ReadingType { get; set; }
        //public decimal? UpsKva { get; set; }        // ✅ FIXED: was Upskva
        public string CodeEquipmentStatus { get; set; }
        public string Contract { get; set; }
        public string TaskDescription { get; set; }
        public string EquipMonth { get; set; }
        public int? EquipYear { get; set; }

        // Battery Information
        public int? BatteriesPerString { get; set; }
        public int? BatteriesPerPack { get; set; }
        public string VFSelection { get; set; }

        // DC Filter Capacitors (DCF)
        public string DCFCapsPartNo { get; set; }
        public int? DCFQty { get; set; }
        public string DCFCapsMonthName { get; set; }
        //public int? DCFCapsYear { get; set; }       // ✅ FIXED: was DCCapsYear

        // AC Input Capacitors (ACFIP)
        public string ACFIPCapsPartNo { get; set; }
        public int? ACFIPQty { get; set; }
        public string ACFIPCapsMonthName { get; set; }
        //public int? ACFIPYear { get; set; }

        // DC Commutating Capacitors (DCComm)
        public string DCCommCapsPartNo { get; set; }
        public int? DCCommQty { get; set; }
        public string DCCommCapsMonthName { get; set; }
        public int? DCCommCapsYear { get; set; }

        // AC Output Capacitors (ACFOP)
        public string ACFOPCapsPartNo { get; set; }
        public int? ACFOPQty { get; set; }
        public string ACFOPCapsMonthName { get; set; }
        //public int? ACFOPYear { get; set; }

        // Fans Information
        public string FansPartNo { get; set; }
        public int? FansQty { get; set; }
        public string FansMonth { get; set; }
        public int? FansYear { get; set; }

        // Blowers Information
        public string BlowersPartNo { get; set; }
        public int? BlowersQty { get; set; }
        public string BlowersMonth { get; set; }
        public int? BlowersYear { get; set; }

        // Miscellaneous Information
        public string MiscPartNo { get; set; }
        public int? MiscQty { get; set; }
        public string MiscMonth { get; set; }
        public int? MiscYear { get; set; }

        // Comments
        public string Comments { get; set; }

        // Optional Legacy Fields (keep if needed for compatibility)
        public string BatteryHousing { get; set; }
        public string BatteryType { get; set; }
        public string FloatVoltV { get; set; }
        public string FloatVoltS { get; set; }

        [Column("DCCapsYear")]  // Maps database column to DTO property
        public int? DCFCapsYear { get; set; }

        [Column("ACInputCapsYear")]
        public int? ACFIPYear { get; set; }

        [Column("ACOutputCapsYear")]
        public int? ACFOPYear { get; set; }

        [Column("SVC_Asset_Tag")]  // If database has different case
        public string SVC_Asset_tag { get; set; }

        [Column("Upskva")]  // If database column is different
        public decimal? UpsKva { get; set; }
    }
}
