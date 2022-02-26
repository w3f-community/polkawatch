// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Controller, Logger } from '@nestjs/common';
import { QueryParameters } from './queries/query.parameters.dtos';
import {
    IndexQueryService,
    QueryResponseTransformer,
    QueryTemplate,
} from './lqs.index.service';


/**
 * The Base Controller is responsible for implementing the API Request flow with the following steps:
 *
 * - Validation
 * - Query
 * - Transformation
 *
 * All LQS Queries follow this pattern, but provide custom parameters, template and transformer.
 *
 */

@Controller()
export class BaseController {
    readonly logger = new Logger(BaseController.name);

    constructor(protected queryService: IndexQueryService) {
        // do nothing.
    }

    runQuery(
        parameters: QueryParameters,
        queryTemplate: QueryTemplate,
        queryResponseTransformer: QueryResponseTransformer,
    ) {
        this.logger.debug('Input is valid, running query');
        return this.queryService.runQuery(
            parameters,
            queryTemplate,
            queryResponseTransformer,
        );
    }
}
