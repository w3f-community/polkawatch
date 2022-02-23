"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.IndexerModule = void 0;
var common_1 = require("@nestjs/common");
var archive_service_1 = require("./archive.service");
var schedule_1 = require("@nestjs/schedule");
var config_1 = require("@nestjs/config");
var indexer_scheduler_1 = require("./indexer.scheduler");
var substrate_history_service_1 = require("./substrate.history.service");
var geo_service_1 = require("./geo/geo.service");
var Joi = require("joi");
var IndexerModule = /** @class */ (function () {
    function IndexerModule() {
    }
    IndexerModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema: Joi.object({
                        NODE_ENV: Joi.string()
                            .valid('development', 'production', 'test')["default"]('development'),
                        INDEXER_PORT: Joi.number()["default"](7100),
                        INDEXER_ARCHIVE_HOST: Joi.string()["default"]('localhost'),
                        INDEXER_ARCHIVE_PORT: Joi.number()["default"](3000),
                        INDEXER_SUBSTRATE_RPC_URL: Joi.string()["default"]('wss://polkadot.valletech.eu')
                    })
                }),
                schedule_1.ScheduleModule.forRoot(),
                common_1.CacheModule.register(),
            ],
            controllers: [],
            providers: [archive_service_1.ArchiveService, indexer_scheduler_1.IndexerSchedulerService, substrate_history_service_1.SubstrateAPIService, substrate_history_service_1.SubstrateHistoryService, geo_service_1.GeoService]
        })
    ], IndexerModule);
    return IndexerModule;
}());
exports.IndexerModule = IndexerModule;
