namespace Technicians.Api.Models
{
    /// <summary>
    /// Request DTO for GetOrderRequestStatus stored procedure
    /// </summary>
    public class OrderRequestStatusRequestDto
    {
        public string Status { get; set; } = "All";
        public string OrderType { get; set; } = "All";
        public bool Archive { get; set; } = false;
        public object Notes { get; internal set; }
    }

    /// <summary>
    /// Response DTO for GetOrderRequestStatus stored procedure results
    /// </summary>
    //public class OrderRequestStatusDto
    //{
    //    public string? OrderType { get; set; }
    //    public string? Requester { get; set; }
    //    public string? DCGPartNo { get; set; }
    //    public string? ManufPartNo { get; set; }
    //    public int? QtyNeeded { get; set; }
    //    public string? Vendor { get; set; }
    //    public string? PONumber { get; set; }
    //    public DateTime? OrderDate { get; set; }
    //    public DateTime? ArriveDate { get; set; }
    //    public string? Status { get; set; }
    //    public DateTime? CreatedOn { get; set; }
    //    public string? CreatedBy { get; set; }
    //    public string? ModifiedBy { get; set; }
    //    public DateTime? ModifiedOn { get; set; }
    //    public int RowIndex { get; set; }
    //}
}