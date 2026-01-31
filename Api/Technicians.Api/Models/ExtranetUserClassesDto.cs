using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Models
{
   
    public class ExtranetUserClassesDto
    {
        public string ClassID { get; set; } = string.Empty;
    }

    public class ExtranetUserInfoDto
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ClassID { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Address1 { get; set; } = string.Empty;
        public string Address2 { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Zip { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool ViewFinancial { get; set; } = false;
        public bool UnderContract { get; set; } = false;
    }

    public class ExtranetCustNumbersDto
    {
        public string CustNmbr { get; set; } = string.Empty;
    }

    public class ExtranetAddCustnmbrResult
    {
        public string ActionPerformed { get; set; } = string.Empty;
    }

    public class ExtranetSaveUpdateUserDto
    {
        public string Login { get; set; }
        public string Password { get; set; }
        public string ClassID { get; set; }
        public string CustomerName { get; set; }
        public string ContactName { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public bool ViewFinancial { get; set; }
        public bool UnderContract { get; set; }
    }

    public class ExtranetDeleteUser
    {
        public string Username { get; set; } = string.Empty;
    }

    public class ExtranetDeleteCustnmbr
    {
        
        public string Login { get; set; } = string.Empty;

        public string CustNmbr { get; set; } = string.Empty;
    }
}