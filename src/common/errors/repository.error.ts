import { ERROR_CODE } from 'src/common/consts/messages.const';

export class SignalRepositoryError extends Error {
  constructor(
    public code: ERROR_CODE,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SignalRepositoryError';
  }
}

export class InvalidSignalDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSignalDataError';
  }
}

export class SignalNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignalNotFoundError';
  }
}

export class DatabaseOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseOperationError';
  }
}