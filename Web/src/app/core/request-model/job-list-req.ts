export class JobListRequest {
  ownerId?: string | null;
  status?: string | null;
  year?: string | null;
  month?: string | null;
  type?: string | null;
  // type?: string | null;
  jobType?: number = 0;
}
