import type { Response } from 'express';
import type { ResolvedWorkspace } from '../workspace/workspace.service.js';
import { WorkflowController } from './workflow.controller.js';
import { WorkflowService } from './workflow.service.js';

const workspace: ResolvedWorkspace = {
  id: 'ws-a',
  type: 'BROWSER',
  label: null,
  workshopId: null,
};

const summary = {
  id: 'wf-1',
  name: 'Rubric assessment',
  slug: 'rubric-assessment',
  version: 5,
  createdAt: new Date('2026-09-15T10:00:00.000Z'),
  updatedAt: new Date('2026-09-15T11:00:00.000Z'),
  publishedVersion: null,
  publishedAt: null,
  sourceTemplateId: null,
  sourceTemplateRevisionId: null,
};

describe('WorkflowController', () => {
  const build = () => {
    const workflows = {
      list: jest.fn().mockResolvedValue([summary]),
      get: jest.fn().mockResolvedValue({ ...summary, content: '{}' }),
      create: jest.fn().mockResolvedValue({ ...summary, content: '{}' }),
      update: jest.fn().mockResolvedValue(summary),
      publish: jest.fn().mockResolvedValue(summary),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const response = { setHeader: jest.fn() } as unknown as Response;
    const controller = new WorkflowController(
      workflows as unknown as WorkflowService,
    );
    return { controller, workflows, response };
  };

  it('returns the version as an ETag on read', async () => {
    const { controller, response } = build();

    await controller.get(workspace, 'wf-1', response);

    expect(response.setHeader).toHaveBeenCalledWith('ETag', 'W/"5"');
  });

  it('serializes dates as ISO strings', async () => {
    const { controller } = build();

    const result = await controller.list(workspace);

    expect(result.workflows[0].updatedAt).toBe('2026-09-15T11:00:00.000Z');
  });

  describe('update', () => {
    it('requires If-Match rather than assuming an overwrite', async () => {
      const { controller, workflows, response } = build();

      await expect(
        controller.update(workspace, 'wf-1', { content: '{}' }, undefined, response),
      ).rejects.toMatchObject({ status: 428 });
      expect(workflows.update).not.toHaveBeenCalled();
    });

    it('rejects a malformed If-Match as a bad request', async () => {
      const { controller, workflows, response } = build();

      await expect(
        controller.update(workspace, 'wf-1', { content: '{}' }, 'garbage', response),
      ).rejects.toMatchObject({ status: 400 });
      expect(workflows.update).not.toHaveBeenCalled();
    });

    it('rejects an empty patch', async () => {
      const { controller, workflows, response } = build();

      await expect(
        controller.update(workspace, 'wf-1', {}, 'W/"4"', response),
      ).rejects.toMatchObject({ status: 400 });
      expect(workflows.update).not.toHaveBeenCalled();
    });

    it('passes the parsed precondition through and returns the new ETag', async () => {
      const { controller, workflows, response } = build();

      const result = await controller.update(
        workspace,
        'wf-1',
        { content: '{}' },
        'W/"4"',
        response,
      );

      expect(workflows.update).toHaveBeenCalledWith(
        'ws-a',
        'wf-1',
        { kind: 'versions', versions: [4] },
        { content: '{}' },
      );
      expect(response.setHeader).toHaveBeenCalledWith('ETag', 'W/"5"');
      // The caller just sent the content; echoing a workflow back doubles the transfer.
      expect(result).not.toHaveProperty('content');
    });
  });
});
