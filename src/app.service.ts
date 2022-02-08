import { Injectable } from '@nestjs/common';
import { BaseQueryParameters } from './queryParameters.dtos';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticQueryTemplate } from './app.controller';

@Injectable()
export class IndexQueryService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async runQuery(
    parameters: BaseQueryParameters,
    queryTemplate: ElasticQueryTemplate,
  ): Promise<any> {
    return this.elasticsearchService.search({
      index: 'pw_reward',
      track_total_hits: true,
      body: queryTemplate,
    });
  }
}
