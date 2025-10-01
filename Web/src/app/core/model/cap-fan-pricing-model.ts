export interface CapFanPriceDetails {
    partName?:    string | null;
    dcgPartNo?:   string | null;
    oemPartNo?:   string | null;
    description?: string | null;
    assyPartNo?:  string | null;
    qtyasBuilt?:  number;
    qtyToOrder?:  number | undefined;
    dcgCost?:     number;
    salePrice?:   number | undefined;
    totalCost?:   number;
    totalSale?:   number;
    notes?:       string | null;
    createdBy?:   string | null;
    createdOn?:   Date | null;
    modifiedBy?:  null;
    modifiedOn?:  null;
    rowIndex?:    number;
}
