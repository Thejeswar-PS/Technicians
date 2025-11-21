using System;

namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for returning equipment image data from GET requests
    /// </summary>
    public class EquipmentImageDto
    {
        public int Img_ID { get; set; }
        public int EquipID { get; set; }
        public string EquipNo { get; set; }
        public string CallNbr { get; set; }
        public string TechID { get; set; }
        public string TechName { get; set; }
        public string Img_Title { get; set; }
        public string Img_Type { get; set; }
        public DateTime CreatedOn { get; set; } // This matches your database CreatedOn column
        public byte[] Img_stream { get; set; } // Raw bytes from database
    }
}