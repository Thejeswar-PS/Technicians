namespace Technicians.Api.Models
{
    public class SaveUpdateExpenseDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public int ExpType { get; set; }
        public int TravelType { get; set; }
        public DateTime StrtDate { get; set; }
        public DateTime StrtTime { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime EndTime { get; set; }
        public float Mileage { get; set; }
        public bool RentalCar { get; set; }
        public string Notes { get; set; }
        public int Purpose { get; set; }
        public decimal TechPaid { get; set; }
        public decimal CompanyPaid { get; set; }
        public string Changeby { get; set; }
        public int TableIndex { get; set; }
        public int TravelBy { get; set; }
        public int PayType { get; set; }
        public char Edit { get; set; }
        public int ImageExists { get; set; }
        public byte[]? ImageStream { get; set; }

    }
}
