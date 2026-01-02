using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for NewDisplayCallsDetail stored procedure
    /// </summary>
    public class NewDisplayCallsDetailRequestDto
    {
        /// <summary>
        /// Detail page type (e.g., 'Contract Invoice Month to Date', 'Quotes to be completed this week', etc.)
        /// </summary>
        [Required]
        [StringLength(50)]
        [JsonPropertyName("pDetailPage")]
        public string PDetailPage { get; set; } = string.Empty;

        /// <summary>
        /// Office ID parameter (optional, defaults to empty string)
        /// </summary>
        [StringLength(50)]
        [JsonPropertyName("pOffID")]
        public string POffID { get; set; } = string.Empty;
    }

    /// <summary>
    /// Generic display calls detail DTO that can handle most report types
    /// </summary>
    public class DisplayCallsDetailDto
    {
        [JsonPropertyName("jobNo")]
        public string? JobNo { get; set; }

        [JsonPropertyName("customerNo")]
        public string? CustomerNo { get; set; }

        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("acctMngr")]
        public string? AcctMngr { get; set; }

        [JsonPropertyName("startDt")]
        public DateTime? StartDt { get; set; }

        [JsonPropertyName("endDt")]
        public DateTime? EndDt { get; set; }

        [JsonPropertyName("returnedOn")]
        public DateTime? ReturnedOn { get; set; }

        [JsonPropertyName("invoicedOn")]
        public DateTime? InvoicedOn { get; set; }

        [JsonPropertyName("amount")]
        public decimal? Amount { get; set; }

        [JsonPropertyName("techName")]
        public string? TechName { get; set; }

        [JsonPropertyName("jobType")]
        public string? JobType { get; set; }

        [JsonPropertyName("contractNo")]
        public string? ContractNo { get; set; }

        [JsonPropertyName("class")]
        public string? Class { get; set; }

        [JsonPropertyName("dueInDays")]
        public int? DueInDays { get; set; }

        [JsonPropertyName("city")]
        public string? City { get; set; }

        [JsonPropertyName("state")]
        public string? State { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("quotedAmount")]
        public decimal? QuotedAmount { get; set; }

        [JsonPropertyName("changeAge")]
        public int? ChangeAge { get; set; }

        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("salesPerson")]
        public string? SalesPerson { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("mailingDt")]
        public DateTime? MailingDt { get; set; }

        [JsonPropertyName("pordnmbr")]
        public string? PORDNMBR { get; set; }

        [JsonPropertyName("lastChanged")]
        public string? LastChanged { get; set; }

        [JsonPropertyName("lastModified")]
        public DateTime? LastModified { get; set; }

        [JsonPropertyName("confirmedOn")]
        public DateTime? ConfirmedOn { get; set; }

        [JsonPropertyName("finalConfirmedBy")]
        public string? FinalConfirmedBy { get; set; }

        [JsonPropertyName("level")]
        public int? Level { get; set; }

        [JsonPropertyName("invoiceNo")]
        public string? InvoiceNo { get; set; }

        [JsonPropertyName("invoiceDt")]
        public DateTime? InvoiceDt { get; set; }

        [JsonPropertyName("dueOn")]
        public DateTime? DueOn { get; set; }

        [JsonPropertyName("referenceNo")]
        public string? ReferenceNo { get; set; }
    }

    /// <summary>
    /// Contract Invoice DTO for monthly reporting
    /// </summary>
    public class ContractInvoiceDto
    {
        [JsonPropertyName("referenceNo")]
        public string ReferenceNo { get; set; } = string.Empty;

        [JsonPropertyName("invoiceDate")]
        public DateTime InvoiceDate { get; set; }

        [JsonPropertyName("invoiceAmount")]
        public decimal InvoiceAmount { get; set; }

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }
    }

    /// <summary>
    /// Quote DTO for quote management reports
    /// </summary>
    public class QuoteDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("lastChanged")]
        public string LastChanged { get; set; } = string.Empty;

        [JsonPropertyName("dueInDays")]
        public int DueInDays { get; set; }

        [JsonPropertyName("class")]
        public string Class { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;
    }

    /// <summary>
    /// Job Processing DTO for job workflow tracking
    /// </summary>
    public class JobProcessingDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("endDt")]
        public DateTime EndDt { get; set; }

        [JsonPropertyName("confirmedOn")]
        public DateTime? ConfirmedOn { get; set; }

        [JsonPropertyName("finalConfirmedBy")]
        public string FinalConfirmedBy { get; set; } = string.Empty;

        [JsonPropertyName("finalConfirmedByUserName")]
        public string? FinalConfirmedByUserName { get; set; }

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("returnedOn")]
        public DateTime? ReturnedOn { get; set; }

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("class")]
        public string Class { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("contractNo")]
        public string ContractNo { get; set; } = string.Empty;
    }

    /// <summary>
    /// Job Scheduling DTO for scheduling operations
    /// </summary>
    public class JobSchedulingDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("endDt")]
        public DateTime EndDt { get; set; }

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("class")]
        public string Class { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("contractNo")]
        public string ContractNo { get; set; } = string.Empty;
    }

    /// <summary>
    /// Quote Management DTO for quote lifecycle tracking
    /// </summary>
    public class QuoteManagementDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("accountMgr")]
        public string AccountMgr { get; set; } = string.Empty;

        [JsonPropertyName("lastChanged")]
        public DateTime LastChanged { get; set; }

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("quotedAmount")]
        public decimal QuotedAmount { get; set; }
    }

    /// <summary>
    /// Invoice DTO for accounts receivable tracking
    /// </summary>
    public class InvoiceDto
    {
        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("invoiceNo")]
        public string InvoiceNo { get; set; } = string.Empty;

        [JsonPropertyName("invoiceDt")]
        public DateTime InvoiceDt { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("dueOn")]
        public DateTime DueOn { get; set; }

        [JsonPropertyName("referenceNo")]
        public string ReferenceNo { get; set; } = string.Empty;

        [JsonPropertyName("changeAge")]
        public int ChangeAge { get; set; }
    }

    /// <summary>
    /// Contract Billing DTO for contract billing schedules
    /// </summary>
    public class ContractBillingDto
    {
        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("salesPerson")]
        public string SalesPerson { get; set; } = string.Empty;

        [JsonPropertyName("contractNo")]
        public string ContractNo { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("invoicedOn")]
        public DateTime InvoicedOn { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("mailingDt")]
        public DateTime? MailingDt { get; set; }

        [JsonPropertyName("pordnmbr")]
        public string PORDNMBR { get; set; } = string.Empty;

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }
    }

    /// <summary>
    /// Job Status Detail DTO for detailed job tracking
    /// </summary>
    public class JobStatusDetailDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("endDt")]
        public DateTime EndDt { get; set; }

        [JsonPropertyName("jobType")]
        public string JobType { get; set; } = string.Empty;

        [JsonPropertyName("contractNo")]
        public string ContractNo { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }
    }

    /// <summary>
    /// Parts Tracking DTO for parts shipment tracking
    /// </summary>
    public class PartsTrackingDto
    {
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; } = string.Empty;

        [JsonPropertyName("custNmbr")]
        public string CustNmbr { get; set; } = string.Empty;

        [JsonPropertyName("custName")]
        public string CustName { get; set; } = string.Empty;

        [JsonPropertyName("offId")]
        public string OffId { get; set; } = string.Empty;

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("jobDate")]
        public DateTime JobDate { get; set; }
    }

    /// <summary>
    /// Parts Request DTO for parts requisition tracking
    /// </summary>
    public class PartsRequestDto
    {
        [JsonPropertyName("serviceCallId")]
        public string ServiceCallId { get; set; } = string.Empty;

        [JsonPropertyName("partNum")]
        public string PartNum { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [JsonPropertyName("shipDate")]
        public DateTime? ShipDate { get; set; }

        [JsonPropertyName("custName")]
        public string CustName { get; set; } = string.Empty;

        [JsonPropertyName("custNumber")]
        public string CustNumber { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("reqDate")]
        public DateTime? ReqDate { get; set; }

        [JsonPropertyName("shippedFrom")]
        public string? ShippedFrom { get; set; }

        [JsonPropertyName("partStatus")]
        public string? PartStatus { get; set; }
    }

    /// <summary>
    /// Site Status DTO for site condition tracking
    /// </summary>
    public class SiteStatusDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public int Level { get; set; }

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("lastModified")]
        public DateTime? LastModified { get; set; }

        [JsonPropertyName("changeAge")]
        public int ChangeAge { get; set; }

        [JsonPropertyName("class")]
        public string Class { get; set; } = string.Empty;
    }

    /// <summary>
    /// Job Performance DTO for comprehensive job performance tracking
    /// </summary>
    public class JobPerformanceDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime? StartDt { get; set; }

        [JsonPropertyName("endDt")]
        public DateTime? EndDt { get; set; }

        [JsonPropertyName("returnedOn")]
        public DateTime? ReturnedOn { get; set; }

        [JsonPropertyName("invoicedOn")]
        public DateTime? InvoicedOn { get; set; }

        [JsonPropertyName("amount")]
        public decimal? Amount { get; set; }

        [JsonPropertyName("billedAmount")]
        public decimal? BilledAmount { get; set; }

        [JsonPropertyName("jobCost")]
        public decimal? JobCost { get; set; }

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("jobType")]
        public string JobType { get; set; } = string.Empty;

        [JsonPropertyName("classId")]
        public string ClassId { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("contractNo")]
        public string ContractNo { get; set; } = string.Empty;

        [JsonPropertyName("changeAge")]
        public int? ChangeAge { get; set; }

        [JsonPropertyName("dueInDays")]
        public int? DueInDays { get; set; }

        [JsonPropertyName("dueDays")]
        public int? DueDays { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("invoiceTotal")]
        public decimal? InvoiceTotal { get; set; }

        [JsonPropertyName("quotedAmount")]
        public decimal? QuotedAmount { get; set; }

        [JsonPropertyName("lastPM")]
        public string? LastPM { get; set; }

        [JsonPropertyName("city")]
        public string? City { get; set; }

        [JsonPropertyName("state")]
        public string? State { get; set; }

        [JsonPropertyName("invoiceDueDate")]
        public string? InvoiceDueDate { get; set; }

        [JsonPropertyName("mailDate")]
        public string? MailDate { get; set; }

        [JsonPropertyName("invoiceAmount")]
        public decimal? InvoiceAmount { get; set; }

        [JsonPropertyName("contractType")]
        public string? ContractType { get; set; }
    }

    /// <summary>
    /// Complete Quote DTO for comprehensive quote tracking
    /// </summary>
    public class CompleteQuoteDto
    {
        [JsonPropertyName("jobNo")]
        public string JobNo { get; set; } = string.Empty;

        [JsonPropertyName("customerNo")]
        public string CustomerNo { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("acctMgr")]
        public string AcctMgr { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public DateTime StartDt { get; set; }

        [JsonPropertyName("lastChanged")]
        public string LastChanged { get; set; } = string.Empty;

        [JsonPropertyName("lastModified")]
        public DateTime? LastModified { get; set; }

        [JsonPropertyName("dueInDays")]
        public int DueInDays { get; set; }

        [JsonPropertyName("class")]
        public string Class { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("confirmedOn")]
        public DateTime? ConfirmedOn { get; set; }

        [JsonPropertyName("finalConfirmedBy")]
        public string? FinalConfirmedBy { get; set; }

        [JsonPropertyName("finalConfirmedByUserName")]
        public string? FinalConfirmedByUserName { get; set; }

        [JsonPropertyName("techName")]
        public string? TechName { get; set; }
    }

    /// <summary>
    /// Generic Response DTO with strongly typed Data property
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class ReportResponseDto<T>
    {
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new List<T>();

        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; set; }

        [JsonPropertyName("reportType")]
        public string ReportType { get; set; } = string.Empty;

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("hasMultipleResultSets")]
        public bool HasMultipleResultSets { get; set; }

        [JsonPropertyName("additionalData")]
        public Dictionary<string, object>? AdditionalData { get; set; }

        [JsonPropertyName("totalRecords")]
        public int TotalRecords => Data?.Count ?? 0;

        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Enhanced response DTO for handling multiple result sets and complex responses
    /// </summary>
    public class EnhancedReportResponseDto<T>
    {
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new List<T>();

        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; set; }

        [JsonPropertyName("reportType")]
        public string ReportType { get; set; } = string.Empty;

        [JsonPropertyName("detailPage")]
        public string DetailPage { get; set; } = string.Empty;

        [JsonPropertyName("officeId")]
        public string OfficeId { get; set; } = string.Empty;

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("hasMultipleResultSets")]
        public bool HasMultipleResultSets { get; set; }

        [JsonPropertyName("additionalData")]
        public Dictionary<string, object>? AdditionalData { get; set; }

        [JsonPropertyName("summaryData")]
        public object? SummaryData { get; set; }

        [JsonPropertyName("totalRecords")]
        public int TotalRecords => Data?.Count ?? 0;

        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("errors")]
        public List<string>? Errors { get; set; }
    }

    /// <summary>
    /// Base response DTO for legacy compatibility
    /// </summary>
    public class DisplayCallsDetailResponse
    {
        [JsonPropertyName("details")]
        public List<DisplayCallsDetailDto> Details { get; set; } = new List<DisplayCallsDetailDto>();

        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("reportType")]
        public string ReportType { get; set; } = string.Empty;

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Legacy response DTO for backward compatibility
    /// </summary>
    public class NewDisplayCallsDetailResponseDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("detailPage")]
        public string DetailPage { get; set; } = string.Empty;

        [JsonPropertyName("officeId")]
        public string OfficeId { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public object? Data { get; set; }

        [JsonPropertyName("totalData")]
        public object? TotalData { get; set; }

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Contract invoices response DTO for specific contract reporting
    /// </summary>
    public class ContractInvoicesResponseDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public IEnumerable<object> Data { get; set; } = new List<object>();

        [JsonPropertyName("totalRecords")]
        public int TotalRecords { get; set; }

        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; set; }

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Manager Review DTO for specific manager review tracking
    /// </summary>
    public class ManagerReviewDto
    {
        [JsonPropertyName("callNbr")]
        public string CallNbr { get; set; } = string.Empty;

        [JsonPropertyName("custnmbr")]
        public string CustNmbr { get; set; } = string.Empty;

        [JsonPropertyName("offid")]
        public string OffId { get; set; } = string.Empty;

        [JsonPropertyName("jobstatus")]
        public string JobStatus { get; set; } = string.Empty;

        [JsonPropertyName("startDt")]
        public string StartDt { get; set; } = string.Empty;

        [JsonPropertyName("endDt")]
        public string EndDt { get; set; } = string.Empty;

        [JsonPropertyName("returnedOn")]
        public string ReturnedOn { get; set; } = string.Empty;

        [JsonPropertyName("invoiceDate")]
        public DateTime? InvoiceDate { get; set; }

        [JsonPropertyName("invoiceAmount")]
        public decimal InvoiceAmount { get; set; }

        [JsonPropertyName("costingTotal")]
        public decimal CostingTotal { get; set; }

        [JsonPropertyName("techName")]
        public string TechName { get; set; } = string.Empty;

        [JsonPropertyName("jobType")]
        public string JobType { get; set; } = string.Empty;

        [JsonPropertyName("quotedAmount")]
        public decimal QuotedAmount { get; set; }

        [JsonPropertyName("custclas")]
        public string CustClas { get; set; } = string.Empty;

        [JsonPropertyName("custname")]
        public string CustName { get; set; } = string.Empty;

        [JsonPropertyName("contnbr")]
        public string ContNbr { get; set; } = string.Empty;

        [JsonPropertyName("contractType")]
        public string? ContractType { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("verified")]
        public string Verified { get; set; } = string.Empty;

        [JsonPropertyName("lastModifiedOn")]
        public DateTime LastModifiedOn { get; set; }
    }
}