export interface InventoryUser {
  invUserID: string;
  username: string;
  empID?: string;  // Optional for now - backend needs to add this field
}

export interface InventoryUserResponse {
  success: boolean;
  data: InventoryUser[];
  message?: string;
}