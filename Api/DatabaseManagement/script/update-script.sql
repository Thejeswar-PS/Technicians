ALTER TABLE [DCG_Employees] ADD Password varchar(max) DEFAULT '';
Update [DCG_Employees] set Password = WindowsID

ALTER TABLE [DCG_Employees] ADD FirstTimeLogin bit DEFAULT 1;
Update [DCG_Employees] set FirstTimeLogin = 0