import { Injectable } from '@nestjs/common';
import { QueryParameters } from './queryParameters.dtos';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { QueryResponse } from './queryReponse.dtos';
import { ApiResponse } from '@elastic/elasticsearch';
import { AggregationsFiltersAggregate } from '@elastic/elasticsearch/api/types';

export type QueryResponseTransformer = (rawResponse: IndexResponse) => QueryResponse;
export type QueryTemplate = (params: QueryParameters) => any;

// Generic Description of the Response

export type IndexResponse = ApiResponse;

// Shorthand types expected to be used from transformers
export type IndexData = AggregatedIndexData ;
export type AggregatedIndexData = AggregationsFiltersAggregate[];


@Injectable()
export class IndexQueryService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async runQuery(
    parameters: QueryParameters,
    queryTemplate: QueryTemplate,
    resultTransformer: QueryResponseTransformer,
  ): Promise<QueryResponse> {
    const rawResponse: ApiResponse = await this.elasticsearchService.search({
      index: 'pw_reward',
      track_total_hits: true,
      body: queryTemplate(parameters),
    });

    return resultTransformer(rawResponse);
  }
}
