// Form-related type definitions

import type { ValidationRule } from './validation.js';

export interface FormField<T = any> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  placeholder?: string;
  label?: string;
  help?: string;
  validation?: ValidationRule<T>[];
}

export interface FormState<T = any> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  isTouched: boolean;
  submitCount: number;
}

export interface FormActions<T = any> {
  setValue: (name: keyof T, value: T[keyof T]) => void;
  setError: (name: keyof T, error: string) => void;
  setTouched: (name: keyof T, touched: boolean) => void;
  setDirty: (name: keyof T, dirty: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouchedFields: (touched: Partial<Record<keyof T, boolean>>) => void;
  setDirtyFields: (dirty: Partial<Record<keyof T, boolean>>) => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
}

export interface FormConfig {
  enableValidation: boolean;
  enableTouched: boolean;
  enableDirty: boolean;
  enableSubmit: boolean;
  enableReset: boolean;
  enableAutoSave: boolean;
  autoSaveDelay: number;
}

export interface FormResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
