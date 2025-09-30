

/****** Object:  StoredProcedure [dbo].[sp_Get_Makelist]    Script Date: 12/16/2023 6:17:48 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Dileep Kalijavadu
-- Create date: 7/10/2017
-- Description:	Load make
-- =============================================
--[sp_Get_Makelist] null,null,null,null
Create OR ALTER PROCEDURE [dbo].[UpdatePassword] --'CLE (Haze)','HZB12-33 UL-94V0',null,'3'
   @Username nvarchar(250),
   @Password nvarchar(250),
   @NewPassword nvarchar(250)
AS
BEGIN
	
	
    IF EXISTS(SELECT * FROM [dbo].[DCG_Employees] em
	WHERE em.WindowsID = @Username AND em.Password = @Password)
	BEGIN
		UPDATE DCG_Employees Set Password = @NewPassword
		select 1
	END
	select 0
END

