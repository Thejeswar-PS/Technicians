export interface ActivityDetailLog {
    jobID:       string | null;
    status:      string | null;
    comments:    string | null;
    contactName: string | null;
    subject:     string | null;
    message:     string | null;
    type:        number;
    changedOn:   Date;
    changedBY:   string | null;
}
