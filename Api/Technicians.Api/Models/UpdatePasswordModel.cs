namespace Technicians.Api.Models
{
    public class UpdatePasswordModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string NewPassword { get; set; }
    }
}
