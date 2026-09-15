import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export const RETENTION_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type SweepResult = {
  browserWorkspaces: number;
  workshopWorkspaces: number;
  adminSessions: number;
};

/**
 * Deletes workspaces the retention policy no longer covers (SPEC-0004/FR-009..FR-011).
 *
 * Plain setInterval rather than @nestjs/schedule: the sweep is three deleteMany calls,
 * and a public `sweep(now)` is directly unit-testable where a @Cron-decorated method is
 * not — the retention clock is the part worth testing, not the scheduling.
 *
 * Workflows go with their workspace through onDelete: Cascade.
 */
@Injectable()
export class RetentionService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RetentionService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    if (process.env.RETENTION_ENABLED === 'false') {
      this.logger.log('Retention sweep disabled by configuration.');
      return;
    }

    void this.safeSweep();
    this.timer = setInterval(() => void this.safeSweep(), SWEEP_INTERVAL_MS);
    // Never keep the process alive for a cleanup task.
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async safeSweep(): Promise<void> {
    try {
      const result = await this.sweep();
      const total =
        result.browserWorkspaces +
        result.workshopWorkspaces +
        result.adminSessions;
      if (total > 0) {
        this.logger.log(
          `Retention sweep removed ${result.browserWorkspaces} browser and ${result.workshopWorkspaces} workshop workspaces, ${result.adminSessions} expired sessions`,
        );
      }
    } catch (error) {
      // Serving must not depend on cleanup succeeding; the next tick retries.
      this.logger.error('Retention sweep failed', error);
    }
  }

  async sweep(now: Date = new Date()): Promise<SweepResult> {
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS);

    const browser = await this.prisma.workspace.deleteMany({
      where: { type: 'BROWSER', lastActiveAt: { lt: cutoff } },
    });

    // FR-009a and AC-006a read the clock differently — one from last activity, one from
    // the workshop's close. max(lastActiveAt, closedAt ?? expiresAt) + 60d satisfies both,
    // and expressed as a filter that is "inactive since the cutoff AND ended before it".
    const workshop = await this.prisma.workspace.deleteMany({
      where: {
        type: 'WORKSHOP',
        lastActiveAt: { lt: cutoff },
        workshop: {
          OR: [
            { status: 'CLOSED', closedAt: { lt: cutoff } },
            // Closed without a timestamp, or expired on its own schedule. expiresAt < cutoff
            // implies expired, since cutoff is in the past.
            { status: 'CLOSED', closedAt: null, expiresAt: { lt: cutoff } },
            { expiresAt: { lt: cutoff } },
          ],
        },
      },
    });

    // LTI workspaces are never swept (FR-009b): they hold course content whose owner is
    // the institution, not the retention policy.

    const sessions = await this.prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    return {
      browserWorkspaces: browser.count,
      workshopWorkspaces: workshop.count,
      adminSessions: sessions.count,
    };
  }
}
