export interface BatteryContact {
    vendor?:        string | null;
    contactName?:   string | null;
    email?:         string | null;
    officePhone?:   string | null;
    otherPhone?:    string | null;
    baseOperation?: string | null;
    notes?:         string | null;
    type?:     string;
    modifiedBy?:     string;
}
