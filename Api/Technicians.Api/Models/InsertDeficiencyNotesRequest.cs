namespace Technicians.Api.Models
{
    public class InsertDeficiencyNotesRequest
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string Notes { get; set; }
        public string NoteType { get; set; }
    }

}
