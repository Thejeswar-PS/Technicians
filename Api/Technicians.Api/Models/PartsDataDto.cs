namespace Technicians.Api.Models
{
    public class PartsDataDto
    {
        public string Service_Call_ID { get; set; }
        public string CustNmbr { get; set; }
        public string Adrscode { get; set; }
        public string ContactName { get; set; }
        public string ContactPh { get; set; }
        public string VerifyPh { get; set; }
        public string Technician { get; set; }
        public DateTime? Job_date { get; set; }
        public string Location_Name { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public string Requested_By { get; set; }
        public int? Submitted { get; set; }
        public string Status { get; set; }
        public string Processed_By { get; set; }
        public string Note { get; set; }
        public string Req_Note { get; set; }
        public DateTime? RequestedDate { get; set; }
        public DateTime? SubmittedDate { get; set; }
        public string InvUserID { get; set; }
        public string TechID { get; set; }
        public DateTime? FirstSubmitted { get; set; } // From the output
    }
}
