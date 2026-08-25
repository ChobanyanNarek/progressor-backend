/**
 * One-time backfill: populates pm_tracker_task from every existing user's
 * pm_tracker_state.data.tasks blob. Run once after migration
 * 1785000000000-AddPmTrackerTask lands, before Search/Release-Notes traffic
 * switches to reading from the new table.
 *
 * Idempotent — upserts on (user_id, client_id), safe to re-run if it's
 * interrupted or if you want to re-sync after fixing a bug in the mapping.
 *
 * Usage: pnpm exec ts-node scripts/backfill-pm-tracker-tasks.ts
 * (reads DB_* env vars the same way ormconfig.ts does — run with the same
 * .env as the app, against the target environment's database)
 */
import '../src/boilerplate.polyfill.ts';

import { dataSource } from '../ormconfig.ts';
import { PmTrackerTaskEntity } from '../src/modules/pm-tracker/entities/pm-tracker-task.entity.ts';
import { PmTrackerStateEntity } from '../src/modules/pm-tracker/pm-tracker-state.entity.ts';
import { syncTasksFromState } from '../src/modules/pm-tracker/commands/sync-tasks/sync-tasks-from-state.ts';

async function main() {
  await dataSource.initialize();

  const stateRepo = dataSource.getRepository(PmTrackerStateEntity);
  const taskRepo = dataSource.getRepository(PmTrackerTaskEntity);

  const states = await stateRepo
    .createQueryBuilder('s')
    .where('s.user_id IS NOT NULL')
    .getMany();

  console.log(`Backfilling tasks for ${states.length} user(s)...`);

  let ok = 0;
  let failed = 0;

  for (const state of states) {
    try {
      await syncTasksFromState(taskRepo, state.userId!, state.data);
      ok++;
    } catch (error) {
      failed++;
      console.error(`Failed for user ${state.userId}:`, error);
    }
  }

  console.log(`Done. ${ok} succeeded, ${failed} failed.`);

  await dataSource.destroy();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Backfill script crashed:', error);
  process.exit(1);
});
