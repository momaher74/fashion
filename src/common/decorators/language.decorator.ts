import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '../enums/language.enum';

export const LanguageHeader = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Language => {
    const request = ctx.switchToHttp().getRequest();
    const languageHeader =
      request.headers['language'] || request.headers['x-language'] || request.headers['accept-language'];

    if (languageHeader) {
      // Handle Accept-Language format (e.g., "en-US,en;q=0.9")
      const lang = languageHeader.split(',')[0].split('-')[0].toLowerCase();

      // Map to our Language enum
      if (lang === 'ar' || lang === 'arabic') {
        return Language.AR;
      }
      if (lang === 'en' || lang === 'english') {
        return Language.EN;
      }
    }

    // Default to Arabic if not specified or invalid
    return Language.AR;
  },
);
