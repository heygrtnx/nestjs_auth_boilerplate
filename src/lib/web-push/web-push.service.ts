import * as webPush from 'web-push';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebPushService {
  constructor() {
    webPush.setVapidDetails(
      `mailto:${process.env.PLATFORM_SUPPORT}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async sendNotification(subscription: any, payload: any) {
    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Error sending push notification', error);
    }
  }
}
