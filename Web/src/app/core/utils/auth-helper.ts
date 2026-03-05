/**
 * Auth Helper Utility
 * Provides helper functions for getting current user context for role-based filtering
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthHelper {
  /**
   * Gets current user's Windows ID from local storage
   */
  getCurrentWindowsID(): string | undefined {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) return undefined;
      
      const userData = JSON.parse(userDataStr);
      return userData?.windowsID || undefined;
    } catch (error) {
      console.error('Error getting current Windows ID:', error);
      return undefined;
    }
  }

  /**
   * Gets current user's Employee ID from local storage
   * Note: This may be the same as Windows ID in many cases
   */
  getCurrentEmpID(): string | undefined {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) return undefined;
      
      const userData = JSON.parse(userDataStr);
      // Check for empID, if not available use windowsID as fallback
      return userData?.empID || userData?.windowsID || undefined;
    } catch (error) {
      console.error('Error getting current Emp ID:', error);
      return undefined;
    }
  }

  /**
   * Gets user context for API calls (both empID and windowsID)
   */
  getUserContext(): { userEmpID?: string; windowsID?: string } {
    const windowsID = this.getCurrentWindowsID();
    const userEmpID = this.getCurrentEmpID();
    
    return { userEmpID, windowsID };
  }

  /**
   * Gets the current user's display name
   */
  getCurrentUserDisplayName(): string {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) return 'Unknown User';
      
      const userData = JSON.parse(userDataStr);
      return userData?.empName || userData?.empLabel || userData?.windowsID || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }
}
