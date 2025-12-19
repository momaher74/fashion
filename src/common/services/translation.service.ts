import { Injectable } from '@nestjs/common';
import { Language } from '../enums/language.enum';

interface Translations {
  [key: string]: {
    [Language.AR]: string;
    [Language.EN]: string;
  };
}

@Injectable()
export class TranslationService {
  private translations: Translations = {
    // Authentication errors
    'auth.invalid_credentials': {
      [Language.AR]: 'بيانات الدخول غير صحيحة',
      [Language.EN]: 'Invalid credentials',
    },
    'auth.social_login_required': {
      [Language.AR]: 'تم إنشاء هذا الحساب باستخدام تسجيل الدخول الاجتماعي. يرجى استخدام طريقة تسجيل الدخول المناسبة.',
      [Language.EN]: 'This account was created with social login. Please use the appropriate login method.',
    },
    'auth.user_exists': {
      [Language.AR]: 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل',
      [Language.EN]: 'User with this email already exists',
    },
    'auth.invalid_token': {
      [Language.AR]: 'رمز غير صالح',
      [Language.EN]: 'Invalid token',
    },
    'auth.google_token_invalid': {
      [Language.AR]: 'رمز Google غير صالح',
      [Language.EN]: 'Invalid Google token',
    },
    'auth.apple_token_invalid': {
      [Language.AR]: 'رمز Apple غير صالح',
      [Language.EN]: 'Invalid Apple token',
    },
    'auth.email_required': {
      [Language.AR]: 'البريد الإلكتروني مطلوب',
      [Language.EN]: 'Email not provided',
    },
    'auth.user_not_found': {
      [Language.AR]: 'المستخدم غير موجود',
      [Language.EN]: 'User not found',
    },

    // Product errors
    'product.not_found': {
      [Language.AR]: 'المنتج غير موجود',
      [Language.EN]: 'Product not found',
    },

    // Cart errors
    'cart.product_not_found': {
      [Language.AR]: 'المنتج غير موجود',
      [Language.EN]: 'Product not found',
    },
    'cart.invalid_index': {
      [Language.AR]: 'فهرس العنصر غير صالح',
      [Language.EN]: 'Invalid item index',
    },
    'cart.empty': {
      [Language.AR]: 'السلة فارغة',
      [Language.EN]: 'Cart is empty',
    },

    // Order errors
    'order.not_found': {
      [Language.AR]: 'الطلب غير موجود',
      [Language.EN]: 'Order not found',
    },
    'order.already_paid': {
      [Language.AR]: 'تم دفع الطلب بالفعل',
      [Language.EN]: 'Order is already paid',
    },
    'order.payment_method_invalid': {
      [Language.AR]: 'الطلب غير مضبوط للدفع عبر JumiaPay',
      [Language.EN]: 'Order is not set for JumiaPay payment',
    },

    // Payment errors
    'payment.session_failed': {
      [Language.AR]: 'فشل إنشاء جلسة الدفع',
      [Language.EN]: 'Failed to create payment session',
    },

    // Validation errors
    'validation.failed': {
      [Language.AR]: 'فشل التحقق من البيانات',
      [Language.EN]: 'Validation failed',
    },

    // General errors
    'error.internal_server': {
      [Language.AR]: 'خطأ في الخادم',
      [Language.EN]: 'Internal server error',
    },
    'error.occurred': {
      [Language.AR]: 'حدث خطأ',
      [Language.EN]: 'An error occurred',
    },
    'error.unauthorized': {
      [Language.AR]: 'غير مصرح',
      [Language.EN]: 'Unauthorized',
    },
    'error.forbidden': {
      [Language.AR]: 'ممنوع',
      [Language.EN]: 'Forbidden',
    },
    'error.not_found': {
      [Language.AR]: 'غير موجود',
      [Language.EN]: 'Not found',
    },
    'error.bad_request': {
      [Language.AR]: 'طلب غير صالح',
      [Language.EN]: 'Bad request',
    },

    // Category errors
    'category.not_found': {
      [Language.AR]: 'الفئة غير موجودة',
      [Language.EN]: 'Category not found',
    },

    // SubCategory errors
    'subcategory.not_found': {
      [Language.AR]: 'الفئة الفرعية غير موجودة',
      [Language.EN]: 'SubCategory not found',
    },

    // Offer errors
    'offer.not_found': {
      [Language.AR]: 'العرض غير موجود',
      [Language.EN]: 'Offer not found',
    },

    // Color errors
    'color.not_found': {
      [Language.AR]: 'اللون غير موجود',
      [Language.EN]: 'Color not found',
    },

    // Size errors
    'size.not_found': {
      [Language.AR]: 'المقاس غير موجود',
      [Language.EN]: 'Size not found',
    },

    // Payment method errors
    'payment.cash_on_delivery_invalid': {
      [Language.AR]: 'الطلب غير مضبوط للدفع عند الاستلام',
      [Language.EN]: 'Order is not set for Cash on Delivery',
    },
  };

  translate(key: string, language: Language = Language.AR): string {
    const translation = this.translations[key];
    if (!translation) {
      return key; // Return key if translation not found
    }
    return translation[language] || translation[Language.AR];
  }

  translateMessage(message: string, language: Language = Language.AR): string {
    // If message is already a translation key (contains dot notation), translate it directly
    if (message.includes('.') && this.translations[message]) {
      return this.translate(message, language);
    }

    // Try to find exact match first
    const exactMatch = Object.keys(this.translations).find(
      (key) => this.translations[key][Language.EN] === message || this.translations[key][Language.AR] === message,
    );
    
    if (exactMatch) {
      return this.translate(exactMatch, language);
    }

    // Try to find partial match (for dynamic messages)
    for (const [key, translations] of Object.entries(this.translations)) {
      const enMsg = translations[Language.EN];
      const arMsg = translations[Language.AR];
      
      // Check if message contains the translation
      if (message.includes(enMsg) || message.includes(arMsg)) {
        return this.translate(key, language);
      }
    }

    // If no translation found, return original message
    return message;
  }
}
