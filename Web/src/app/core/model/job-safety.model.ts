// Job Safety models based on DTechJobSafety.aspx.cs

/**
 * Pre-Job Safety Checklist data model
 * Corresponds to PreJobSafety class in legacy code
 */
export interface PreJobSafety {
  callNbr: string;
  respReviewed: string;           // Question 1: Safety responsibilities reviewed
  wpRequired: string;             // Question 2: Work Permit required
  slipTripFail: string;           // Question 3: Slip/Trip/Fall hazard
  noiseHazard: string;            // Question 4: Excessive noise hazard
  eyeInjury: string;              // Question 5: Eye injury hazard
  dustMistFume: string;           // Question 6: Dust/Mist/Fume/Vapor hazard
  tempHazard: string;             // Question 7: Temperature Stress hazard
  fireHazard: string;             // Question 8: Fire hazard present
  fireExtHazard: string;          // Question 9: Fire extinguisher location
  electricHazard: string;         // Question 10: Electrical shock hazard
  workingOverhead: string;        // Question 11: Others working overhead
  trafficHazard: string;          // Question 12: Traffic or moving vehicle
  dcgIsolated: string;            // Question 13: DCG work area isolated
  barricadeReqd: string;          // Question 14: Barricade or warning signs
  lockoutReqd: string;            // Question 15: Lock-Out/Tag-Out required
  lockProcReqd: string;           // Question 15a: Customer's lockout procedure
  chemicalHazard: string;         // Question 16: Chemical hazard present
  chemIdentified: string;         // Question 16a: Chemical Identified
  msdsReviewed: string;           // Question 16b: MSDS Reviewed
  healthHazard: string;           // Question 16c: Health Hazard
  safetyShower: string;           // Question 16d: Safety Shower/Eye wash
  hazardousWaste: string;         // Question 16e: Hazardous wastes generated
  spaceRequired: string;          // Question 17: Confined Space entry
  spaceProcReqd: string;          // Question 17a: Customer's space procedure
  custJobProcedure: string;       // Question 18: Customer require job procedure
  safetyProcRevewed: string;      // Question 18a: Safety procedures reviewed
  specialEquipReqd: string;       // Question 18b: Special equipment required
  toolsInspected: string;         // Question 18c: Tools inspected
  apprLockouts: string;           // Question 18d: Appropriate lockouts
  protEquipReqd: string;          // Question 19: Personal protective equipment
  otherContractors: string;       // Question 20: Other contractors in area
  anyOtherHazards: string;        // Question 21: Any other hazards
  comments: string;               // Additional Comments
}

/**
 * Dropdown option values used throughout the form
 */
export const SAFETY_DROPDOWN_OPTIONS = [
  { value: 'S', label: 'Select' },
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
  { value: 'A', label: 'N/A' }
];

/**
 * Questions that trigger conditional sections
 */
export const CONDITIONAL_QUESTIONS = {
  LOCKOUT: 'lockoutReqd',           // Shows lockout procedure question
  CHEMICAL: 'chemicalHazard',       // Shows chemical hazard sub-questions
  CONFINED_SPACE: 'spaceRequired',  // Shows confined space procedure
  CUSTOMER_PROC: 'custJobProcedure' // Shows customer procedure sub-questions
};
