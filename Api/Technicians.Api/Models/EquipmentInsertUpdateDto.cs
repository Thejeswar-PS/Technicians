using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Technicians.Api.Models
{
    public class EquipmentInsertUpdateDto
    {
        [Required]
        [StringLength(11)]
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; }

        [Required]
        [JsonPropertyName("equipId")]
        public int EquipId { get; set; }

        [Required]
        [StringLength(21)]
        [JsonPropertyName("equipNo")]
        public string EquipNo { get; set; }

        [Required]
        [StringLength(50)]
        [JsonPropertyName("vendorId")]
        public string VendorId { get; set; }

        [Required]
        [StringLength(50)]
        [JsonPropertyName("equipType")]
        public string EquipType { get; set; }

        [StringLength(50)]
        [JsonPropertyName("version")]
        public string Version { get; set; }

        [StringLength(50)]
        [JsonPropertyName("serialID")]
        public string SerialID { get; set; }

        [StringLength(50)]
        [JsonPropertyName("svC_Asset_tag")]
        public string SVC_Asset_Tag { get; set; }

        [StringLength(128)]
        [JsonPropertyName("location")]
        public string Location { get; set; }

        [StringLength(25)]
        [JsonPropertyName("readingType")]
        public string ReadingType { get; set; }

        [StringLength(11)]
        [JsonPropertyName("contract")]
        public string Contract { get; set; }

        [StringLength(128)]
        [JsonPropertyName("taskDescription")]
        public string TaskDesc { get; set; }

        [JsonPropertyName("batteriesPerString")]
        public int BatPerStr { get; set; }

        [StringLength(35)]
        [JsonPropertyName("codeEquipmentStatus")]
        public string EquipStatus { get; set; }

        [StringLength(128)]
        [JsonPropertyName("maint_Auth_ID")]
        public string MaintAuth { get; set; }

        [StringLength(10)]
        [JsonPropertyName("upskva")]
        [JsonConverter(typeof(NumericToStringConverter))]
        public string KVA { get; set; }

        [StringLength(50)]
        [JsonPropertyName("equipMonth")]
        public string EquipMonth { get; set; }

        [JsonPropertyName("equipYear")]
        public int EquipYear { get; set; }

        [StringLength(50)]
        [JsonPropertyName("dcfCapsPartNo")]
        public string DCFCapsPartNo { get; set; }

        [StringLength(50)]
        [JsonPropertyName("acfipCapsPartNo")]
        public string ACFIPCapsPartNo { get; set; }

        [JsonPropertyName("dcfQty")]
        public int DCFQty { get; set; }

        [JsonPropertyName("acfipQty")]
        public int ACFIPQty { get; set; }

        [StringLength(50)]
        [JsonPropertyName("dcfCapsMonthName")]
        public string DCFCapsMonthName { get; set; }

        [StringLength(50)]
        [JsonPropertyName("acfipCapsMonthName")]
        public string ACFIPCapsMonthName { get; set; }

        [JsonPropertyName("dcfCapsYear")]
        public int DCFCapsYear { get; set; }

        [JsonPropertyName("acfipYear")]
        public int ACFIPYear { get; set; }

        [StringLength(50)]
        [JsonPropertyName("dcCommCapsPartNo")]
        public string DCCommCapsPartNo { get; set; }

        [StringLength(50)]
        [JsonPropertyName("acfopCapsPartNo")]
        public string ACFOPCapsPartNo { get; set; }

        [JsonPropertyName("dcCommQty")]
        public int DCCommQty { get; set; }

        [JsonPropertyName("acfopQty")]
        public int ACFOPQty { get; set; }

        [StringLength(50)]
        [JsonPropertyName("dcCommCapsMonthName")]
        public string DCCommCapsMonthName { get; set; }

        [StringLength(50)]
        [JsonPropertyName("acfopCapsMonthName")]
        public string ACFOPCapsMonthName { get; set; }

        [JsonPropertyName("dcCommCapsYear")]
        public int DCCommCapsYear { get; set; }

        [JsonPropertyName("acfopYear")]
        public int ACFOPYear { get; set; }

        [JsonPropertyName("batteriesPerPack")]
        public int BatteriesPerPack { get; set; }

        [StringLength(2)]
        [JsonPropertyName("vfSelection")]
        public string VFSelection { get; set; }

        [StringLength(100)]
        [JsonPropertyName("fansPartNo")]
        public string FansPartNo { get; set; }

        [JsonPropertyName("fansQty")]
        public int FansQty { get; set; }

        [StringLength(50)]
        [JsonPropertyName("fansMonth")]
        public string FansMonth { get; set; }

        [JsonPropertyName("fansYear")]
        public int FansYear { get; set; }

        [StringLength(100)]
        [JsonPropertyName("blowersPartNo")]
        public string BlowersPartNo { get; set; }

        [JsonPropertyName("blowersQty")]
        public int BlowersQty { get; set; }

        [StringLength(50)]
        [JsonPropertyName("blowersMonth")]
        public string BlowersMonth { get; set; }

        [JsonPropertyName("blowersYear")]
        public int BlowersYear { get; set; }

        [StringLength(100)]
        [JsonPropertyName("miscPartNo")]
        public string MiscPartNo { get; set; }

        [JsonPropertyName("miscQty")]
        public int MiscQty { get; set; }

        [StringLength(50)]
        [JsonPropertyName("miscMonth")]
        public string MiscMonth { get; set; }

        [JsonPropertyName("miscYear")]
        public int MiscYear { get; set; }

        [StringLength(1000)]
        [JsonPropertyName("comments")]
        public string Comments { get; set; }

        public class NumericToStringConverter : JsonConverter<string>
        {
            public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.String)
                {
                    return reader.GetString();
                }
                if (reader.TokenType == JsonTokenType.Number)
                {
                    return reader.GetDouble().ToString();
                }
                throw new JsonException();
            }

            public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
            {
                writer.WriteStringValue(value);
            }
        }
    }
}