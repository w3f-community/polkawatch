import { Injectable } from '@nestjs/common';

@Injectable()
export class IndexQueryService {
  runQuery(parameters) {
    return Promise.resolve(parameters);
  }
}
