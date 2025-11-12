// Validation-related type definitions

export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T, context?: any) => ValidationResult;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationConfig {
  rules: ValidationRule[];
  stopOnFirstError?: boolean;
  allowWarnings?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  isDirty: boolean;
  isTouched: boolean;
}
