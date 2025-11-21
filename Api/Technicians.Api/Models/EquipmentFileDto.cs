namespace Technicians.Api.Models
{
    public class EquipmentFileDto
    {
        public int EquipID { get; set; }
        public string TechID { get; set; }
        public string Img_Title { get; set; }
        public string Img_Type { get; set; }
        public string CreatedBy { get; set; }
        public IFormFile ImgFile { get; set; }
    }

    public class EquipmentFileResponseDto
    {
        // Remove FileID since your table doesn't have it
        public int EquipID { get; set; }
        public string TechID { get; set; }
        public string FileName { get; set; }
        public string ContentType { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public byte[] Data { get; set; }
    }
}