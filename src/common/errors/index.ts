import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
  PayloadTooLargeException,
  ForbiddenException,
} from '@nestjs/common';
import { ERROR_CODE } from 'src/common/consts/messages.const';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

export class HttpPaymentRequiredException extends HttpException {
  constructor(message?: string, name?: string) {
    super(message, 402);
    this.name = name || this.name;
  }
}

export class HttpBadRequestException extends BadRequestException {
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || this.name;
  }
}

export class HttpUnauthorizedException extends UnauthorizedException {
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || this.name;
  }
}

export class HttpNotFoundException extends NotFoundException {
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || this.name;
  }
}

export class HttpConflictException extends ConflictException {
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || this.name;
  }
}

export class Exception extends Error {
  constructor(message: string, name?: string) {
    super(message);
    if (name) this.name = name;
  }
}

export class HttpUnprocessableEntityException extends UnprocessableEntityException {
  constructor(message: string, name?: string) {
    super(message);
    if (name) this.name = name;
  }
}

export class HttpPayloadTooLargeException extends PayloadTooLargeException {
  constructor(message: string, name?: string) {
    super(message);
    if (name) this.name = name;
  }
}

export class HttpInternalException extends InternalServerErrorException {
  constructor(message: string, name?: string) {
    super(message);
    this.name = name || ERROR_CODE.INTERNAL_SERVER_ERROR;
  }
}

export class HttpInvalidMethodException extends HttpBadRequestException {
  constructor(message?: string, name?: string) {
    super(message, "Invalid method exception");
    this.name = name || this.name;
  }
}

export class HttpForbiddenException extends ForbiddenException {
  constructor(message?: string, name?: string) {
    super(message);
    this.name = name || this.name;
  }
}
