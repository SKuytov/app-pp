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
    .nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  lead_time_weeks: z.number()
    .min(0, 'Lead time cannot be negative')
    .max(52, 'Lead time cannot exceed 52 weeks')
    .default(1),
  safety_stock: z.number()
    .min(0, 'Safety stock cannot be negative')
    .int('Safety stock must be a whole number')
    .default(0),
  weekly_usage: z.number()
    .min(0, 'Weekly usage cannot be negative')
    .default(0),
  monthly_usage: z.number()
    .min(0, 'Monthly usage cannot be negative')
    .default(0),
  image_url: z.string().url().optional().nullable(),
  cad_url: z.string().url().optional().nullable(),
  facility_id: z.string().uuid().optional().nullable()
}).refine(data => {
  if (data.max_stock && data.min_stock) {
    return data.max_stock >= data.min_stock;
  }
  return true;
}, {
  message: 'Maximum stock must be greater than or equal to minimum stock',
  path: ['max_stock']
});

// Machine validation schema
export const machineSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Machine name is required')
    .max(100, 'Machine name must be less than 100 characters')
    .trim(),
  model: z.string()
    .max(100, 'Model must be less than 100 characters')
    .optional()
    .nullable(),
  manufacturer: z.string()
    .max(100, 'Manufacturer must be less than 100 characters')
    .optional()
    .nullable(),
  serial_number: z.string()
    .max(100, 'Serial number must be less than 100 characters')
    .optional()
    .nullable(),
  installation_date: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable(),
  status: z.enum(['active', 'inactive', 'maintenance', 'broken']).default('active'),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .nullable(),
  facility_id: z.string().uuid('Please select a facility'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  specifications: z.string()
    .max(2000, 'Specifications must be less than 2000 characters')
    .optional()
    .nullable(),
  maintenance_schedule: z.string()
    .max(500, 'Maintenance schedule must be less than 500 characters')
    .optional()
    .nullable(),
  last_maintenance: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable(),
  next_maintenance: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable()
});

// Order validation schema
export const orderSchema = z.object({
  id: z.string().uuid().optional(),
  order_number: z.string()
    .min(1, 'Order number is required')
    .max(50, 'Order number must be less than 50 characters'),
  facility_id: z.string().uuid('Please select a facility'),
  requested_by_id: z.string().uuid(),
  requested_by_name: z.string()
    .min(1, 'Requester name is required')
    .max(100, 'Name must be less than 100 characters'),
  request_date: z.string().date('Please enter a valid date'),
  required_date: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled']).default('draft'),
  supplier_id: z.string().uuid().optional().nullable(),
  total_cost: z.number()
    .min(0, 'Total cost cannot be negative')
    .default(0),
  currency: z.enum(['BGN', 'USD', 'EUR']).default('BGN'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
  items: z.array(z.object({
    part_id: z.string().uuid(),
    part_name: z.string().min(1, 'Part name is required'),
    part_number: z.string().min(1, 'Part number is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1').int(),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    total_price: z.number().min(0, 'Total price cannot be negative')
  })).min(1, 'Order must contain at least one item')
});

// Supplier validation schema
export const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Supplier name is required')
    .max(100, 'Supplier name must be less than 100 characters')
    .trim(),
  contact_person: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .optional()
    .nullable(),
  email: emailPattern.optional().nullable(),
  phone: phonePattern.optional().nullable(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .nullable(),
  city: z.string()
    .max(50, 'City must be less than 50 characters')
    .optional()
    .nullable(),
  country: z.string()
    .max(50, 'Country must be less than 50 characters')
    .optional()
    .nullable(),
  postal_code: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .nullable(),
  website: urlPattern.optional().nullable(),
  tax_number: z.string()
    .max(50, 'Tax number must be less than 50 characters')
    .optional()
    .nullable(),
  payment_terms: z.string()
    .max(100, 'Payment terms must be less than 100 characters')
    .optional()
    .nullable(),
  delivery_time: z.number()
    .min(0, 'Delivery time cannot be negative')
    .max(365, 'Delivery time cannot exceed 365 days')
    .optional()
    .nullable(),
  rating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional()
    .nullable(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable()
});

// User/Profile validation schema
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: emailPattern,
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  role: z.enum(['ceo', 'admin', 'technical_director', 'head_technician', 'facility_tech', 'maintenance']),
  facility_id: z.string().uuid().optional().nullable(),
  phone: phonePattern.optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  department: z.string()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .nullable(),
  hire_date: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true)
});

// Facility validation schema
export const facilitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Facility name is required')
    .max(100, 'Facility name must be less than 100 characters')
    .trim(),
  manager_name: z.string()
    .min(1, 'Manager name is required')
    .max(100, 'Manager name must be less than 100 characters')
    .trim(),
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  phone: phonePattern.optional().nullable(),
  email: emailPattern.optional().nullable()
});

// Login validation schema
export const loginSchema = z.object({
  email: emailPattern,
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/dwg'];
      return allowedTypes.includes(file.type);
    }, 'File type not supported. Please upload JPEG, PNG, WebP, PDF, or DWG files')
});

// Search and filter validation
export const searchFiltersSchema = z.object({
  searchTerm: z.string().max(100, 'Search term too long').optional(),
  mainGroup: z.string().max(50, 'Main group filter too long').optional(),
  subGroup: z.string().max(50, 'Sub group filter too long').optional(),
  facility: z.string().uuid().optional().nullable(),
  status: z.string().max(20, 'Status filter too long').optional(),
  dateFrom: z.string().date().optional().nullable(),
  dateTo: z.string().date().optional().nullable()
});

// Quotation validation schema
export const quotationSchema = z.object({
  id: z.string().uuid().optional(),
  quotation_number: z.string()
    .min(1, 'Quotation number is required')
    .max(50, 'Quotation number must be less than 50 characters'),
  supplier_id: z.string().uuid('Please select a supplier'),
  order_id: z.string().uuid().optional().nullable(),
  quote_date: z.string().date('Please enter a valid date'),
  valid_until: z.string()
    .date('Please enter a valid date')
    .optional()
    .nullable(),
  total_amount: z.number()
    .min(0, 'Total amount cannot be negative'),
  currency: z.enum(['BGN', 'USD', 'EUR']).default('BGN'),
  status: z.enum(['draft', 'sent', 'received', 'accepted', 'rejected', 'expired']).default('draft'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
  items: z.array(z.object({
    part_id: z.string().uuid(),
    part_name: z.string().min(1, 'Part name is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1').int(),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    total_price: z.number().min(0, 'Total price cannot be negative')
  })).min(1, 'Quotation must contain at least one item')
});

// Part movement validation schema
export const partMovementSchema = z.object({
  id: z.string().uuid().optional(),
  part_id: z.string().uuid('Part is required'),
  user_id: z.string().uuid('User is required'),
  machine_id: z.string().uuid().optional().nullable(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .int('Quantity must be a whole number'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  reference_number: z.string()
    .max(50, 'Reference number must be less than 50 characters')
    .optional()
    .nullable()
});

// Export all schemas for easy import
export const validationSchemas = {
  part: partSchema,
  machine: machineSchema,
  order: orderSchema,
  supplier: supplierSchema,
  user: userSchema,
  facility: facilitySchema,
  login: loginSchema,
  passwordChange: passwordChangeSchema,
  fileUpload: fileUploadSchema,
  searchFilters: searchFiltersSchema,
  quotation: quotationSchema,
  partMovement: partMovementSchema
};

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

// Form validation hook
export const useFormValidation = (schema) => {
  const [errors, setErrors] = React.useState({});

  const validate = React.useCallback((data) => {
    const result = validateData(schema, data);
    setErrors(result.errors || {});
    return result.success;
  }, [schema]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const getFieldError = React.useCallback((fieldName) => {
    return errors[fieldName];
  }, [errors]);

  return {
    validate,
    errors,
    clearErrors,
    getFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};