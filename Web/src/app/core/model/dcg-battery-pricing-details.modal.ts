export interface DCGBatteryPricingDetail {
    make:              string | null;
    model:             string | null;
    ampHour:           number;
    unitCost:          string | null;
    dimensions:        string | null;
    batteryMultiplier: number;
    laborHours:        number;
    laborReady:        string | null;
    frieghtEstimated:  string | null;
    quantity:          number;
    totalCost:         number;
    customerCost:      number;
    dcgPartNo:         string | null;
    weight:            number;
    rowColor:          string | null;
}
