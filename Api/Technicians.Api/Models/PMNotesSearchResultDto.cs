namespace Technicians.Api.Models
{
    public class PMNotesSearchResultDto
    {
        public string CallNbr { get; set; }
        public string TechID { get; set; }
        public string CustNmbr { get; set; }
        public string CustName { get; set; }
        public string TechName { get; set; }
        public DateTime? StrtDate { get; set; }
        public int RankScore { get; set; }
        public string Snippet { get; set; }
    }

    public class PMNotesSearchResponse
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalMatches { get; set; }
        public int TotalPages { get; set; }
        public List<PMNotesSearchResultDto> Results { get; set; } = new();
    }

}
