import { beforeEach, describe, expect, it, vi } from 'vitest';

const groupHttpClientMocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/http/domain-clients', () => ({
  getGroupHttpClient: () => ({
    delete: groupHttpClientMocks.deleteMock,
    get: groupHttpClientMocks.getMock,
    post: groupHttpClientMocks.postMock,
    put: groupHttpClientMocks.putMock,
  }),
}));

describe('GroupService', () => {
  beforeEach(() => {
    vi.resetModules();
    groupHttpClientMocks.deleteMock.mockReset();
    groupHttpClientMocks.getMock.mockReset();
    groupHttpClientMocks.postMock.mockReset();
    groupHttpClientMocks.putMock.mockReset();
  });

  it('loads groups from the API client', async () => {
    const groups = [
      {
        id: 'group-1',
        name: 'Brigadeiros',
        description: 'Receitas de brigadeiro e doces similares.',
      },
      {
        id: 'group-2',
        name: 'Bolos',
        description: 'Massas, recheios e coberturas para bolos.',
      },
    ];
    groupHttpClientMocks.getMock.mockResolvedValue({ data: groups });
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await expect(GroupService.getAllGroups()).resolves.toEqual(groups);
    expect(groupHttpClientMocks.getMock).toHaveBeenCalledWith('/');
  });

  it('creates, updates and deletes groups through the API client', async () => {
    const payload = {
      name: 'Doces finos',
      description: 'Linha premium para eventos.',
    };
    const response = { data: { id: 'group-3', ...payload } };
    groupHttpClientMocks.postMock.mockResolvedValue(response);
    groupHttpClientMocks.putMock.mockResolvedValue(response);
    groupHttpClientMocks.deleteMock.mockResolvedValue(undefined);
    const { GroupService } = await import('../../src/renderer/services/group-service');

    await expect(GroupService.createGroup(payload)).resolves.toEqual(response.data);
    await expect(GroupService.updateGroup('group-3', payload)).resolves.toEqual(response.data);
    await expect(GroupService.deleteGroup('group-3')).resolves.toBeUndefined();

    expect(groupHttpClientMocks.postMock).toHaveBeenCalledWith('/', payload);
    expect(groupHttpClientMocks.putMock).toHaveBeenCalledWith('/group-3', payload);
    expect(groupHttpClientMocks.deleteMock).toHaveBeenCalledWith('/group-3');
  });
});
