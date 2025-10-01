export interface GetServiceReportsDetails {
  callNbr: string;
  custNmbr: string | null;
  name: string | null;
  email: string | null;
  owner: string | null;
  emailOwner: string | null;
  ownerPh: string | null;
  svcDescr: string | null;
  jobStatus: string | null;
  assetTag: string | null;
  serialNo: string | null;
  equipNo: string | null;
  path: string | null;
  archive: boolean | null;
  status: string | null;
  age: number | null;
}
