import { HttpException, HttpStatus } from '@nestjs/common';

export class handleResponse extends HttpException {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: any,
  ) {
    const statusType = HttpStatus[statusCode];

    const response: any = {
      statusCode,
      statusType,
      message,
    };

    if (data !== undefined) {
      response.data = data;
    }

    super(response, statusCode);
  }

  getResponse(): any {
    const response: any = {
      statusCode: this.getStatus(),
      statusType: HttpStatus[this.getStatus()],
      message: this.message,
    };

    if (this.data !== undefined) {
      response.data = this.data;
    }

    return response;
  }

  getStatus(): number {
    return this.statusCode;
  }
}
