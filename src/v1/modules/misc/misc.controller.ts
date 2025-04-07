import { Controller, Get, Post, Body, HttpStatus, Req } from '@nestjs/common';
import { MiscService } from './misc.service';
import { ResolveAccountDto } from 'src/v1/dto';
import { ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Misc')
@Controller({ path: 'misc', version: '1' })
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Get('paystack/banks')
  @ApiOperation({ summary: 'Get the list of paystack banks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the list of all available banks',
  })
  async getBanks() {
    return await this.miscService.getBanks();
  }

  @Post('paystack/account')
  @ApiOperation({ summary: 'Get account name from paystack' })
  @ApiBody({ type: ResolveAccountDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved account name',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account details provided',
  })
  async getAccountName(@Body() account: ResolveAccountDto) {
    return await this.miscService.getAccountName(account);
  }

  @Post('webhook/paystack')
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  async handlePaystackWebhook(@Req() req) {
    await this.miscService.handlePaystackWebhook(req.body, req.headers);
  }
}
