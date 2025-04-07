import { HttpStatus, Injectable } from '@nestjs/common';
import { PaymentType } from '@prisma/client';
import { PaystackService } from 'src/lib/paystack/paystack.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { handleResponse, AuthHelper } from 'src/utils';
import { ResolveAccountDto } from 'src/v1/dto';
import { WebPushService } from 'src/lib/web-push/web-push.service';

@Injectable()
export class MiscService {
  constructor(
    private readonly paystack: PaystackService,
    private readonly prisma: PrismaService,
    private readonly webPushService: WebPushService,
    private readonly authHelper: AuthHelper,
  ) {}

  async getBanks() {
    const banks = await this.paystack.getBanks();
    if (!banks || banks.length < 0) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'No banks found');
    }

    return new handleResponse(
      HttpStatus.OK,
      'Bank list is available',
      banks,
    ).getResponse();
  }

  async getAccountName(account: ResolveAccountDto) {
    const accountDetails = await this.paystack.resolveBankAccount(
      account.accountNumber,
      account.bankCode,
    );

    if (!accountDetails) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Account not found');
    }

    return new handleResponse(
      HttpStatus.OK,
      'Account Found',
      accountDetails,
    ).getResponse();
  }

  async handlePaystackWebhook(body: any, headers: any): Promise<any> {
    try {
      const payData = await this.paystack.handlePaystackWebhook(body, headers);
      //console.log('Received Paystack Data:', JSON.stringify(payData, null, 2));

      const cust_code = payData.customer?.customer_code;
      if (!cust_code) {
        console.error('❌ Missing Customer Code');
        throw new handleResponse(
          HttpStatus.BAD_REQUEST,
          'Missing Customer Code',
        );
      }

      const amountPaid = payData.amount / 100;
      const chargesFee = payData.fees / 100;
      const deductFee = amountPaid - chargesFee;

      let userWallet;

      // Start Prisma Transaction
      await this.prisma.$transaction(async (prisma) => {
        try {
          userWallet = await prisma.wallet.findUnique({
            where: { cust_code },
            include: {
              user: {
                include: { WalletBalance: true, PushSubscription: true },
              },
            },
          });

          if (!userWallet || !userWallet.user?.WalletBalance) {
            console.error('❌ Wallet or Balance not found', { cust_code });
            throw new Error('Wallet or Balance not found');
          }

          const existingBalance = userWallet.user.WalletBalance.balance;
          const newBalance = existingBalance + deductFee;

          // Update Wallet Balance
          await prisma.walletBalance.update({
            where: { balanceId: userWallet.user.WalletBalance.balanceId },
            data: { balance: newBalance, lastBalance: existingBalance },
          });

          // Create Transaction Record
          await prisma.transactionHistory.create({
            data: {
              extRef: payData.reference,
              prevBalance: existingBalance,
              newBalance,
              paymentReference: `WALLET-${Date.now()}`,
              paymentDescription: 'Wallet Deposit',
              amount: amountPaid,
              currency: payData.currency,
              channel: payData.channel,
              paymentType: PaymentType.CREDIT,
              charge: chargesFee,
              chargeNarration: 'Paystack Charges',
              senderBank: payData.authorization?.sender_bank || 'Unknown',
              senderAccount:
                payData.authorization?.sender_bank_account_number || 'Unknown',
              recieverBank: payData.authorization?.receiver_bank || 'Unknown',
              recieverAccount:
                payData.authorization?.receiver_bank_account_number ||
                'Unknown',
              paid_at: payData.paidAt,
              createdAt: payData.created_at,
              User: { connect: { userId: userWallet.user.userId } },
            },
          });
        } catch (dbError) {
          console.error('❌ Prisma Transaction Error:', dbError);
          throw new Error('Database transaction failed');
        }
      });

      // ✅ After transaction completes, send email & push notification

      if (userWallet) {
        // Send Email Notification
        try {
          await this.authHelper.sendEmail(
            userWallet.user.firstName,
            userWallet.user.lastName,
            userWallet.user.email,
            'creditAlert',
            'Wallet Credit Alert!',
            `₦${amountPaid.toFixed(2)}`,
            'message',
          );
          console.log('✅ Email Sent Successfully');
        } catch (emailError) {
          console.error('❌ Email Sending Error:', emailError);
        }

        // Send Push Notification (if user has a subscription)
        if (userWallet.user.PushSubscription) {
          try {
            await this.webPushService.sendNotification(
              userWallet.user.PushSubscription.subscription,
              {
                title: 'Credit Alert!',
                message: `Your account has been credited with ₦${amountPaid.toFixed(2)}`,
              },
            );
            console.log('✅ Push Notification Sent Successfully');
          } catch (pushError) {
            console.error('❌ Push Notification Error:', pushError);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Webhook Processing Error:', error);
      throw new handleResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Database error occurred',
      );
    }
  }
}
