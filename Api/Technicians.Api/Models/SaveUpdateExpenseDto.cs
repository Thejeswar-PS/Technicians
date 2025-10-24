namespace Technicians.Api.Models
{
    public class SaveUpdateExpenseDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string ExpType { get; set; }
        public string TravelType { get; set; }

        public string StrtDate { get; set; }
        public string StrtTime { get; set; }
        public string EndDate { get; set; }
        public string EndTime { get; set; }

        public string Mileage { get; set; }
        public bool RentalCar { get; set; }
        public string Notes { get; set; }
        public string Purpose { get; set; }

        public double TechPaid { get; set; }
        public double CompanyPaid { get; set; }

        public string Changeby { get; set; }
        public string TravelBy { get; set; }
        public string PayType { get; set; }
        public string Edit { get; set; }

        public int TableIdx { get; set; }
        public int ImageExists { get; set; }
        public byte[]? ImageStream { get; set; }
    }


}
