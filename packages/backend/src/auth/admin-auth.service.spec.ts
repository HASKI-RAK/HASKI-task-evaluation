import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service.js';
import { AdminAuthService, sha256 } from './admin-auth.service.js';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let adminSession: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };

  beforeEach(async () => {
    adminSession = {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: PrismaService, useValue: { adminSession } },
      ],
    }).compile();

    service = module.get(AdminAuthService);
  });

  describe('issue', () => {
    // AC-001
    it('stores only hashes, never the tokens themselves', async () => {
      const { token, csrfToken } = await service.issue(new Date(0));

      const stored = adminSession.create.mock.calls[0][0].data as {
        tokenHash: string;
        csrfHash: string;
      };

      expect(stored.tokenHash).toBe(sha256(token));
      expect(stored.csrfHash).toBe(sha256(csrfToken));
      expect(JSON.stringify(stored)).not.toContain(token);
      expect(JSON.stringify(stored)).not.toContain(csrfToken);
    });

    it('issues high-entropy, distinct tokens', async () => {
      const first = await service.issue();
      const second = await service.issue();

      expect(first.token).not.toBe(second.token);
      expect(first.token).not.toBe(first.csrfToken);
      // 32 random bytes, base64url encoded.
      expect(first.token.length).toBeGreaterThanOrEqual(42);
    });

    it('sets an expiry in the future', async () => {
      const now = new Date('2026-09-15T00:00:00.000Z');
      const { expiresAt } = await service.issue(now);

      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('resolve', () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const validRow = {
      id: 'session-1',
      csrfHash: sha256('csrf'),
      expiresAt: new Date('2026-09-15T20:00:00.000Z'),
      lastSeenAt: now,
    };

    it('resolves a valid token', async () => {
      adminSession.findUnique.mockResolvedValue(validRow);

      const session = await service.resolve('a'.repeat(43), now);

      expect(session).toMatchObject({ id: 'session-1' });
      expect(adminSession.findUnique.mock.calls[0][0].where.tokenHash).toBe(
        sha256('a'.repeat(43)),
      );
    });

    // AC-003
    it('rejects an expired session', async () => {
      adminSession.findUnique.mockResolvedValue({
        ...validRow,
        expiresAt: new Date('2026-09-15T11:59:59.000Z'),
      });

      expect(await service.resolve('a'.repeat(43), now)).toBeNull();
    });

    it('rejects an unknown token', async () => {
      adminSession.findUnique.mockResolvedValue(null);

      expect(await service.resolve('a'.repeat(43), now)).toBeNull();
    });

    it('never queries for an absent or implausibly short token', async () => {
      expect(await service.resolve(undefined, now)).toBeNull();
      expect(await service.resolve('', now)).toBeNull();
      expect(await service.resolve('short', now)).toBeNull();

      expect(adminSession.findUnique).not.toHaveBeenCalled();
    });

    it('does not touch a session that was just seen', async () => {
      adminSession.findUnique.mockResolvedValue(validRow);

      await service.resolve('a'.repeat(43), now);

      expect(adminSession.updateMany).not.toHaveBeenCalled();
    });

    it('slides the expiry once the touch interval has passed', async () => {
      adminSession.findUnique.mockResolvedValue({
        ...validRow,
        lastSeenAt: new Date('2026-09-15T11:00:00.000Z'),
      });

      await service.resolve('a'.repeat(43), now);

      expect(adminSession.updateMany).toHaveBeenCalledTimes(1);
      const call = adminSession.updateMany.mock.calls[0][0] as {
        where: { lastSeenAt: { lt: Date } };
      };
      // Conditional on lastSeenAt so two concurrent requests cannot both write.
      expect(call.where.lastSeenAt.lt).toBeInstanceOf(Date);
    });
  });

  // AC-005
  describe('revoke', () => {
    it('deletes the session matching the token hash', async () => {
      await service.revoke('a'.repeat(43));

      expect(adminSession.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: sha256('a'.repeat(43)) },
      });
    });

    it('does nothing without a token', async () => {
      await service.revoke(undefined);

      expect(adminSession.deleteMany).not.toHaveBeenCalled();
    });
  });

  // AC-006
  describe('matchesCsrf', () => {
    const session = {
      id: 'session-1',
      csrfHash: sha256('correct-token'),
      expiresAt: new Date(),
    };

    it('accepts the matching token', () => {
      expect(service.matchesCsrf(session, 'correct-token')).toBe(true);
    });

    it('rejects a wrong, empty or missing token', () => {
      expect(service.matchesCsrf(session, 'wrong-token')).toBe(false);
      expect(service.matchesCsrf(session, '')).toBe(false);
      expect(service.matchesCsrf(session, undefined)).toBe(false);
    });
  });

  describe('sweepExpired', () => {
    it('deletes rows whose expiry has passed', async () => {
      adminSession.deleteMany.mockResolvedValue({ count: 3 });
      const now = new Date('2026-09-15T12:00:00.000Z');

      expect(await service.sweepExpired(now)).toBe(3);
      expect(adminSession.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lte: now } },
      });
    });
  });
});
