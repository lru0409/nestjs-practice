import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Prisma } from '@/prisma/generated/client';
import { PrismaErrorCode } from '@/prisma/error-code.enum';

@Injectable()
export class PrismaExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
          return throwError(() => error as Error);
        }
        console.log('prisma error', error);
        switch (error.code as PrismaErrorCode) {
          case PrismaErrorCode.VALUE_TOO_LONG:
          case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED:
          case PrismaErrorCode.CONSTRAINT_FAILED:
          case PrismaErrorCode.INVALID_VALUE_PROVIDED:
          case PrismaErrorCode.DATA_VALIDATION_ERROR:
          case PrismaErrorCode.QUERY_PARSE_FAILED:
          case PrismaErrorCode.QUERY_VALIDATION_FAILED:
          case PrismaErrorCode.NULL_CONSTRAINT_VIOLATION:
          case PrismaErrorCode.MISSING_REQUIRED_VALUE:
          case PrismaErrorCode.MISSING_REQUIRED_ARGUMENT:
          case PrismaErrorCode.REQUIRED_RELATION_VIOLATION:
          case PrismaErrorCode.QUERY_INTERPRETATION_ERROR:
          case PrismaErrorCode.RECORDS_NOT_CONNECTED:
          case PrismaErrorCode.INPUT_ERROR:
          case PrismaErrorCode.VALUE_OUT_OF_RANGE:
          case PrismaErrorCode.FEATURE_NOT_SUPPORTED:
          case PrismaErrorCode.QUERY_PARAMETER_LIMIT_EXCEEDED:
          case PrismaErrorCode.FULLTEXT_INDEX_NOT_FOUND:
          case PrismaErrorCode.NUMBER_OUT_OF_RANGE_FOR_INT64:
            return throwError(() => new BadRequestException());

          case PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED:
            return throwError(() => new ConflictException());

          case PrismaErrorCode.INVALID_VALUE_STORED:
          case PrismaErrorCode.RAW_QUERY_FAILED:
          case PrismaErrorCode.TABLE_NOT_FOUND:
          case PrismaErrorCode.COLUMN_NOT_FOUND:
          case PrismaErrorCode.INCONSISTENT_COLUMN_DATA:
          case PrismaErrorCode.MULTIPLE_ERRORS_OCCURRED:
          case PrismaErrorCode.TRANSACTION_API_ERROR:
          case PrismaErrorCode.ASSERTION_VIOLATION:
          case PrismaErrorCode.EXTERNAL_CONNECTOR_ERROR:
            return throwError(() => new InternalServerErrorException());

          case PrismaErrorCode.RELATED_RECORD_NOT_FOUND:
          case PrismaErrorCode.REQUIRED_CONNECTED_RECORDS_NOT_FOUND:
          case PrismaErrorCode.RECORD_REQUIRED_BUT_NOT_FOUND:
            return throwError(() => new NotFoundException());

          case PrismaErrorCode.CONNECTION_POOL_TIMEOUT:
          case PrismaErrorCode.TRANSACTION_DEADLOCK:
          case PrismaErrorCode.TOO_MANY_DATABASE_CONNECTIONS:
            return throwError(() => new ServiceUnavailableException());

          default:
            return throwError(() => new InternalServerErrorException());
        }
      }),
    );
  }
}
