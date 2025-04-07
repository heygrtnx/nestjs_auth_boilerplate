import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { handleResponse } from 'src/utils/common';
import * as crypto from 'crypto';
@Injectable()
export class PaystackService {
  private paystackSecret: string;
  private preferredBank: string;
  private baseUrl = 'https://api.paystack.co';

  constructor(private readonly httpService: HttpService) {
    if (process.env.ENVIRONMENT === 'TEST') {
      this.paystackSecret = process.env.PAYSTACK_SECRET_KEY ?? '';
      this.preferredBank = 'test-bank';
    } else {
      this.paystackSecret = process.env.PAYSTACK_SECRET_KEY_LIVE ?? '';
      this.preferredBank = 'titan-paystack';
    }
  }

  private async makeRequest(
    method: 'get' | 'post',
    endpoint: string,
    data?: any,
  ): Promise<any> {
    if (!this.paystackSecret) {
      throw new InternalServerErrorException('Paystack secret key not set');
    }

    try {
      const headers = {
        Authorization: `Bearer ${this.paystackSecret}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        method === 'get'
          ? this.httpService.get(`${this.baseUrl}${endpoint}`, { headers })
          : this.httpService.post(`${this.baseUrl}${endpoint}`, data, {
              headers,
            }),
      );

      if (![HttpStatus.OK, HttpStatus.CREATED].includes(response.status)) {
        throw new InternalServerErrorException('Request failed');
      }

      return response.data;
    } catch (error) {
      console.error('Request error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Unauthorized request to Paystack');
      }
      throw new handleResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Request failed',
        error.response?.data || error.message,
      );
    }
  }

  async createPaystackCustomer(
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
  ): Promise<any> {
    return this.makeRequest('post', '/customer', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
  }

  async createDedicatedAccount(customerCode: string): Promise<any> {
    return this.makeRequest('post', '/dedicated_account', {
      customer: customerCode,
      preferred_bank: this.preferredBank,
    });
  }

  async retrieveDedicatedAccount(customerCode: string): Promise<any> {
    return this.makeRequest('get', `/dedicated_account/${customerCode}`);
  }

  async retrieveCustomerCode(email: string): Promise<any> {
    const response = await this.makeRequest('get', `/customer?email=${email}`);
    const customer = response.data[0];
    return customer.customer_code;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    currency: string,
    callback_url?: string,
  ): Promise<any> {
    return this.makeRequest('post', '/transaction/initialize', {
      email,
      amount: amount * 100, // Amount in kobo
      currency,
      callback_url,
    });
  }

  async verifyTransaction(reference: string): Promise<any> {
    return this.makeRequest('get', `/transaction/verify/${reference}`);
  }

  async getBanks(): Promise<any> {
    return this.makeRequest('get', '/bank');
  }

  /*async resolveBankAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<any> {
    return this.makeRequest(
      'get',
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );
  }*/

  async getBankById(bankId: number): Promise<any> {
    const response = await this.getBanks();
    const bank = response.data.find((b) => b.id === bankId);
    return bank || null;
  }

  async getBankByCode(bankCode: string): Promise<any> {
    const response = await this.getBanks();
    const bank = response.data.find((b) => b.code === bankCode);
    return bank || null;
  }

  async resolveBankAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<any> {
    try {
      const response = await this.makeRequest(
        'get',
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      );
      return response.data;
    } catch (error) {
      console.error(
        'Paystack resolve error:',
        error.response?.data || error.message,
      );
      if (error.response?.status === 400) {
        throw new handleResponse(
          HttpStatus.BAD_REQUEST,
          'Invalid account number or bank code',
        );
      }
      throw new handleResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to resolve account details',
      );
    }
  }

  async handlePaystackWebhook(body: any, headers: any): Promise<any> {
    const secret = headers['x-paystack-signature'];
    if (!secret) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    // Validate Paystack Signature
    const hash = crypto
      .createHmac('sha512', this.paystackSecret)
      .update(JSON.stringify(body))
      .digest('hex');
    if (hash !== headers['x-paystack-signature']) {
      throw new handleResponse(
        HttpStatus.FORBIDDEN,
        'Invalid Paystack signature',
      );
    }

    const event = body;
    if (event.event !== 'charge.success') {
      console.log('Unhandled Paystack event:', event.event);
      return false;
    }

    return event.data;
  }
}
