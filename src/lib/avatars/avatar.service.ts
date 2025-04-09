import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AvatarService {
  private readonly baseUrl = 'https://api.dicebear.com/9.x/open-peeps/svg';

  constructor(private readonly httpService: HttpService) {}

  async getRandomAvatar(): Promise<string> {
    const seed = this.generateRandomSeed();
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}?seed=${seed}`),
    );

    return response.config.url; // Return the URL of the generated avatar
  }

  private generateRandomSeed(): string {
    return Math.random().toString(36).substring(7);
  }
}
