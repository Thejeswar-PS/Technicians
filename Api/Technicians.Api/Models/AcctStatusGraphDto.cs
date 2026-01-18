namespace Technicians.Api.Models
{
    public class AcctStatusGraphDto
    {
        public int Completedcosting { get; set; }
        public int Invoicedyesterdate { get; set; }
        public int CompletedFScosting { get; set; }
        public int Invoicedtoday { get; set; }
        public int Invoicemonthtodate { get; set; }
        public int ContractInvoicemonthtodate { get; set; }
        public int Completedparts { get; set; }
        public int CompletedTechReview { get; set; }
        public int CompletedMngrReview { get; set; }
        public int MissingData { get; set; }
        public int LiebertJobsToInvoice { get; set; }
        public int NonFSJobstoInvoice { get; set; }
        public int FSJobstoInvoice { get; set; }
        public int WaitingForContract { get; set; }
        public int MISCPOS { get; set; }
        public int POS { get; set; }
    }

    public class AccMgmtGraphDto
    {
        public int PastUnscheduled { get; set; }
        public int UnscheduledNext90 { get; set; }
        public int Pending30 { get; set; }
        public int Scheduled30 { get; set; }
        public int Scheduled60 { get; set; }
        public int Scheduled7days { get; set; }
        public int Scheduled72hours { get; set; }
        public int Scheduledtoday { get; set; }
        public int Completednotreturned { get; set; }
        public int Completedreturned { get; set; }
        public int MissingData { get; set; }
        public int QuotesToComplete { get; set; }
        public int DownSites { get; set; }
        public int ProblemDownSites { get; set; }
    }

    public class AccountManagerPaperworkDto
    {
        public string Offid { get; set; } = string.Empty;
        public int Jobs { get; set; }
    }
}
