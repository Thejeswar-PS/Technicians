namespace Technicians.Api.Models
{
    public class EtechExpenseDto
    {
        public string ExpType { get; set; }
        public string Description { get; set; }
        public DateTime StrtDate { get; set; }  
        public DateTime StrtTime { get; set; }  
        public DateTime EndDate { get; set; }
        public DateTime EndTime { get; set; }    
        public decimal TechPaid { get; set; }
        public decimal CompanyPaid { get; set; }
        public decimal Mileage { get; set; }
        public int Hours { get; set; }
        public DateTime ChangeLast { get; set; }
        public string ChangeBy { get; set; }
        public int TableIndex { get; set; }
        public string Purpose { get; set; }
        public string CallNbr { get; set; }
        public string TravelBy { get; set; }
        public decimal FoodLimit { get; set; }
        public string Notes { get; set; }
    }
}
