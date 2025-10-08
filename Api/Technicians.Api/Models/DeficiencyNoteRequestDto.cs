namespace Technicians.Api.Models
{
    public class DeficiencyNoteRequestDto
    {
        public string CallNbr { get; set; }
        public string TechName { get; set; }
        public string SystemNotes { get; set; }
        public string NotesType { get; set; }
    }
}
