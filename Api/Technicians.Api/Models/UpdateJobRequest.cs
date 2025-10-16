namespace Technicians.Api.Models
{
    public class UpdateJobRequest
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string Pmvisualnotes { get; set; }
        public string SvcDescr { get; set; }
        public string QtePriority { get; set; }
        public bool ChkNotes { get; set; }
        public string LastModifiedBy { get; set; } // Typically derived from token or session
    }

}
