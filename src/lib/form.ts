export enum QuestionType {
  SHORT_ANSWER = "SHORT_ANSWER",
  LONG_ANSWER = "LONG_ANSWER",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  MULTI_SELECT = "MULTI_SELECT",
  DROPDOWN = "DROPDOWN",
  FILE = "FILE",
}

export interface Question {
  id: string; // unique identifier (e.g., uuid)
  type: QuestionType;
  label: string; // The actual question asked
  description?: string; // Optional helper text
  required: boolean;
  options?: string[]; // Used for MULTIPLE_CHOICE, MULTI_SELECT, and DROPDOWN
  
  // Future proofing for your auto-save feature:
  // if mappedToProfile is true, this maps to a key in the User's Profile model
  mappedToProfileKey?: 'firstName' | 'lastName' | 'major' | 'resumeFileId' | null; 
}

// formPayloadJson will be stored as Record<string, any>
// where the key is the Question ID, and the value is the user's answer.