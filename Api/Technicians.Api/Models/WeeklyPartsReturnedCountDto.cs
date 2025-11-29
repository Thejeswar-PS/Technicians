namespace Technicians.Api.Models
{
    /// <summary>
    /// DTO for weekly parts returned count data from GetWeeklyPartsReturnedCount stored procedure
    /// </summary>
    public class WeeklyPartsReturnedCountDto
    {
        /// <summary>
        /// Week end date formatted as MM/DD
        /// </summary>
        public string WkEnd { get; set; } = string.Empty;

        /// <summary>
        /// Number of unused parts returned
        /// </summary>
        public int UnUsed { get; set; }

        /// <summary>
        /// Number of faulty parts returned
        /// </summary>
        public int Faulty { get; set; }

        /// <summary>
        /// Week number of the year
        /// </summary>
        public int WeekNo { get; set; }
    }
}