namespace Technicians.Api.Models
{
    public class BatteryMakeDto
    {
        public string Text { get; set; }
        public string Value { get; set; }
    }

    public class MidtronicsRefValueDto
    {
        public Dictionary<string, object> Columns { get; set; }
    }

    public class UpdateMidtronicsRefValueRequest
    {
        public int EquipID { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public decimal RefValue { get; set; }
        public decimal Resistance { get; set; }
        public DateTime? LastModified { get; set; }
    }

}
