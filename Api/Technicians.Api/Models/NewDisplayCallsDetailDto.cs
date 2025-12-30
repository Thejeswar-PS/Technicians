namespace Technicians.Api.Models
{
    public class DisplayCallsDetailDTO
    {
        public string? JobNo { get; set; } // e.g., callnbr or Reference No
        public string? CustomerNo { get; set; } // e.g., custnmbr
        public string? CustomerName { get; set; } // e.g., custname
        public string? Status { get; set; } // e.g., JobStatus
        public string? AcctMngr { get; set; } // e.g., offid
        public DateTime? StartDt { get; set; } // e.g., etadte or scheduledstart
        public DateTime? EndDt { get; set; } // e.g., scheduledend
        public DateTime? ReturnedOn { get; set; } // e.g., returned
        public DateTime? InvoicedOn { get; set; } // e.g., invoicedate or DOCDATE
        public decimal? Amount { get; set; } // e.g., invoiceamount or DOCAMNT
        public string? TechName { get; set; } // e.g., TechName
        public string? JobType { get; set; } // e.g., srvtype
        public string? ContractNo { get; set; } // e.g., CONTNBR
        public string? Class { get; set; } // e.g., custclas
        public int? DueInDays { get; set; } // e.g., Due In(Days)
        public string    City { get; set; } // e.g., CITY
        public string State { get; set; } // e.g., STATE
        public string Description { get; set; } // e.g., from GetContractDescription
        public decimal? QuotedAmount { get; set; } // e.g., Quoted Amount
        public int? ChangeAge { get; set; } // e.g., datediff results
        public string Address { get; set; } // e.g., Address
        public string SalesPerson { get; set; } // e.g., SLPRSNID
        public string Type { get; set; } // e.g., CNTTYPE
        public DateTime? MailingDt { get; set; } // e.g., MailingDate
        public string PORDNMBR { get; set; } // e.g., PORDNMBR
        // Add more fields if needed for specific branches (e.g., Level for Down Sites)
    }

    public class DisplayCallsDetailResponse
    {
        public List<DisplayCallsDetailDTO> Details { get; set; } = new List<DisplayCallsDetailDTO>();
        public decimal? TotalAmount { get; set; } // For branches that return a total in a second SELECT
        // Add more aggregates if needed (e.g., for other multi-result branches)
    }

}





//namespace Technicians.Api.Models
//{
//    public class NewDisplayCallsDetailRequestDto
//    {
//        /// Detail page type (e.g., 'Contract Invoice Month to Date', 'Quotes to be completed this week', etc.)
//        public string PDetailPage { get; set; } = string.Empty;

//        /// Office ID parameter (optional, defaults to empty string)
//        public string POffID { get; set; } = string.Empty;
//    }
//    public class ContractInvoicesResponseDto
//        {
//            public bool Success { get; set; }
//            public string Message { get; set; }
//            public IEnumerable<object> Data { get; set; } // Replace 'object' with your actual invoice DTO type if available
//            public int TotalRecords { get; set; }
//        }

//    /// <summary>
//    /// ✅ FIX #4: Base response DTO with strongly typed Data property
//    /// </summary>
//    public class NewDisplayCallsDetailResponseDto
//    {
//        public bool Success { get; set; }
//        public string Message { get; set; } = string.Empty;
//        public string DetailPage { get; set; } = string.Empty;
//        public string OfficeId { get; set; } = string.Empty;
//        public object? Data { get; set; }
//        public object? TotalData { get; set; } // For total amounts/summary data
//    }

//    /// Contract invoice data
//    public class ContractInvoiceDto
//    {
//        public string ReferenceNo { get; set; } = string.Empty;
//        public DateTime InvoiceDate { get; set; }
//        public decimal InvoiceAmount { get; set; }
//    }
//    /// Job detail data (used for various job-related queries)
//    public class JobDetailDto
//    {
//        public string JobNo { get; set; } = string.Empty;
//        public string CustomerNo { get; set; } = string.Empty;
//        public string Status { get; set; } = string.Empty;
//        public string AcctMgr { get; set; } = string.Empty;
//        public string StartDt { get; set; } = string.Empty;
//        public string EndDt { get; set; } = string.Empty;
//        public string LastChanged { get; set; } = string.Empty;
//        public string ConfirmedOn { get; set; } = string.Empty;
//        public string FinalConfirmedBy { get; set; } = string.Empty;
//        public string City { get; set; } = string.Empty;
//        public string State { get; set; } = string.Empty;
//        public string ReturnedOn { get; set; } = string.Empty;
//        public string TechName { get; set; } = string.Empty;
//        public string Class { get; set; } = string.Empty;
//        public string CustomerName { get; set; } = string.Empty;
//        public string ContractNo { get; set; } = string.Empty;
//        public int DueInDays { get; set; }
//        public string LastModified { get; set; } = string.Empty;
//        public string JobType { get; set; } = string.Empty;
//        public decimal QuotedAmount { get; set; }
//        public int ChangeAge { get; set; }
//        public string Description { get; set; } = string.Empty;
//        public decimal Amount { get; set; }
//        public string InvoicedOn { get; set; } = string.Empty;
//        public decimal BilledAmount { get; set; }
//        public decimal JobCost { get; set; }
//        public decimal TotalAmount { get; set; }
//    }
//    /// Quote data
//    public class QuoteDetailDto
//    {
//        public string JobNo { get; set; } = string.Empty;
//        public string CustomerNo { get; set; } = string.Empty;
//        public string Status { get; set; } = string.Empty;
//        public string AccountMgr { get; set; } = string.Empty;
//        public string LastChanged { get; set; } = string.Empty;
//        public string StartDt { get; set; } = string.Empty;
//        public decimal QuotedAmount { get; set; }
//    }

//    /// Invoice data
//    public class InvoiceDetailDto
//    {
//        public string CustomerNo { get; set; } = string.Empty;
//        public string Name { get; set; } = string.Empty;
//        public string InvoiceNo { get; set; } = string.Empty;
//        public string InvoiceDt { get; set; } = string.Empty;
//        public decimal Amount { get; set; }
//        public string DueOn { get; set; } = string.Empty;
//        public string ReferenceNo { get; set; } = string.Empty;
//        public int ChangeAge { get; set; }
//    }

//    /// Unscheduled job detail
//    public class UnscheduledJobDetailDto
//    {
//        public string JobNo { get; set; } = string.Empty;
//        public string CustomerNo { get; set; } = string.Empty;
//        public string Status { get; set; } = string.Empty;
//        public string AcctMgr { get; set; } = string.Empty;
//        public string StartDt { get; set; } = string.Empty;
//        public string EndDt { get; set; } = string.Empty;
//        public string JobType { get; set; } = string.Empty;
//        public string ContractNo { get; set; } = string.Empty;
//        public string Description { get; set; } = string.Empty;
//        public decimal TotalAmount { get; set; }
//    }

//    /// Site status data (Down Sites, Problem Sites)
//    public class SiteStatusDto
//    {
//        public string JobNo { get; set; } = string.Empty;
//        public string CustomerNo { get; set; } = string.Empty;
//        public int Level { get; set; }
//        public string StartDt { get; set; } = string.Empty;
//        public string CustomerName { get; set; } = string.Empty;
//        public string City { get; set; } = string.Empty;
//        public string State { get; set; } = string.Empty;
//        public string TechName { get; set; } = string.Empty;
//        public string AcctMgr { get; set; } = string.Empty;
//        public string LastModified { get; set; } = string.Empty;
//        public int ChangeAge { get; set; }
//        public string Class { get; set; } = string.Empty;
//    }

//    /// Contract billing data
//    public class ContractBillingDto
//    {
//        public string CustomerNo { get; set; } = string.Empty;
//        public string CustomerName { get; set; } = string.Empty;
//        public string Address { get; set; } = string.Empty;
//        public string SalesPerson { get; set; } = string.Empty;
//        public string ContractNo { get; set; } = string.Empty;
//        public string Type { get; set; } = string.Empty;
//        public string InvoicedOn { get; set; } = string.Empty;
//        public decimal Amount { get; set; }
//        public string MailingDt { get; set; } = string.Empty;
//        public string PORDNMBR { get; set; } = string.Empty;
//    }

//    /// Parts tracking data
//    public class PartsTrackingDto
//    {
//        public string CallNbr { get; set; } = string.Empty;
//        public string CustNmbr { get; set; } = string.Empty;
//        public string CustName { get; set; } = string.Empty;
//        public string AccMgr { get; set; } = string.Empty;
//        public string TechName { get; set; } = string.Empty;
//        public DateTime JobDate { get; set; }
//        public string ServiceCallId { get; set; } = string.Empty;
//        public string PartNum { get; set; } = string.Empty;
//        public string Description { get; set; } = string.Empty;
//        public string Destination { get; set; } = string.Empty;
//        public DateTime ShipDate { get; set; }
//        public DateTime RequiredDate { get; set; }
//        public string City { get; set; } = string.Empty;
//        public string State { get; set; } = string.Empty;
//        public string Status { get; set; } = string.Empty;
//        public string ReqDate { get; set; } = string.Empty;
//    }

//    /// Call status summary data
//    public class CallStatusSummaryDto
//    {
//        public string CallNbr { get; set; } = string.Empty;
//        public string CustNmbr { get; set; } = string.Empty;
//        public string OffId { get; set; } = string.Empty;
//        public string JobStatus { get; set; } = string.Empty;
//        public DateTime ScheduledStart { get; set; }
//        public DateTime ScheduledEnd { get; set; }
//        public DateTime Returned { get; set; }
//        public DateTime InvoiceDate { get; set; }
//        public decimal InvoiceAmount { get; set; }
//        public string TechName { get; set; } = string.Empty;
//        public string JobType { get; set; } = string.Empty;
//        public decimal QuotedAmount { get; set; }
//        public string CustClass { get; set; } = string.Empty;
//        public string CustName { get; set; } = string.Empty;
//        public string ContNbr { get; set; } = string.Empty;
//        public int DueDays { get; set; }
//        public int ChangeAge { get; set; }
//        public string Description { get; set; } = string.Empty;
//    }

//    /// Total amount summary
//    public class TotalAmountDto
//    {
//        public decimal TotalAmount { get; set; }
//    }
//}