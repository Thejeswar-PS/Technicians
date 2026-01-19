namespace Technicians.Api.Models
{
    public class PastDueContractResponse
    {
        public List<PastDueContractDto> Details { get; set; } = new();
        public List<PastDueAccountManagerSummaryDto> Summary { get; set; } = new();
    }


    public class PastDueAccountManagerSummaryDto
    {
        public string AccountManager { get; set; }
        public int ContractNo { get; set; }
    }


    public class PastDueContractDto
    {
        public string ContNbr { get; set; }
        public string CntType { get; set; }
        public DateTime InvoDate { get; set; }
        public decimal DocAmnt { get; set; }
        public string CustNmbr { get; set; }
        public string CustName { get; set; }
        public string CustClas { get; set; }
        public string OffName { get; set; }
        public DateTime MailingDate { get; set; }
    }


}
