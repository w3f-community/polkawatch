import { Injectable } from '@nestjs/common';
import { BaseQueryParameters } from './queryParameters.dtos';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {BaseQueryResponse} from "./queryReponse.dtos";

export type QueryResponseTransformer = (rawResponse: any) => BaseQueryResponse ; //Record<string,AggregationsTermsAggregate<T>>
export type QueryTemplate = (params: BaseQueryParameters) => any ;

@Injectable()
export class IndexQueryService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async runQuery(
    parameters: BaseQueryParameters,
    queryTemplate: QueryTemplate,
    resultTransformer: QueryResponseTransformer,
  ): Promise<BaseQueryResponse> {
    const rawResponse = await this.elasticsearchService.search({
      index: 'pw_reward',
      track_total_hits: true,
      body: queryTemplate(parameters),
    });

    return resultTransformer(rawResponse);
  }
}
