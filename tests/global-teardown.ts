// tests/global-teardown.ts
//
// Runs once after the entire test run completes. Purges all @example.test
// users created by any spec. Centralizing cleanup here (instead of a per-spec
// afterAll) avoids races where one spec's purge-all deletes a fixture user
// another spec is still using under parallel execution.

import { deleteTestUsers } from './helpers/cleanup';

export default async function globalTeardown(): Promise<void> {
  await deleteTestUsers();
}
