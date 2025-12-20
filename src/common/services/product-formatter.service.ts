import { Injectable } from '@nestjs/common';
import { ProductDocument } from '../../schemas/product.schema';
import { OfferDocument } from '../../schemas/offer.schema';
import { OfferType } from '../enums/offer-type.enum';
import { OfferScope } from '../enums/offer-scope.enum';
import { Language } from '../enums/language.enum';
import { Multilingual } from '../interfaces/multilingual.interface';

export interface FormattedProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  finalPrice: number;
  currency: string;
  offerApplied?: {
    title: string;
    type: OfferType;
    value: number;
    discount: number;
  };
  sizes: string[];
  colors: string[];
  category: {
    id: string;
    name: string;
    nameMultilingual?: any;
  };
  subCategory: {
    id: string;
    name: string;
    nameMultilingual?: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductFormatterService {
  /**
   * Formats a product with applied offers
   * Applies the bigger discount if both global and product-specific offers exist
   */
  formatProduct(
    product: ProductDocument,
    offers: OfferDocument[],
    language: Language = Language.AR,
  ): FormattedProduct {

    console.log(language);
    const now = new Date();
    const activeOffers = offers.filter(
      (offer) =>
        offer.isActive &&
        offer.startDate <= now &&
        offer.endDate >= now &&
        (offer.scope === OfferScope.GLOBAL ||
          (offer.scope === OfferScope.PRODUCT &&
            offer.productId?.toString() === product._id.toString())),
    );

    let bestOffer: OfferDocument | null = null;
    let bestDiscount = 0;

    // Find the offer with the biggest discount
    for (const offer of activeOffers) {
      const discount = this.calculateDiscount(product.price, offer);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }

    const finalPrice = bestOffer
      ? product.price - bestDiscount
      : product.price;

    return {
      id: product._id.toString(),
      name: this.getLocalizedText(product.name, language),
      description: this.getLocalizedText(product.description, language),
      images: product.images,
      price: product.price,
      finalPrice: Math.max(0, finalPrice), // Ensure non-negative
      currency: product.currency,
      offerApplied: bestOffer
        ? {
            title: this.getLocalizedText(bestOffer.title, language),
            type: bestOffer.type,
            value: bestOffer.value,
            discount: bestDiscount,
          }
        : undefined,
      sizes: Array.isArray(product.sizes)
        ? product.sizes.map((s: any) => (typeof s === 'object' ? s.name : s))
        : [],
      colors: Array.isArray(product.colors)
        ? product.colors.map((c: any) => (typeof c === 'object' ? c.name : c))
        : [],
      category: product.categoryId
        ? {
            id: (product.categoryId as any)._id
              ? (product.categoryId as any)._id.toString()
              : (product.categoryId as any).toString(),
            name:
              typeof product.categoryId === 'object' &&
              (product.categoryId as any).name
                ? this.getLocalizedText(
                    (product.categoryId as any).name,
                    language,
                  )
                : '',
            nameMultilingual:
              typeof product.categoryId === 'object' &&
              (product.categoryId as any).name
                ? (product.categoryId as any).name
                : undefined,
          }
        : { id: '', name: '' },
      subCategory: product.subCategoryId
        ? {
            id: (product.subCategoryId as any)._id
              ? (product.subCategoryId as any)._id.toString()
              : (product.subCategoryId as any).toString(),
            name:
              typeof product.subCategoryId === 'object' &&
              (product.subCategoryId as any).name
                ? this.getLocalizedText(
                    (product.subCategoryId as any).name,
                    language,
                  )
                : '',
            nameMultilingual:
              typeof product.subCategoryId === 'object' &&
              (product.subCategoryId as any).name
                ? (product.subCategoryId as any).name
                : undefined,
          }
        : { id: '', name: '' },
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Formats multiple products
   */
  formatProducts(
    products: ProductDocument[],
    offers: OfferDocument[],
    language: Language = Language.AR,
  ): FormattedProduct[] {
    return products.map((product) =>
      this.formatProduct(product, offers, language),
    );
  }

  /**
   * Calculates discount amount based on offer type
   */
  private calculateDiscount(price: number, offer: OfferDocument): number {
    if (offer.type === OfferType.PERCENTAGE) {
      return (price * offer.value) / 100;
    } else {
      // Fixed amount
      return Math.min(offer.value, price); // Don't exceed product price
    }
  }

  /**
   * Gets localized text from multilingual object
   */
  private getLocalizedText(text: Multilingual, language: Language): string {
    if (!text) {
      return '';
    }
    if (typeof (text as any) === 'string') {
      return text as unknown as string;
    }
    const localized = (text as any)[language] ?? (text as any).en ?? (text as any).ar;
    return typeof localized === 'string' ? localized : '';
  }
}

