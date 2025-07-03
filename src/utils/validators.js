import { VALIDATION } from './constants';

// Basic validation functions
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const isEmail = (email) => {
  if (!email) return false;
  return VALIDATION.EMAIL.PATTERN.test(email.trim());
};

export const isValidUsername = (username) => {
  if (!username) return false;
  const trimmed = username.trim();
  return (
    trimmed.length >= VALIDATION.USERNAME.MIN_LENGTH &&
    trimmed.length <= VALIDATION.USERNAME.MAX_LENGTH &&
    VALIDATION.USERNAME.PATTERN.test(trimmed)
  );
};

export const isValidPassword = (password) => {
  if (!password) return false;
  return (
    password.length >= VALIDATION.PASSWORD.MIN_LENGTH &&
    VALIDATION.PASSWORD.PATTERN.test(password)
  );
};

export const isNumeric = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const isPositiveNumber = (value) => {
  return isNumeric(value) && parseFloat(value) > 0;
};

export const isValidMeterAmount = (amount) => {
  if (!isNumeric(amount)) return false;
  const num = parseFloat(amount);
  return num > 0 && num <= 10000; // Max R10,000 top-up limit
};

export const isValidMeterId = (meterId) => {
  if (!meterId) return false;
  const trimmed = meterId.trim();
  // Meter ID should be 5-20 characters, alphanumeric with optional hyphens/underscores
  return /^[A-Za-z0-9_-]{5,20}$/.test(trimmed);
};

// Validation rule creators
export const required = (message = 'This field is required') => ({
  validate: isRequired,
  message
});

export const email = (message = 'Please enter a valid email address') => ({
  validate: isEmail,
  message
});

export const username = (message = 'Username must be 3-20 characters, letters, numbers, and underscores only') => ({
  validate: isValidUsername,
  message
});

export const password = (message = 'Password must be at least 8 characters with uppercase, lowercase, and numbers') => ({
  validate: isValidPassword,
  message
});

export const numeric = (message = 'Please enter a valid number') => ({
  validate: isNumeric,
  message
});

export const positiveNumber = (message = 'Please enter a positive number') => ({
  validate: isPositiveNumber,
  message
});

export const meterAmount = (message = 'Please enter a valid amount between R1 and R10,000') => ({
  validate: isValidMeterAmount,
  message
});

export const meterId = (message = 'Meter ID must be 5-20 characters, letters, numbers, hyphens, and underscores only') => ({
  validate: isValidMeterId,
  message
});

export const minLength = (min, message) => ({
  validate: (value) => value && value.length >= min,
  message: message || `Must be at least ${min} characters`
});

export const maxLength = (max, message) => ({
  validate: (value) => !value || value.length <= max,
  message: message || `Must be no more than ${max} characters`
});

export const range = (min, max, message) => ({
  validate: (value) => {
    if (!isNumeric(value)) return false;
    const num = parseFloat(value);
    return num >= min && num <= max;
  },
  message: message || `Must be between ${min} and ${max}`
});

// Form validation utility
export class FormValidator {
  constructor(rules = {}) {
    this.rules = rules;
  }

  // Validate a single field
  validateField(name, value) {
    const fieldRules = this.rules[name];
    if (!fieldRules) return { isValid: true, errors: [] };

    const errors = [];
    const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesToCheck) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate entire form
  validateForm(data) {
    const results = {};
    let isFormValid = true;

    for (const [fieldName, value] of Object.entries(data)) {
      const fieldResult = this.validateField(fieldName, value);
      results[fieldName] = fieldResult;
      
      if (!fieldResult.isValid) {
        isFormValid = false;
      }
    }

    // Check for fields that are required but missing from data
    for (const fieldName of Object.keys(this.rules)) {
      if (!(fieldName in data)) {
        const fieldResult = this.validateField(fieldName, '');
        results[fieldName] = fieldResult;
        
        if (!fieldResult.isValid) {
          isFormValid = false;
        }
      }
    }

    return {
      isValid: isFormValid,
      fields: results,
      errors: this.getErrorMessages(results)
    };
  }

  // Get all error messages as a flat array
  getErrorMessages(results) {
    const errors = [];
    for (const fieldResult of Object.values(results)) {
      errors.push(...fieldResult.errors);
    }
    return errors;
  }

  // Get first error for each field
  getFirstErrors(results) {
    const errors = {};
    for (const [fieldName, fieldResult] of Object.entries(results)) {
      if (!fieldResult.isValid && fieldResult.errors.length > 0) {
        errors[fieldName] = fieldResult.errors[0];
      }
    }
    return errors;
  }
}

// Pre-defined form validators
export const loginValidator = new FormValidator({
  username: [required(), username()],
  password: [required()]
});

export const registerValidator = new FormValidator({
  username: [required(), username()],
  password: [required(), password()],
  name: [required(), minLength(2)],
  email: email(), // Optional but must be valid if provided
  device_id: meterId() // Optional but must be valid if provided
});

export const topUpValidator = new FormValidator({
  device_id: [required(), meterId()],
  units: [required(), positiveNumber(), range(1, 10000)]
});

export const addMeterValidator = new FormValidator({
  device_id: [required(), meterId()],
  nickname: maxLength(50) // Optional but limited length
});

// Real-time validation hook for React components
export const useFormValidation = (validator, initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const result = validator.validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: result.isValid ? undefined : result.errors[0]
    }));
    return result.isValid;
  }, [validator]);

  const setValue = useCallback((name, value) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    // Validate if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  }, [touched, validateField]);

  const markTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, data[name]);
  }, [data, validateField]);

  const validateAll = useCallback(() => {
    const result = validator.validateForm(data);
    setErrors(validator.getFirstErrors(result.fields));
    return result.isValid;
  }, [validator, data]);

  const reset = useCallback((newData = {}) => {
    setData(newData);
    setErrors({});
    setTouched({});
  }, []);

  return {
    data,
    errors,
    touched,
    setValue,
    setTouched: markTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

export default {
  // Basic validators
  isRequired,
  isEmail,
  isValidUsername,
  isValidPassword,
  isNumeric,
  isPositiveNumber,
  isValidMeterAmount,
  isValidMeterId,

  // Rule creators
  required,
  email,
  username,
  password,
  numeric,
  positiveNumber,
  meterAmount,
  meterId,
  minLength,
  maxLength,
  range,

  // Form validators
  FormValidator,
  loginValidator,
  registerValidator,
  topUpValidator,
  addMeterValidator,

  // React hook
  useFormValidation
};