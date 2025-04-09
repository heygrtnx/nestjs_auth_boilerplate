import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class PremblyService {
  private readonly baseUrl = 'https://api.prembly.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async validateBVN(bvnNumber: string) {
    const appId = this.configService.get<string>('PREMBLY_APP_ID');
    const apiKey = this.configService.get<string>('PREMBLY_API_KEY');

    const headers = {
      accept: 'application/json',
      'app-id': appId,
      'x-api-key': apiKey,
      'content-type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await firstValueFrom(
        this.httpService
          .post(
            `${this.baseUrl}/identitypass/verification/bvn_validation`,
            { number: bvnNumber },
            { headers },
          )
          .pipe(
            catchError((error) => {
              const errorObj = new Error();
              errorObj.message =
                error.response?.data?.detail?.number?.[0] ||
                error.response?.data?.message ||
                error.message ||
                'An error occurred during BVN validation';
              errorObj.name = 'BVNValidationError';
              throw errorObj;
            }),
          ),
      );

      // Check if response indicates record not found
      if (
        response.data.status === false &&
        response.data.response_code === '01'
      ) {
        return {
          status: false,
          detail: {
            number: ['Record not found for this BVN'],
          },
        };
      }

      return response.data;
    } catch (error) {
      return {
        status: false,
        detail: {
          number: [error.message],
        },
      };
    }
  }
}
