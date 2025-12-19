import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { Language } from '../common/enums/language.enum';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getHome(
    @LanguageHeader() language: Language,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id;
    return this.homeService.getHomeData(language, userId);
  }
}
