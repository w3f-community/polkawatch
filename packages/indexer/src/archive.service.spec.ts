import { Test, TestingModule } from '@nestjs/testing';
import { ArchiveService } from './archive.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

describe('ArchiveService', () => {
  let archive: ArchiveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: Joi.object({
            INDEXER_ARCHIVE_HOST: Joi.string().default('localhost'),
            INDEXER_ARCHIVE_PORT: Joi.number().default(3000),
          }),
        }),
      ],
      providers: [ArchiveService],
    }).compile();

    archive = module.get<ArchiveService>(ArchiveService);
  });

  it('should be defined', () => {
    expect(archive).toBeDefined();
  });

  it('should be able to trace heartbeats in the past when missing', async () => {
    // Peer ID found for a validator
    jest
      .spyOn(archive, 'getPeersByValidatorId')
      .mockImplementation(async () => [
        {
          id: 'PEER-1',
        },
      ]);
    // Prior HBs found!
    jest
      .spyOn(archive, 'getLastHeartbeatsByPeers')
      .mockImplementation(async () => [
        {
          id: 'HB-1',
        },
      ]);
    return archive
      .traceLastHeartbeat({
        id: 'RW-1',
        validator: {
          id: 'VAL-1',
        },
      })
      .then((result) => {
        expect(result.previousHeartbeatTrace).toBe('peer_prev');
      });
  });

  it('should be able to trace heartbeats in the future when missing', async () => {
    // Peers IDs found for validator
    jest
      .spyOn(archive, 'getPeersByValidatorId')
      .mockImplementation(async () => [
        {
          id: 'PEER-1',
        },
      ]);
    // No LHBs found looking back
    jest
      .spyOn(archive, 'getLastHeartbeatsByPeers')
      .mockImplementation(async () => []);
    // There is a first ever HB found, post reward
    jest
      .spyOn(archive, 'getFirstHeartbeatsByPeers')
      .mockImplementation(async () => [
        {
          id: 'HB-1',
        },
      ]);
    return archive
      .traceLastHeartbeat({
        id: 'RW-1',
        validator: {
          id: 'VAL-1',
        },
      })
      .then((result) => {
        expect(result.previousHeartbeatTrace).toBe('peer_post');
      });
  });

  it('should be able to handle missing traces', async () => {
    // Peers IDs found for validator
    jest
      .spyOn(archive, 'getPeersByValidatorId')
      .mockImplementation(async () => [
        {
          id: 'PEER-1',
        },
      ]);
    // No LHBs found looking back
    jest
      .spyOn(archive, 'getLastHeartbeatsByPeers')
      .mockImplementation(async () => []);
    // There is NO first ever HB found, post reward
    jest
      .spyOn(archive, 'getFirstHeartbeatsByPeers')
      .mockImplementation(async () => []);
    return archive
      .traceLastHeartbeat({
        id: 'RW-1',
        validator: {
          id: 'VAL-1',
        },
      })
      .then((result) => {
        expect(result.previousHeartbeatTrace).toBe('missing');
      });
  });
});
