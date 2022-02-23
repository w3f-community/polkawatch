"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.IndexerSchedulerService = void 0;
var common_1 = require("@nestjs/common");
var schedule_1 = require("@nestjs/schedule");
/**
 * This is the main entrypoin of Polkawatch second pass indexing
 * It is scheduled as it depends on live data
 *
 */
var IndexerSchedulerService = /** @class */ (function () {
    function IndexerSchedulerService(archiveService, substrateHistory) {
        this.archiveService = archiveService;
        this.substrateHistory = substrateHistory;
        this.logger = new common_1.Logger(IndexerSchedulerService_1.name);
        // ignore
    }
    IndexerSchedulerService_1 = IndexerSchedulerService;
    IndexerSchedulerService.prototype.processRewardsDaily = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rewardProcessing()];
            });
        });
    };
    IndexerSchedulerService.prototype.processRewardsOnStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rewardProcessing()];
            });
        });
    };
    IndexerSchedulerService.prototype.rewardProcessing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var qr, total, startBlockNumber;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qr = { hasNext: true, cursor: undefined };
                        total = 0;
                        this.logger.log('Starting Rewards Processing');
                        return [4 /*yield*/, this.substrateHistory.historyDepthStartBlock()];
                    case 1:
                        startBlockNumber = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!qr.hasNext) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.archiveService
                                .queryRewards({ batchSize: 100, cursor: qr.cursor, startBlockNumber: startBlockNumber })
                                .then(function (results) {
                                return Promise.all([
                                    Promise.resolve({
                                        hasNext: results.data.rewards.pageInfo.hasNextPage,
                                        cursor: results.data.rewards.edges[results.data.rewards.edges.length - 1].cursor
                                    }),
                                    Promise.all(results.data.rewards.edges.map(function (reward) {
                                        return _this.processReward(reward.node);
                                    })),
                                ]);
                            })
                                .then(function (result) {
                                // We compute the number of records
                                total += result[1].length;
                                _this.logger.debug("processing rewards ".concat(total, " so far, last: ").concat(result[1][result[1].length - 1].id));
                                return result[0];
                            })];
                    case 3:
                        // We will run the query in batches
                        // Each batch will be processed asynchronously
                        // Return Query Status, and the results of processing all reward events
                        qr = _a.sent();
                        return [3 /*break*/, 2];
                    case 4:
                        this.logger.log("".concat(total, " rewards processed"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
   * Processes a Reward event asynchronously
   * @param reward
   */
    IndexerSchedulerService.prototype.processReward = function (reward) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // this.logger.debug(reward);
                return [2 /*return*/, this.archiveService.traceLastHeartbeat(reward)
                        .then(function (reward) { return _this.substrateHistory.addEraExposure(reward); })];
            });
        });
    };
    var IndexerSchedulerService_1;
    __decorate([
        (0, schedule_1.Cron)('0 0 3 * * *')
    ], IndexerSchedulerService.prototype, "processRewardsDaily");
    __decorate([
        (0, schedule_1.Timeout)(2000)
    ], IndexerSchedulerService.prototype, "processRewardsOnStart");
    IndexerSchedulerService = IndexerSchedulerService_1 = __decorate([
        (0, common_1.Injectable)()
    ], IndexerSchedulerService);
    return IndexerSchedulerService;
}());
exports.IndexerSchedulerService = IndexerSchedulerService;
