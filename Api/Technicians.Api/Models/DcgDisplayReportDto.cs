namespace Technicians.Api.Models
{
    public class DcgDisplayReportDto
    {
        public string CustomerNo { get; set; }
        public string CustomerName { get; set; }
        public string Address { get; set; }
        public string SalesPerson { get; set; }
        public string ContractNo { get; set; }
        public string Type { get; set; }
        public DateTime? InvoicedOn { get; set; }
        public decimal Amount { get; set; }
        public DateTime? MailingDt { get; set; }
        public string PORDNMBR { get; set; }
    }

}
