namespace Technicians.Api.Models
{
    public class TechReturnPartsDto
    {
        public string UnUsedSentBack { get; set; }
        public string? FaultySentBack { get; set; }
        public string? ReturnStatus { get; set; }

        public string? LastModified { get; set; }

        public string? ReturnNotes { get; set; }


    }
}


