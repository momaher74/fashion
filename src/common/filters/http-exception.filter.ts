import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Language } from '../enums/language.enum';
import { TranslationService } from '../services/translation.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private translationService: TranslationService;
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor() {
    this.translationService = new TranslationService();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Get language from header
    const languageHeader = request.headers['language'] || request.headers['x-language'] || request.headers['accept-language'];
    let language = Language.AR; // Default to Arabic
    if (languageHeader) {
      const lang = String(languageHeader).split(',')[0].split('-')[0].toLowerCase();
      if (lang === 'en' || lang === 'english') {
        language = Language.EN;
      }
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.getResponse() : 'error.internal_server';

    // Extract original error key/message
    let originalError: string;
    if (typeof message === 'string') {
      originalError = message;
    } else {
      const msg = (message as any).message || 'error.occurred';
      if (Array.isArray(msg)) {
        originalError = msg.join(', ');
      } else {
        originalError = msg;
      }
    }

    // Log full context with stack
    const reqContext = {
      method: request.method,
      path: (request as any).originalUrl || request.url,
      status,
      query: request.query,
      params: request.params,
      body: request.body,
      user: (request as any).user || null,
    };
    if (exception instanceof Error) {
      this.logger.error(originalError, exception.stack, reqContext as any);
    } else {
      // For non-Error exceptions, log the actual exception object/value
      const errorString = typeof exception === 'object' ? JSON.stringify(exception) : String(exception);
      this.logger.error(`${originalError} | Non-Error Exception: ${errorString}`, undefined, reqContext as any);
    }

    // Translate the error message
    let translatedMessage: string;
    if (typeof message === 'string') {
      translatedMessage = this.translationService.translateMessage(message, language);
    } else {
      const msg = (message as any).message || 'error.occurred';
      if (Array.isArray(msg)) {
        // Handle validation errors array
        translatedMessage = msg
          .map((m: string) => this.translationService.translateMessage(m, language))
          .join(', ');
      } else {
        translatedMessage = this.translationService.translateMessage(msg, language);
      }
    }

    const errorResponse: ApiResponse & {
      path?: string; method?: string; statusCode?: number; timestamp?: string; details?: any; stack?: string;
    } = {
      success: false,
      message: translatedMessage,
      error: originalError,
    };

    errorResponse.path = (request as any).originalUrl || request.url;
    errorResponse.method = request.method;
    errorResponse.statusCode = status;
    errorResponse.timestamp = new Date().toISOString();
    if (typeof message === 'object') { errorResponse.details = message; }
    if (process.env.NODE_ENV !== 'production' && (exception as any)?.stack) {
      errorResponse.stack = (exception as any).stack;
    }

    response.status(status).json(errorResponse);
  }
}

