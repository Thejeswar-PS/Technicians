export interface ICustomerFeedback {
    satisfication: ISatisfication;
    stat:          IStat;
    score:         number;
}

export interface ISatisfication {
    extSatisfy:      number;
    verySatisfy:     number;
    someSatisfy:     number;
    notSoSatisfy:    number;
    notatAllSatisfy: number;
}

export interface IStat {
    totalResponded: number;
    totalSent:      number;
    totalViewed:    number;
}