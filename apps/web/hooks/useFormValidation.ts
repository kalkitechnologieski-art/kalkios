'use client';

import { useForm, UseFormReturn, FieldValues, Path, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback } from 'react';

// Common validation schemas
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .regex(/^[0-9+\-\s()]{7,15}$/, 'Invalid phone number format');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

export const urlSchema = z.string()
  .url('Invalid URL')
  .or(z.literal(''));

// Password strength calculator
export function calculatePasswordStrength(password: string): {
  score: number; // 0-4
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  requirements: Array<{ met: boolean; label: string }>;
} {
  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const score = Math.min(4, metCount - 1); // 0-4 scale

  let level: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 1) level = 'weak';
  else if (score === 2) level = 'medium';
  else if (score === 3) level = 'strong';
  else level = 'very-strong';

  return { score, level, requirements };
}

// Generic form hook with Zod validation
export function useZodForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
): UseFormReturn<T> & {
  isSubmitting: boolean;
  submitError: string | null;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first error
  });

  const originalSubmit = form.handleSubmit;

  // Wrap handleSubmit to track submitting state
  const handleSubmit = useCallback(
    (onValid: (data: T) => Promise<void> | void, onInvalid?: (errors: any) => void) => {
      return originalSubmit(async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          await onValid(data);
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Submission failed';
          setSubmitError(error);
          throw err;
        } finally {
          setIsSubmitting(false);
        }
      }, onInvalid);
    },
    [originalSubmit]
  );

  return {
    ...form,
    handleSubmit: handleSubmit as typeof form.handleSubmit,
    isSubmitting,
    submitError,
  };
}

// Pre-built form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  fullName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  company: z.string().max(100).optional(),
});

export const checkoutSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});

export const leadSearchSchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters'),
  targetCount: z.number().min(1).max(100),
});

// Form field component props type
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}
