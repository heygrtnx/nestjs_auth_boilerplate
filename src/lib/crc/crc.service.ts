import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { RedisService } from '../redis/redis.service';

/**
 * Service for interacting with Credit Reference Company (CRC) API
 * Handles credit checks and loan evaluations based on BVN
 */
@Injectable()
export class CrcService {
  private crcUsername: string;
  private crcPassword: string;
  private baseUrl =
    'https://webserver.creditreferencenigeria.net/JsonLiveRequest/JsonService.svc/CIRRequest/ProcessRequestJson';

  constructor(
    private readonly httpService: HttpService,
    private readonly redisServe: RedisService,
  ) {}

  /**
   * Makes API call to CRC to get credit report for a BVN
   * @param bvn - Bank Verification Number to check
   * @returns Evaluated loan decisions and overall credit decision
   */
  async consumeCrcApi(bvn: string): Promise<any> {
    const url = this.baseUrl;
    const payload = {
      Request: `{'@REQUEST_ID': '1','REQUEST_PARAMETERS': {   'REPORT_PARAMETERS': {      '@REPORT_ID': '2',      '@SUBJECT_TYPE': '1',      '@RESPONSE_TYPE': '5'   },   'INQUIRY_REASON': {      '@CODE': '1'   },   'APPLICATION': {      '@PRODUCT': '017',      '@NUMBER': '232',      '@AMOUNT': '15000',      '@CURRENCY': 'NGN' }},'SEARCH_PARAMETERS': {   '@SEARCH-TYPE': '4',   'BVN_NO': '${bvn}' }}`,
      UserName: this.crcUsername,
      Password: this.crcPassword,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      return this.evaluateLoans(response.data);
    } catch (error) {
      throw new HttpException('CRC API call failed', 500);
    }
  }

  /**
   * Evaluates loan history data to make credit decisions
   * @param data - Credit report data from CRC
   * @returns Object containing individual loan decisions and overall credit decision
   */
  private async evaluateLoans(data: any): Promise<{
    LoanDecisions: Record<string, string>;
    OverallDecision: string;
  }> {
    const decision: Record<string, string> = {};
    let acceptedCount = 0;

    // Check if no credit history found
    const noHit = data?.ConsumerNoHitResponse?.HEADER?.RESPONSETYPE?.CODE === 2;
    if (noHit) {
      return {
        LoanDecisions: { NOHIT: 'NOHIT' },
        OverallDecision: 'Approved',
      };
    }

    // Get loan history array
    const loans = data?.ConsumerHitResponse?.BODY?.CreditFacilityHistory24;
    if (!loans || !Array.isArray(loans)) {
      return {
        LoanDecisions: {},
        OverallDecision: 'Approved',
      };
    }

    // Check if too many existing loans
    const totalLoans = loans.length;
    if (totalLoans > 5) {
      for (const loan of loans) {
        decision[loan.ACCOUNT_NUMBER] = 'Declined: Too many loans.';
      }
      return {
        LoanDecisions: decision,
        OverallDecision: 'Declined: Too many loans.',
      };
    }

    // Evaluate each loan based on various criteria
    for (const loan of loans) {
      const account = loan.ACCOUNT_NUMBER;
      const daysInArrears = parseInt(
        loan.NUM_OF_DAYS_IN_ARREARS_CAL.replace(/,/g, ''),
        10,
      );
      const assetClass = loan.ASSET_CLASSIFICATION_CAL.toLowerCase();
      const amountOverdue = parseInt(
        loan.AMOUNT_OVERDUE_CAL.replace(/,/g, ''),
        10,
      );

      // Evaluate loan status and make decision
      if (daysInArrears === 0 && assetClass === 'performing') {
        decision[account] = 'Accepted: Performing and no arrears.';
        acceptedCount++;
      } else if (daysInArrears <= 30 && assetClass === 'pass and watch') {
        decision[account] = 'Accepted: Pass and watch with 1-30 days arrears.';
        acceptedCount++;
      } else if (
        daysInArrears <= 60 &&
        assetClass === 'substandard' &&
        amountOverdue <= 50000
      ) {
        decision[account] =
          'Accepted: Substandard with 31-60 days arrears and overdue <= 50000.';
        acceptedCount++;
      } else if (
        daysInArrears <= 90 &&
        assetClass === 'doubtful' &&
        amountOverdue <= 50000
      ) {
        decision[account] =
          'Accepted: Doubtful with 61-90 days arrears and overdue <= 50000.';
        acceptedCount++;
      } else if (daysInArrears > 90 && assetClass === 'lost') {
        decision[account] = 'Rejected: Lost with more than 90 days arrears.';
      } else {
        decision[account] = 'Accepted: Not within the conditions.';
        acceptedCount++;
      }
    }

    // Calculate overall decision based on 60% acceptance threshold
    const threshold = Math.ceil(0.6 * totalLoans);
    const overallDecision =
      acceptedCount >= threshold ? 'Approved' : 'Declined';

    return {
      LoanDecisions: decision,
      OverallDecision: overallDecision,
    };
  }
}
