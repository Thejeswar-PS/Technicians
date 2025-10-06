namespace Technicians.Api.Models
{
    public class MobileReceiptDto
    {
        public string CallNbr { get; set; }
        public string CodeDesc { get; set; }
        public decimal? TechPaid { get; set; }
        public decimal? CompanyPaid { get; set; }
        public string ReceiptBase64 { get; set; }
        public int ExpenseTableIndex { get; set; }
    }
}
