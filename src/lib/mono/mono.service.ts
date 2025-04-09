import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class MonoService {
  private readonly monoBaseUrl = 'https://api.withmono.com/v3';
  private monoSecretKey: string;
  private readonly logger = new Logger(MonoService.name);

  constructor(private readonly httpService: HttpService) {
    this.monoSecretKey =
      process.env.MONO_ENVIRONMENT === 'TEST'
        ? (process.env.MONO_TEST_SECRET_KEY ?? '')
        : (process.env.MONO_SECRET_KEY ?? '');
  }

  private formatError(error: any, defaultMsg: string) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || HttpStatus.BAD_GATEWAY;
    const data = axiosError.response?.data as { message?: string };
    const message =
      data?.message || axiosError.response?.statusText || defaultMsg;

    return new HttpException(message, status);
  }

  async getBanks(): Promise<any> {
    const url = `${this.monoBaseUrl}/banks/list`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Accept: 'application/json',
            'mono-sec-key': this.monoSecretKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to fetch bank list from Mono');
    }
  }

  async initiatePayment(payload: any): Promise<any> {
    const url = `${this.monoBaseUrl.replace('/v3', '/v2')}/payments/initiate`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mono-sec-key': this.monoSecretKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to initiate payment');
    }
  }

  async createMandate(payload: any): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mono-sec-key': this.monoSecretKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to create mandate');
    }
  }

  async verifyMandateOtp(payload: {
    session: string;
    method: string;
    otp: string;
  }): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates/verify/otp`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to verify OTP');
    }
  }

  async getMandateById(id: string): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates/${id}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Accept: 'application/json',
            'mono-sec-key': this.monoSecretKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to retrieve mandate by ID');
    }
  }

  async getAllMandates(): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Accept: 'application/json',
            'mono-sec-key': this.monoSecretKey,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to fetch mandates');
    }
  }

  async cancelMandate(id: string): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates/${id}/cancel`;

    try {
      const response = await lastValueFrom(
        this.httpService.patch(
          url,
          {},
          {
            headers: {
              Accept: 'application/json',
              'mono-sec-key': this.monoSecretKey,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to cancel mandate');
    }
  }

  async pauseMandate(id: string): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates/${id}/pause`;

    try {
      const response = await lastValueFrom(
        this.httpService.patch(
          url,
          {},
          {
            headers: {
              Accept: 'application/json',
              'mono-sec-key': this.monoSecretKey,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to pause mandate');
    }
  }

  async reinstateMandate(id: string): Promise<any> {
    const url = `${this.monoBaseUrl}/payments/mandates/${id}/reinstate`;

    try {
      const response = await lastValueFrom(
        this.httpService.patch(
          url,
          {},
          {
            headers: {
              Accept: 'application/json',
              'mono-sec-key': this.monoSecretKey,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error, 'Failed to reinstate mandate');
    }
  }
}
