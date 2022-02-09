import { Injectable } from '@nestjs/common';
import { BaseQueryParameters } from './queryParameters.dtos';
import { ElasticsearchService } from '@nestjs/elasticsearch';


export type QueryTemplate = (params: BaseQueryParameters) => any ;

@Injectable()
export class IndexQueryService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async runQuery(
    parameters: BaseQueryParameters,
    queryTemplate: QueryTemplate,
  ): Promise<any> {
    return this.elasticsearchService.search({
      index: 'pw_reward',
      track_total_hits: true,
      body: queryTemplate(parameters),
    });
  }
}
