import { CustomError } from './custom-error';

interface ValidationErrorField {
  field: string;
  message: string;
}

export class ValidationError extends CustomError {
  statusCode = 400;

  constructor(public errors: ValidationErrorField[]) {
    super('Validation failed');
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => ({
      message: err.message,
      field: err.field,
    }));
  }
}

