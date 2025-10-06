export interface MobileReceipt {
  callNbr: string;
  codeDesc: string;
  techPaid?: number;
  companyPaid?: number;
  receiptBase64?: string;
  expenseTableIndex: number;
}