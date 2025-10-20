using Microsoft.AspNetCore.Http;

namespace Technicians.Api.Models
{
    public class EquipmentImageUploadDto
    {
        public string CallNbr { get; set; }
        public int EquipID { get; set; }
        public string EquipNo { get; set; }
        public string TechName { get; set; }
        public string TechID { get; set; }
        public string Img_Title { get; set; }
        public string Img_Type { get; set; }

        // Bound from multipart/form-data
        public IFormFile ImgFile { get; set; }
    }
}