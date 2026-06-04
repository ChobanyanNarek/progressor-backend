import { jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { CreateMemoryPointCommand } from './create-memory-point.command.ts';
import { CreateMemoryPointHandler } from './create-memory-point.handler.ts';

describe('CreateMemoryPointHandler', () => {
  let handler: CreateMemoryPointHandler;
  let insertExecute: jest.Mock;
  let setParameters: jest.Mock;
  let values: jest.Mock;
  let into: jest.Mock;
  let insert: jest.Mock;
  let createQueryBuilder: jest.Mock;
  let findOneOrFail: jest.Mock;
  let repository: {
    createQueryBuilder: jest.Mock;
    findOneOrFail: jest.Mock;
  };

  const userId = 'user-1' as Uuid;
  const pointId = 'point-1' as Uuid;

  beforeEach(() => {
    insertExecute = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ identifiers: [{ id: pointId }] });
    setParameters = jest.fn().mockReturnValue({ execute: insertExecute });
    values = jest.fn().mockReturnValue({ setParameters });
    into = jest.fn().mockReturnValue({ values });
    insert = jest.fn().mockReturnValue({ into });
    createQueryBuilder = jest.fn().mockReturnValue({ insert });

    findOneOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: pointId,
      status: MemoryPointStatus.PENDING,
      toDto: () => ({ id: pointId, status: MemoryPointStatus.PENDING }),
    });

    repository = { createQueryBuilder, findOneOrFail };

    handler = new CreateMemoryPointHandler(repository as never);
  });

  it('inserts a PENDING memory point with the PostGIS point and returns its DTO', async () => {
    const command = new CreateMemoryPointCommand(userId, {
      latitude: 40.1872,
      longitude: 44.5152,
    });

    const result = await handler.execute(command);

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        status: MemoryPointStatus.PENDING,
        location: expect.any(Function),
      }),
    );
    expect(setParameters).toHaveBeenCalledWith({
      longitude: 44.5152,
      latitude: 40.1872,
    });
    expect(findOneOrFail).toHaveBeenCalledWith({ where: { id: pointId } });
    expect(result).toEqual({ id: pointId, status: MemoryPointStatus.PENDING });
  });

  it('builds the location as a ST_SetSRID/ST_MakePoint expression', async () => {
    await handler.execute(
      new CreateMemoryPointCommand(userId, { latitude: 1, longitude: 2 }),
    );

    const passedValues = values.mock.calls[0]![0] as {
      location: () => string;
    };

    expect(passedValues.location()).toContain('ST_SetSRID');
    expect(passedValues.location()).toContain('ST_MakePoint');
  });
});
