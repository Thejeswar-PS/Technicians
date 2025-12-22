export interface CalendarJobDetails {
    description: string;
    status: string;
    startDate:    Date;
    startTime:   Date;
    endDate:     Date;
    endTime:     Date;
    address1:    string;
    siteContact: string;
    sitePhone:   string;
    offname:     string;
    custName:    string;
    jobNotes:    string;
    backColor:   string;
    foreColor:   string;
    callNbr:     string;
    techName:    string;
}

export interface CalendarStatistics {
    overDue: number;
    tomorrow: number;
    due3: number;
    due5: number;
    due10: number;
}

export interface CalendarResponse {
    jobDetails: CalendarJobDetails[];
    statistics: CalendarStatistics;
}
