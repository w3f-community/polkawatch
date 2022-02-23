"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.ArchiveService = void 0;
var common_1 = require("@nestjs/common");
var core_1 = require("@urql/core");
var cross_fetch_1 = require("cross-fetch");
/**
 * This Service access Polkawatch Archive GraphQL end point
 * through its query endpoints.
 *
 * Its main responsibility is to query all reward events in batches.
 *
 * Will also handle some edge cases in which heartbeats could not be
 * traced during the 1-pass archive process. The main reason is that
 * when you start mid-chain, there have been no heartbeats prior to the
 * very first rewards events. In those case Heartbeats are looked forward
 * and tagged as such.
 *
 */
var ArchiveService = /** @class */ (function () {
    function ArchiveService(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ArchiveService_1.name);
        var host = configService.get('INDEXER_ARCHIVE_HOST');
        var port = configService.get('INDEXER_ARCHIVE_PORT');
        this.client = (0, core_1.createClient)({
            url: "http://".concat(host, ":").concat(port, "/graphql"),
            fetch: cross_fetch_1.fetch,
            requestPolicy: 'network-only'
        });
        this.cachedClient = (0, core_1.createClient)({
            url: "http://".concat(host, ":").concat(port, "/graphql"),
            fetch: cross_fetch_1.fetch,
            requestPolicy: 'cache-first'
        });
    }
    ArchiveService_1 = ArchiveService;
    ArchiveService.prototype.query = function (query, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client.query(query, params).toPromise()];
            });
        });
    };
    ArchiveService.prototype.cachedQuery = function (query, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.cachedClient.query(query, params).toPromise()];
            });
        });
    };
    ArchiveService.prototype.queryRewards = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.query(REWARDS_QUERY, params)];
            });
        });
    };
    /**
   *
   * When the reward record has no heartbeat information we will get it falling
   * back to peer-id resolution.
   *
   * We will use the validator ID to find out the peers that run that validator
   * and we will return the last heartbeat received form any of the peers.
   *
   * Will also handle the case in which heartbeats were not found at all.
   * Data is tagged accordingly in all cases.
   *
   * @param reward
   */
    ArchiveService.prototype.traceLastHeartbeat = function (reward) {
        return __awaiter(this, void 0, void 0, function () {
            var trace, peers, lhb;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trace = 'session';
                        if (!!reward.previousHeartbeat) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getPeersByValidatorId(reward.validator.id)];
                    case 1:
                        peers = _a.sent();
                        if (!peers) return [3 /*break*/, 5];
                        trace = 'peer_prev';
                        return [4 /*yield*/, this.getLastHeartbeatsByPeers(reward.blockNumber, peers)];
                    case 2:
                        lhb = _a.sent();
                        if (!!lhb.length) return [3 /*break*/, 4];
                        trace = 'peer_post';
                        return [4 /*yield*/, this.getFirstHeartbeatsByPeers(peers)];
                    case 3:
                        lhb = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!lhb.length)
                            trace = 'missing';
                        else
                            reward.previousHeartbeat = lhb[0];
                        _a.label = 5;
                    case 5:
                        reward.previousHeartbeatTrace = trace;
                        _a.label = 6;
                    case 6:
                        this.logger.debug("Reward ".concat(reward.id, " by validator ").concat(reward.validator.id, " traced to Heartbeat by ").concat(trace, "."));
                        return [2 /*return*/, reward];
                }
            });
        });
    };
    ArchiveService.prototype.getPeersByValidatorId = function (validatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.cachedQuery(PEERS_BY_VALIDATOR_ID_QUERY, {
                        validatorId: validatorId
                    }).then(function (results) { return results.data.peers.nodes.map(function (peer) { return peer.id; }); })];
            });
        });
    };
    ArchiveService.prototype.getLastHeartbeatsByPeers = function (blockNumberLimit, peers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.cachedQuery(LAST_HEARTBEAT_BY_PEERS_QUERY, {
                        blockNumberLimit: blockNumberLimit,
                        peers: peers
                    }).then(function (results) { return results.data.heartbeats.nodes; })];
            });
        });
    };
    ArchiveService.prototype.getFirstHeartbeatsByPeers = function (peers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.cachedQuery(FIRST_HEARTBEAT_BY_PEERS_QUERY, {
                        peers: peers
                    }).then(function (results) { return results.data.heartbeats.nodes; })];
            });
        });
    };
    var ArchiveService_1;
    ArchiveService = ArchiveService_1 = __decorate([
        (0, common_1.Injectable)()
    ], ArchiveService);
    return ArchiveService;
}());
exports.ArchiveService = ArchiveService;
// TODO: starting block, will try to query inside history_depth
var REWARDS_QUERY = (0, core_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  query ($batchSize: Int!, $cursor: Cursor, $startBlockNumber: BigFloat) {\n    rewards(\n      first: $batchSize, \n      after: $cursor\n      filter: {\n        blockNumber: { greaterThan: $startBlockNumber }\n      }\n    ) {\n      edges {\n        cursor\n        node {\n          id\n          era\n          blockNumber\n          newReward\n          nominator\n          validator {\n            id\n            lastPeerId\n          }\n          payout {\n            id\n          }\n          previousHeartbeat {\n            id\n            externalAddresses\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n      }\n    }\n  }\n"], ["\n  query ($batchSize: Int!, $cursor: Cursor, $startBlockNumber: BigFloat) {\n    rewards(\n      first: $batchSize, \n      after: $cursor\n      filter: {\n        blockNumber: { greaterThan: $startBlockNumber }\n      }\n    ) {\n      edges {\n        cursor\n        node {\n          id\n          era\n          blockNumber\n          newReward\n          nominator\n          validator {\n            id\n            lastPeerId\n          }\n          payout {\n            id\n          }\n          previousHeartbeat {\n            id\n            externalAddresses\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n      }\n    }\n  }\n"])));
var LAST_HEARTBEAT_BY_PEERS_QUERY = (0, core_1.gql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  query ($blockNumberLimit: BigFloat!, $peers: [String!]) {\n    heartbeats(\n      last: 1\n      filter: {\n        blockNumber: { lessThan: $blockNumberLimit }\n        peerId: { in: $peers }\n      }\n    ) {\n      nodes {\n        id\n        peerId\n        externalAddresses\n      }\n    }\n  }\n"], ["\n  query ($blockNumberLimit: BigFloat!, $peers: [String!]) {\n    heartbeats(\n      last: 1\n      filter: {\n        blockNumber: { lessThan: $blockNumberLimit }\n        peerId: { in: $peers }\n      }\n    ) {\n      nodes {\n        id\n        peerId\n        externalAddresses\n      }\n    }\n  }\n"])));
var FIRST_HEARTBEAT_BY_PEERS_QUERY = (0, core_1.gql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  query ($peers: [String!]) {\n    heartbeats(first: 1, filter: { peerId: { in: $peers } }) {\n      nodes {\n        id\n        peerId\n        externalAddresses\n      }\n    }\n  }\n"], ["\n  query ($peers: [String!]) {\n    heartbeats(first: 1, filter: { peerId: { in: $peers } }) {\n      nodes {\n        id\n        peerId\n        externalAddresses\n      }\n    }\n  }\n"])));
var PEERS_BY_VALIDATOR_ID_QUERY = (0, core_1.gql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n  query ($validatorId: String!) {\n    peers(filter: { validatorId: { equalTo: $validatorId } }) {\n      nodes {\n        id\n        validatorId\n      }\n    }\n  }\n"], ["\n  query ($validatorId: String!) {\n    peers(filter: { validatorId: { equalTo: $validatorId } }) {\n      nodes {\n        id\n        validatorId\n      }\n    }\n  }\n"])));
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
