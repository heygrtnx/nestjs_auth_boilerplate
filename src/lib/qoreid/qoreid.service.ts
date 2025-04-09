import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Redis } from 'ioredis';

@Injectable()
export class QoreIDService {
  constructor(private readonly httpService: HttpService) {}

  private readonly clientId =
    process.env.ENVIRONMENT === 'TEST'
      ? process.env.QOREID_CLIENT
      : process.env.QOREID_LIVE_CLIENT;

  private readonly secret =
    process.env.ENVIRONMENT === 'TEST'
      ? process.env.QOREID_SECRET
      : process.env.QOREID_LIVE_SECRET;

  private readonly redis: Redis = new Redis(process.env.REDIS_URL || '');

  private async fetchToken(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const url = 'https://api.qoreid.com/token';
    try {
      const response$ = this.httpService.post(
        url,
        { clientId: this.clientId, secret: this.secret },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      const response = await lastValueFrom(response$);

      // Extract and validate accessToken and expiresIn from response
      const { accessToken, expiresIn } = response.data;
      if (!accessToken || !expiresIn) {
        throw new Error(
          'Invalid response format: Missing accessToken or expiresIn',
        );
      }

      // Return accessToken and expiresIn
      return { accessToken, expiresIn };
    } catch (error) {
      throw new Error(
        `Error fetching QoreID token: ${error.response?.data || error.message}`,
      );
    }
  }

  async getToken(): Promise<string> {
    try {
      // Check if the token exists in Redis
      const tokenFromRedis = await this.redis.get('qore');
      if (tokenFromRedis) {
        // Return token if found in Redis
        return JSON.parse(tokenFromRedis);
      }

      // If not found, fetch a new token
      const { accessToken, expiresIn } = await this.fetchToken();

      // Store the token in Redis with expiration
      await this.redis.set(
        'qore',
        JSON.stringify(accessToken),
        'EX',
        expiresIn,
      );

      // Return the new token
      return accessToken;
    } catch (error) {
      throw new Error(`Error retrieving token: ${error.message}`);
    }
  }

  async verifyNIN(
    nin: string,
    payload: { firstname: string; lastname: string },
  ): Promise<any> {
    const token = await this.getToken();
    const url = `https://api.qoreid.com/v1/ng/identities/nin/${nin}`;
    try {
      const response$ = this.httpService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const response = await lastValueFrom(response$);
      return response.data;
    } catch (error) {
      throw new Error(
        `Error verifying NIN: ${error.response?.data || error.message}`,
      );
    }
  }

  async verifyDriversLicense(
    idNumber: string,
    payload: { firstname: string; lastname: string },
  ): Promise<any> {
    const token = await this.getToken();
    const url = `https://api.qoreid.com/v1/ng/identities/drivers-license/${idNumber}`;
    try {
      const response$ = this.httpService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const response = await lastValueFrom(response$);
      return response.data;
    } catch (error) {
      throw new Error(
        `Error verifying driver's license: ${
          error.response?.data || error.message
        }`,
      );
    }
  }

  async verifyLicensePlate(
    plateNumber: string,
    payload: { firstname: string; lastname: string },
  ): Promise<any> {
    const token = await this.getToken();
    const url = `https://api.qoreid.com/v1/ng/identities/license-plate-premium/${plateNumber}`;
    try {
      const response$ = this.httpService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const response = await lastValueFrom(response$);
      return response.data;
    } catch (error) {
      throw new Error(
        `Error verifying license plate: ${
          error.response?.data || error.message
        }`,
      );
    }
  }
}
