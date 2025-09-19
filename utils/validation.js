import { z } from 'zod';

// Base validation patterns
const emailPattern = z.string().email('Please enter a valid email address');
const phonePattern = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number');
const urlPattern = z.string().url('Please enter a valid URL');

// Part/Inventory validation schema
export const partSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Part name is required')
    .max(100, 'Part name must be less than 100 characters')
    .trim(),
  part_number: z.string()
    .min(1, 'Part number is required')
    .max(50, 'Part number must be less than 50 characters')
    .trim()
    .transform(val => val.toUpperCase()),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  quantity: z.number()
    .min(0, 'Quantity cannot be negative')
    .int('Quantity must be a whole number'),
  min_stock: z.number()
    .min(0, 'Minimum stock cannot be negative')
    .int('Minimum stock must be a whole number')
    .default(0),
  max_stock: z.number()
    .min(0, 'Maximum stock cannot be negative')
    .int('Maximum stock must be a whole number')
    .optional()
    .nullable(),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(999999.99, 'Price is too high'),
  currency: z.enum(['BGN', 'USD', 'EUR']).default('BGN'),
  main_group: z.string()
    .min(1, 'Main group is required')
    .max(50, 'Main group must be less than 50 characters'),
  sub_group: z.string()
    .max(50, 'Sub group must be less than 50 characters')
    .optional()
    .nullable(),
  criticality: z.enum(['A', 'B', 'C']).default('C'),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .nullable()
});

// Login validation schema
export const loginSchema = z.object({
  email: emailPattern,
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

// Generic validation function
export const validateData = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return { success: false, data: null, errors };
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } };
  }
};
