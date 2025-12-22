import {
    Controller,
    Post,
    Get,
    Param,
    UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { Language } from '../common/enums/language.enum';
import { UserDocument } from '../schemas/user.schema';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Post('toggle/:productId')
    async toggleWishlist(
        @CurrentUser() user: any,
        @Param('productId') productId: string,
    ) {
        return this.wishlistService.toggleWishlist(user.id, productId);
    }

    @Get()
    async getWishlist(
        @CurrentUser() user: any,
        @LanguageHeader() language: Language,
    ) {
        return this.wishlistService.getWishlist(user.id, language);
    }
}
