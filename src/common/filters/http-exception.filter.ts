import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Language } from '../enums/language.enum';
import { TranslationService } from '../services/translation.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private translationService: TranslationService;

  constructor() {
    this.translationService = new TranslationService();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Get language from header
    const languageHeader =
      request.headers['x-language'] || request.headers['accept-language'];
    let language = Language.AR; // Default to Arabic

    if (languageHeader) {
      const lang = languageHeader.split(',')[0].split('-')[0].toLowerCase();
      if (lang === 'en' || lang === 'english') {
        language = Language.EN;
      }
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'error.internal_server';

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

    const errorResponse: ApiResponse = {
      success: false,
      message: translatedMessage,
      error: originalError,
    };

    response.status(status).json(errorResponse);
  }
}

