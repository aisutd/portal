import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the real server action with an isolated database and authenticated user.
function setup(role: string | null) {
  const events = [
    { id: "a", isArchived: false, isPublished: true, description: "preserved", rsvps: ["rsvp"] },
    { id: "b", isArchived: false, isPublished: false, description: "also preserved", rsvps: [] },
  ];
  const deleted: string[] = [];
  const revalidated: string[] = [];
  const source = readFileSync(new URL("../../app/admin/events/bulk-actions.ts", import.meta.url), "utf8");
  const rolesSource = readFileSync(new URL("../roles.ts", import.meta.url), "utf8");
  const compile = (source: string) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const roles: Record<string, unknown> = {};
  new Function("exports", "require", compile(rolesSource))(roles, () => ({}));
  const dependencies: Record<string, unknown> = {
    "next/cache": { revalidatePath: (path: string) => revalidated.push(path) },
    "@/lib/auth": { getAuthenticatedUser: async () => role ? { role } : null },
    "@/lib/roles": roles,
    "@/lib/admin/delete-events": { deleteEventRecords: async (ids: string[]) => deleted.push(...ids) },
    "@/lib/prisma": { prisma: {
      event: {
        findMany: async ({ where }: { where: { id: { in: string[] }; isArchived: boolean } }) => events.filter((e) => where.id.in.includes(e.id) && e.isArchived === where.isArchived),
        updateMany: async ({ where, data }: { where: { id: { in: string[] }; isArchived: boolean }; data: { isArchived?: boolean; isPublished?: boolean } }) => { for (const e of events) if (where.id.in.includes(e.id) && e.isArchived === where.isArchived) Object.assign(e, data); },
      },
    } },
  };
  const exports: { manageEvents?: (ids: string[], action: string, archived?: boolean) => Promise<void> } = {};
  new Function("exports", "require", compile(source))(exports, (name: string) => dependencies[name]);
  return { manage: exports.manageEvents!, events, deleted, revalidated };
}

for (const role of ["DIRECTOR", "EXECUTIVE"]) {
  test(`${role} archives and restores multiple events without losing data`, async () => {
    const { manage, events, revalidated } = setup(role);
    await manage(["a", "b"], "archive");
    assert.ok(events.every((e) => e.isArchived && !e.isPublished));
    await manage(["a", "b"], "restore", true);
    assert.ok(events.every((e) => !e.isArchived && !e.isPublished));
    assert.equal(events[0].description, "preserved");
    assert.deepEqual(events[0].rsvps, ["rsvp"]);
    assert.ok(revalidated.includes("/admin/events"));
  });
  test(`${role} bulk publishes, unpublishes and deletes only selected records`, async () => {
    const { manage, events, deleted } = setup(role);
    await manage(["a", "b"], "publish");
    assert.ok(events.every((e) => e.isPublished));
    await manage(["a", "b"], "unpublish");
    assert.ok(events.every((e) => !e.isPublished));
    await manage(["a", "a", "b"], "delete");
    assert.deepEqual(deleted, ["a", "b"]);
  });
}
for (const role of ["OFFICER", "MEMBER", null]) {
  test(`${role} cannot invoke any bulk or archived action`, async () => {
    const { manage, events, deleted } = setup(role);
    for (const action of ["archive", "delete", "publish", "unpublish", "restore"]) {
      await assert.rejects(manage(["a", "b"], action, action === "restore"), /Unauthorized/);
    }
    assert.equal(events[0].isPublished, true);
    assert.deepEqual(deleted, []);
  });
}
test("invalid, missing and archived selections cannot be published", async () => {
  const { manage, events } = setup("DIRECTOR");
  await assert.rejects(manage([], "archive"));
  await assert.rejects(manage(["missing"], "delete"));
  await assert.rejects(manage(["a"], "restore"));
  await manage(["a"], "archive");
  await assert.rejects(manage(["a"], "publish"));
  await assert.rejects(manage(["a"], "publish", true));
  assert.equal(events[0].isPublished, false);
});
