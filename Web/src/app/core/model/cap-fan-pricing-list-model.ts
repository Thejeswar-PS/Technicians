export interface CapFanPrice {
    make:           string | null;
    model:          string | null;
    modelName:      string | null;
    kva:            string | null;
    serialNo:       string | null;
    inOutVolt:      string | null;
    sngParallel:    string | null;
    quoteHours:     number;
    notes:          string | null;
    rowIndex:       number;
    pricing:        string | null;
    freight:        string | null;
    modifiedOn:     Date;
    rowColor:       string | null;
    assemblyPartNo: string | null;
}