import { Injectable } from '@nestjs/common';
import { QueryParameters } from './queries/query.parameters.dtos';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { QueryResponse } from './queries/query.responses.dtos';
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
    constructor(private readonly elasticsearchService: ElasticsearchService) {
        // do nothing.
    }

    async runQuery(
        parameters: QueryParameters,
        queryTemplate: QueryTemplate,
        resultTransformer: QueryResponseTransformer,
    ): Promise<QueryResponse> {
        const rawResponse: ApiResponse = await this.doSearch(this.elasticsearchService, {
            index: 'pw_reward',
            track_total_hits: true,
            body: queryTemplate(parameters),
        });

        return resultTransformer(rawResponse);
    }

    async doSearch(elasticsearchService, parameters){
        return elasticsearchService.search(parameters);
    }
}
