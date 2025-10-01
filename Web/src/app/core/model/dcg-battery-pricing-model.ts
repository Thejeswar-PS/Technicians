import { PricingProfile } from "./pricing-profile";

export interface DcgBatteryPrice {
    make:         string | null;
    model:        string | null;
    dcgPartNo:    string | null;
    ampHour:      string | null;
    wattsPerCell: string;
    cost:         string;
    terminal:     string | null;
    dimensions:   string | null;
    weight:       string;
    warranty:     string;
    vendor:       string | null;
    notes:        string | null;
    id:           number;
    priceGroup:   string | null;
    rowColor:     string | null;
}

export interface DcgBatteryPriceEdit {
    make:         string | null;
    model:        string | null;
    dcgPartNo:    string | null;
    ampHour:      string | null;
    wattsPerCell: string;
    cost:         string;
    terminal:     string | null;
    dimensions:   string | null;
    weight:       string;
    warranty:     string;
    vendor:       string | null;
    notes:        string | null;
    id:           number;
    priceGroup:   string | null;
    rowColor:     string | null;
}

export interface DcgBatteryPriceAdd {
  make:         string | null;
  model:        string | null;
  dcgPartNo:    string | null;
  ampHour:      string | null;
  wattsPerCell: string;
  cost:         string;
  terminal:     string | null;
  dimensions:   string | null;
  weight:       string;
  warranty:     string;
  vendor:       string | null;
  notes:        string | null;
  priceGroup:   string | null;

  pricingProfiles: PricingProfile[];
}


