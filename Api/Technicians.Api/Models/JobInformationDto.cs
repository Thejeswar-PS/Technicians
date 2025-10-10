namespace Technicians.Api.Models
{
    public class JobInformationDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string PmVisualNotes { get; set; }
        // public string SvcDescr { get; set; } // optional, since it's commented out
        public string QtePriority { get; set; }
        public bool ChkNotes { get; set; }
        public string LastModifiedBy { get; set; }
    }
}
