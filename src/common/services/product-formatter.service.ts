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
  sizes: Array<{
    id: string;
    name: string;
  }>;
  colors: Array<{
    id: string;
    name: string;
    hexCode?: string;
  }>;
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
  variants: Array<{
    sizeId: string;
    colorId: string;
    stock: number;
    price?: number;
  }>;
  isActive: boolean;
  inFavourite?: boolean;
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

    const now = new Date();
    const activeOffers = offers.filter((offer) => {
      if (!offer.isActive || offer.startDate > now || offer.endDate < now) {
        return false;
      }

      switch (offer.scope) {
        case OfferScope.GLOBAL:
          return true;
        case OfferScope.PRODUCT:
          return offer.productId?.toString() === product._id.toString();
        case OfferScope.CATEGORY:
          const prodCategoryId = (product.categoryId as any)._id?.toString() || product.categoryId?.toString();
          return offer.categoryId?.toString() === prodCategoryId;
        case OfferScope.SUB_CATEGORY:
          const prodSubCategoryId = (product.subCategoryId as any)._id?.toString() || product.subCategoryId?.toString();
          return offer.subCategoryId?.toString() === prodSubCategoryId;
        default:
          return false;
      }
    });

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
        ? (product.sizes
          .map((s: any) => {
            // Check if it's a populated document (has _id AND name properties)
            if (s && typeof s === 'object' && s._id && s.name) {
              // Only include active sizes
              if (s.isActive === false) {
                return null;
              }
              return {
                id: s._id.toString(),
                name: s.name,
              };
            }
            return null;
          })
          .filter((item) => item !== null) as any)
        : [],
      colors: Array.isArray(product.colors)
        ? (product.colors
          .map((c: any) => {
            // Check if it's a populated document (has _id AND name properties)
            if (c && typeof c === 'object' && c._id && c.name) {
              // Only include active colors
              if (c.isActive === false) {
                return null;
              }
              return {
                id: c._id.toString(),
                name: c.name,
                hexCode: c.hexCode,
              };
            }
            return null;
          })
          .filter((item) => item !== null) as any)
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
      variants: Array.isArray(product.variants)
        ? product.variants.map((v) => {
          const variantPrice = v.price || product.price;
          const discount = bestOffer ? this.calculateDiscount(variantPrice, bestOffer) : 0;
          return {
            sizeId: v.sizeId.toString(),
            colorId: v.colorId.toString(),
            stock: v.stock,
            price: variantPrice,
            finalPrice: Math.max(0, variantPrice - discount),
          };
        })
        : [],
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
  public getLocalizedText(text: Multilingual, language: Language): string {
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

