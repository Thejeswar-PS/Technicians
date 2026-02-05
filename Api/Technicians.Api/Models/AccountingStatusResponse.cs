namespace Technicians.Api.Models
{
    public class AccountingStatusResponse
    {
        public List<GraphPoint> AccountingStatus { get; set; }
        public List<GraphPoint> ContractBillingStatus { get; set; }
    }

    public class GraphPoint
    {
        public string Label { get; set; }
        public int Value { get; set; }
    }

}
