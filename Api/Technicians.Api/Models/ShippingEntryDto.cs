namespace Technicians.Api.Models
{
    public class ShippingEntryDto
    {
        public int ShippingID { get; set; }
        public string Company { get; set; } = string.Empty;
        public string Tracking { get; set; } = string.Empty;
        public string Cost { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class SaveShippingEntriesRequest
    {
        public string CallNbr { get; set; } = string.Empty;
        public List<ShippingEntryDto> Entries { get; set; } = new();
    }

    public class DeleteShippingEntryRequest
    {
        public string CallNbr { get; set; } = string.Empty;
        public int ShippingId { get; set; }
    }
}
