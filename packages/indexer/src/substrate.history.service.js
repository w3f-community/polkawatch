"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.SubstrateAPIService = exports.SubstrateHistoryService = void 0;
var common_1 = require("@nestjs/common");
var api_1 = require("@polkadot/api");
var config_1 = require("@nestjs/config");
var lru_cache_1 = require("lru-cache");
/**
 * The Substrate History service uses RPC calls over History Depth to
 * extract some available information otherwise very difficult to deduce
 * from chain data.
 *
 * Essentially we are treating HistoryDepth queries as an "external" datasource
 * to merge data from.
 *
 * It might be possible to migrate some of this data to pass-1 later on.
 *
 */
var SubstrateHistoryService = /** @class */ (function () {
    function SubstrateHistoryService(api, configService, cacheManager) {
        this.api = api;
        this.configService = configService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(SubstrateHistoryService_1.name);
        this.substrateCache = new lru_cache_1["default"](200);
    }
    SubstrateHistoryService_1 = SubstrateHistoryService;
    /**
     * pass-2 indexing will start at history-depth.
     * external databases are known to contain "live data", for example geo data is constantly
     * amended, and must be updated daily as per license agreements.
     *
     * Substrate staking data is also "live" due to the fact that rewards can be claimed after a
     * certain time period, since data may be presented per era, the claiming process represent
     * "live" data too.
     *
     * history depth is considered a generous time period for live data to settle, and 2-pass
     * indexing should re-index from history depth every day.
     *
     */
    SubstrateHistoryService.prototype.historyDepthStartBlock = function () {
        return __awaiter(this, void 0, void 0, function () {
            var historyDepth, epochDuration, sessionsPerEra, blocksPerEra, historyBlocks, currentBlockNumber, startBlock;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.api.query.staking.historyDepth()];
                    case 1:
                        historyDepth = _a.sent();
                        return [4 /*yield*/, this.api.consts.babe.epochDuration.toNumber()];
                    case 2:
                        epochDuration = _a.sent();
                        return [4 /*yield*/, this.api.consts.staking.sessionsPerEra.toNumber()];
                    case 3:
                        sessionsPerEra = _a.sent();
                        blocksPerEra = sessionsPerEra * epochDuration;
                        historyBlocks = blocksPerEra * historyDepth;
                        return [4 /*yield*/, this.api.query.system.number()];
                    case 4:
                        currentBlockNumber = _a.sent();
                        startBlock = currentBlockNumber - historyBlocks;
                        this.logger.log("History Depth starts at block: ".concat(startBlock));
                        return [2 /*return*/, startBlock];
                }
            });
        });
    };
    /**
     * We will validate that a nominator was actually staking with a validator for a given era
     * we will also get the exposure it had to the validator
     */
    SubstrateHistoryService.prototype.addEraExposure = function (reward) {
        return __awaiter(this, void 0, void 0, function () {
            var validatorId, era, exposureByStaker, exposure;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatorId = reward.validator.id;
                        era = reward.era;
                        return [4 /*yield*/, this.getCachedExposureByStaker(era, validatorId)];
                    case 1:
                        exposureByStaker = _a.sent();
                        exposure = exposureByStaker[reward.nominator];
                        if (!exposure)
                            this.logger.warn("No EXPOSURE traced in ".concat(reward.id));
                        reward.nominationExposure = exposureByStaker[reward.nominator];
                        return [2 /*return*/, reward];
                }
            });
        });
    };
    SubstrateHistoryService.prototype.getCachedExposureByStaker = function (era, validatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getExposureByStaker(era, validatorId)];
            });
        });
    };
    SubstrateHistoryService.prototype.getExposureByStaker = function (era, validatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.query.staking.erasStakers(era, validatorId)
                        .then(function (result) {
                        var r = {};
                        r[validatorId] = result.own.toBigInt().toString();
                        result.others.forEach(function (exposure) { return r[exposure.who] = exposure.value.toBigInt().toString(); });
                        return r;
                    })];
            });
        });
    };
    var SubstrateHistoryService_1;
    SubstrateHistoryService = SubstrateHistoryService_1 = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)('SUBSTRATE_API')),
        __param(2, (0, common_1.Inject)(common_1.CACHE_MANAGER))
    ], SubstrateHistoryService);
    return SubstrateHistoryService;
}());
exports.SubstrateHistoryService = SubstrateHistoryService;
exports.SubstrateAPIService = {
    provide: 'SUBSTRATE_API',
    useFactory: function (configService) { return __awaiter(void 0, void 0, void 0, function () {
        var endpoint, logger, wsProvider, api;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endpoint = configService.get('INDEXER_SUBSTRATE_RPC_URL');
                    logger = new common_1.Logger('SUBSTRATE_API');
                    wsProvider = new api_1.WsProvider(endpoint);
                    return [4 /*yield*/, api_1.ApiPromise.create({ provider: wsProvider })];
                case 1:
                    api = _a.sent();
                    return [4 /*yield*/, api.isReady];
                case 2:
                    _a.sent();
                    logger.log("Substrate API Ready with endpoint: ".concat(endpoint));
                    return [2 /*return*/, api];
            }
        });
    }); },
    inject: [config_1.ConfigService]
};
