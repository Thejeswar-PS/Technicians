using System.ComponentModel.DataAnnotations.Schema;

namespace Technicians.Api.Models
{
    public class EditEquipInfoDto
    {
        // Core Equipment Information - Direct matches from SP
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string EquipNo { get; set; }
        public short? SrvrecType { get; set; }
        public string VendorId { get; set; }
        public string EquipType { get; set; }
        public string Version { get; set; }
        public string SVC_Asset_tag { get; set; }
        public string SerialID { get; set; }
        public string Location { get; set; }
        public char? Scheduled { get; set; }
        public string Probcde { get; set; }
        public string ReadingType { get; set; }
        public string Contract { get; set; }
        public string TaskDescription { get; set; }
        public string Spec { get; set; }
        public float? Upskva { get; set; }
        public short? BatteriesPerString { get; set; }
        public string CodeEquipmentStatus { get; set; }
        public DateTime? Create_Date { get; set; }
        public DateTime? Last_Modifed { get; set; }
        public string Maint_Auth_ID { get; set; }
        public int? Processed { get; set; }
        public string EquipMonth { get; set; }
        public int? EquipYear { get; set; }

        // Battery Information
        public int? BatteriesPerPack { get; set; }
        public string VFSelection { get; set; }

        // DC Filter Capacitors (DCF) - Exact matches from SP
        public string DCFCapsPartNo { get; set; }
        public int? DCFQty { get; set; }
        public string DCFCapsMonthName { get; set; }
        public int? DCFCapsYear { get; set; }

        // AC Input Filter Capacitors (ACFIP) - Exact matches from SP
        public string ACFIPCapsPartNo { get; set; }
        public int? ACFIPQty { get; set; }
        public string ACFIPCapsMonthName { get; set; }
        public int? ACFIPYear { get; set; }

        // DC Commutating Capacitors (DCComm) - Exact matches from SP
        public string DCCommCapsPartNo { get; set; }
        public int? DCCommQty { get; set; }
        public string DCCommCapsMonthName { get; set; }
        public int? DCCommCapsYear { get; set; }

        // AC Output Filter Capacitors (ACFOP) - Exact matches from SP
        public string ACFOPCapsPartNo { get; set; }
        public int? ACFOPQty { get; set; }
        public string ACFOPCapsMonthName { get; set; }
        public int? ACFOPYear { get; set; }

        // Additional Equipment Information (from AdditionalEquipInfo join)
        public string FansPartNo { get; set; }
        public string FansQty { get; set; }  // Note: SP returns as string with ISNULL conversion
        public string FansMonth { get; set; }
        public string FansYear { get; set; }  // Note: SP returns as string with ISNULL conversion

        public string BlowersPartNo { get; set; }
        public string BlowersQty { get; set; }  // Note: SP returns as string with ISNULL conversion
        public string BlowersMonth { get; set; }
        public string BlowersYear { get; set; }  // Note: SP returns as string with ISNULL conversion

        public string MiscPartNo { get; set; }
        public string MiscQty { get; set; }  // Note: SP returns as string with ISNULL conversion
        public string MiscMonth { get; set; }
        public string MiscYear { get; set; }  // Note: SP returns as string with ISNULL conversion

        // Comments from AdditionalEquipInfo table
        public string Comments { get; set; }

        // Legacy fields for backward compatibility (if still needed)
        public string BatteryHousing { get; set; }
        public string BatteryType { get; set; }
        public string FloatVoltV { get; set; }
        public string FloatVoltS { get; set; }
    }
}
