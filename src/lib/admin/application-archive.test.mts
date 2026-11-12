import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { z } from "zod";

// Run the real actions and handlers against isolated authentication/database dependencies.
function loadModule<T = Record<string, unknown>>(path: string, dependencies: Record<string, unknown> = {}): T {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("exports", "require", compiled)(exports, (name: string) => {
    assert.ok(name in dependencies, `Missing test dependency: ${name}`);
    return dependencies[name];
  });
  return exports as T;
}

type Handlers = Record<string, (request?: Request, context?: { params: Promise<{ id: string }> }) => Promise<Response>>;

const roles = loadModule("../roles.ts");
const apiError = {
  createErrorResponse: (message: string, code: string, status: number) => Response.json({ error: { message, code } }, { status }),
};

function setup(role: string | null) {
  const applications = [
    { id: "a", isArchived: false, visibleToUsers: true, questions: ["question"], drafts: ["draft"], submissions: [{ status: "ACCEPTED", reviews: ["review"] }] },
    { id: "b", isArchived: false, visibleToUsers: false, questions: [], drafts: [], submissions: [] },
  ];
  const revalidated: string[] = [];
  let mutations = 0;
  const { manageApplicationArchive } = loadModule<{ manageApplicationArchive: (ids: unknown, action: unknown) => Promise<void> }>("../../app/admin/applications/archive-actions.ts", {
    "next/cache": { revalidatePath: (path: string) => revalidated.push(path) },
    "@/lib/auth": { getAuthenticatedUser: async () => role ? { role } : null },
    "@/lib/roles": roles,
    "@/lib/prisma": { prisma: {
      $transaction: async (run: (tx: unknown) => Promise<void>) => {
        const before = structuredClone(applications);
        try {
          await run({ programApplication: {
            updateMany: async ({ where, data }: { where: { id: { in: string[] }; isArchived: boolean }; data: object }) => {
              mutations++;
              const matched = applications.filter((app) => where.id.in.includes(app.id) && app.isArchived === where.isArchived);
              matched.forEach((app) => Object.assign(app, data));
              return { count: matched.length };
            },
          } });
        } catch (error) {
          applications.splice(0, applications.length, ...before);
          throw error;
        }
      },
    } },
  });
  return { manage: manageApplicationArchive, applications, revalidated, mutations: () => mutations };
}

for (const role of ["DIRECTOR", "EXECUTIVE"]) {
  test(`${role} bulk archives/restores applications while preserving all applicant data`, async () => {
    const { manage, applications, revalidated } = setup(role);
    const original = structuredClone(applications);
    await manage(["a", "a", "b"], "archive");
    assert.ok(applications.every((app) => app.isArchived && !app.visibleToUsers));
    await manage(["a", "b"], "restore");
    assert.deepEqual(applications, original.map((app) => ({ ...app, visibleToUsers: false })));
    assert.ok(revalidated.includes("/admin/applications"));
    assert.ok(revalidated.includes("/applications"));
  });
}

for (const role of ["OFFICER", "MEMBER", null]) {
  test(`${role} cannot archive or restore even with a direct action call`, async () => {
    const { manage, mutations } = setup(role);
    await assert.rejects(manage(["a"], "archive"), /Unauthorized/);
    await assert.rejects(manage(["a"], "restore"), /Unauthorized/);
    assert.equal(mutations(), 0);
  });
}

test("invalid actions and selections cannot mutate applications", async () => {
  const { manage, mutations } = setup("DIRECTOR");
  for (const ids of [null, "a", [], [""], [null], [1]]) {
    await assert.rejects(manage(ids, "archive"), /Select applications/);
  }
  for (const action of ["publish", "delete", "", null]) {
    await assert.rejects(manage(["a"], action), /Invalid application action/);
  }
  assert.equal(mutations(), 0);
});

test("missing or stale selections roll back the entire batch", async () => {
  const { manage, applications, revalidated } = setup("DIRECTOR");
  await assert.rejects(manage(["a", "missing"], "archive"), /Applications have changed/);
  assert.equal(applications[0].isArchived, false);
  assert.deepEqual(revalidated, []);
  await manage(["a"], "archive");
  await assert.rejects(manage(["a", "b"], "restore"), /Applications have changed/);
  assert.equal(applications[0].isArchived, true);
  assert.equal(applications[1].isArchived, false);
});

function publicDependencies() {
  const queries: Array<{ isArchived?: boolean }> = [];
  const findApplication = async ({ where }: { where: { isArchived?: boolean } }) => {
    queries.push(where);
    // The only application in this isolated database is archived.
    return where.isArchived === false ? null : { id: "a", visibleToUsers: false, isArchived: true };
  };
  return {
    queries,
    dependencies: {
      "next/server": { NextResponse: Response },
      "@/lib/api-error": apiError,
      "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk-user" }) },
      "@prisma/client": { ProgramType: {}, Prisma: {}, ApplicationStatus: {} },
      "@/lib/application-form": {},
      "@/lib/emails/submit-application": {},
      "@/lib/auth": { getAuthenticatedUser: async () => ({ id: "user" }) },
      "@/lib/r2": { putObjectToR2: () => assert.fail("Archived applications cannot accept uploads") },
      "@/lib/prisma": { prisma: {
        user: { findUnique: async () => ({ id: "user" }) },
        programApplication: { findUnique: findApplication, findFirst: findApplication },
        applicationDraft: { findUnique: async () => ({ formPayloadJson: { answer: "preserved" } }) },
        applicationSubmission: { findFirst: async () => null },
      } },
    },
  };
}

for (const [path, method] of [
  ["[id]/route.ts", "GET"],
  ["[id]/draft/route.ts", "GET"],
  ["[id]/draft/route.ts", "PUT"],
  ["[id]/submit/route.ts", "POST"],
  ["[id]/upload/route.ts", "POST"],
]) {
  test(`archived applications reject public ${method} ${path}`, async () => {
    const { dependencies, queries } = publicDependencies();
    const route = loadModule<Handlers>(`../../app/api/applications/${path}`, dependencies);
    const request = new Request("https://portal.test/api/applications/a", {
      method,
      ...(method === "PUT" ? { body: JSON.stringify({ stepIndex: 1, formPayloadJson: {} }) } : {}),
    });
    const result = await route[method](request, { params: Promise.resolve({ id: "a" }) });
    assert.equal(result.status, 404);
    assert.equal(queries[0].isArchived, false);
  });
}

for (const role of ["OFFICER", "MEMBER", "DIRECTOR", "EXECUTIVE"]) {
  test(`archived application list visibility respects the ${role} role`, async () => {
    const { dependencies } = publicDependencies();
    let archiveFilter: boolean | undefined;
    const route = loadModule<Handlers>("../../app/api/admin/applications/route.ts", {
      ...dependencies,
      "@/lib/roles": roles,
      "@/lib/audit": {},
      "@/lib/admin-app-auth": { getApplicationReviewer: async () => ({ user: { role }, allowedProgramTypes: null }) },
      "@/lib/prisma": { prisma: { programApplication: {
        findMany: async ({ where }: { where: { isArchived?: boolean } }) => { archiveFilter = where.isArchived; return []; },
      } } },
    });
    assert.equal((await route.GET()).status, 200);
    assert.equal(archiveFilter, role === "DIRECTOR" || role === "EXECUTIVE" ? undefined : false);
  });
}

test("the public application list excludes archived postings", async () => {
  const { dependencies } = publicDependencies();
  let archiveFilter: boolean | undefined;
  const route = loadModule<Handlers>("../../app/api/applications/route.ts", {
    ...dependencies,
    "@/lib/prisma": { prisma: {
      user: { findUnique: async () => ({ id: "user" }) },
      programApplication: { findMany: async ({ where }: { where: { isArchived?: boolean } }) => { archiveFilter = where.isArchived; return []; } },
      applicationDraft: { findMany: async () => [] },
      applicationSubmission: { findMany: async () => [] },
    } },
  });
  assert.equal((await route.GET()).status, 200);
  assert.equal(archiveFilter, false);
});

for (const role of ["OFFICER", "MEMBER", "DIRECTOR", "EXECUTIVE"]) {
  for (const path of ["[id]/route.ts", "[id]/export/route.ts", "[id]/submissions/[submissionId]/resume/route.ts"]) {
    test(`${role} archive access is enforced by ${path}`, async () => {
      const { dependencies } = publicDependencies();
      const application = { id: "a", isArchived: true, programType: "AI_MENTORSHIP_MENTEE", submissions: [], title: "Archived", questionsJson: [] };
      const route = loadModule<Handlers>(`../../app/api/admin/applications/${path}`, {
        ...dependencies,
        zod: { z },
        "@/lib/roles": roles,
        "@/lib/admin-app-auth": {
          getApplicationReviewer: async () => ({ user: { id: "user", role }, allowedProgramTypes: null }),
          postingOutOfScopeResponse: () => Response.json({ error: "Not found" }, { status: 404 }),
        },
        "@/lib/prisma": { prisma: {
          programApplication: { findUnique: async () => application },
          applicationSubmission: { findUnique: async () => ({ application, formPayloadJson: { Resume: "https://portal.test/resume.pdf" } }) },
        } },
        "next/server": { NextResponse: class extends Response {
          static redirect(url: string) { return Response.redirect(url); }
        } },
      });
      const request = new Request('https://portal.test/api/admin/applications/a?fields=["user.email"]');
      const response = await route.GET(request, { params: Promise.resolve({ id: "a", submissionId: "submission" }) });
      assert.equal(response.status, role === "DIRECTOR" || role === "EXECUTIVE" ? path.includes("resume/") ? 302 : 200 : 404);
    });
  }
}

test("archived applications cannot be edited or republished through PATCH", async () => {
  const { dependencies } = publicDependencies();
  const route = loadModule<Handlers>("../../app/api/admin/applications/[id]/route.ts", {
    ...dependencies,
    zod: { z },
    "@/lib/roles": roles,
    "@/lib/admin-app-auth": { getAdminUser: async () => ({ user: { role: "DIRECTOR" } }) },
    "@/lib/prisma": { prisma: { programApplication: {
      findUnique: async () => ({ isArchived: true }),
      update: () => assert.fail("Archived application must stay hidden"),
    } } },
  });
  const response = await route.PATCH(new Request("https://portal.test/api/admin/applications/a", {
    method: "PATCH", body: JSON.stringify({ visibleToUsers: true }),
  }), { params: Promise.resolve({ id: "a" }) });
  assert.equal(response.status, 409);
});

for (const role of ["MEMBER", "OFFICER", "DIRECTOR", "EXECUTIVE"]) {
  test(`${role} cannot change reviews or decisions while an application is archived`, async () => {
    const { dependencies } = publicDependencies();
    const route = loadModule<Handlers>("../../app/api/admin/applications/[id]/submissions/[submissionId]/route.ts", {
      ...dependencies,
      "@/lib/roles": roles,
      "@/lib/admin-app-auth": {
        getApplicationReviewer: async () => ({ user: { role }, allowedProgramTypes: null }),
        postingOutOfScopeResponse: () => Response.json({ error: "Not found" }, { status: 404 }),
      },
      "@/lib/prisma": { prisma: {
        applicationSubmission: {
          findUnique: async () => ({ application: { isArchived: true, programType: "AI_MENTORSHIP_MENTEE" } }),
          update: () => assert.fail("Archived submission cannot change"),
        },
        applicationReview: { upsert: () => assert.fail("Archived review cannot change") },
      } },
    });
    const response = await route.PATCH(new Request("https://portal.test/api/admin/applications/a/submissions/submission", {
      method: "PATCH", body: JSON.stringify({ status: "ACCEPTED", notes: "changed" }),
    }), { params: Promise.resolve({ id: "a", submissionId: "submission" }) });
    assert.equal(response.status, role === "DIRECTOR" || role === "EXECUTIVE" ? 409 : 404);
  });
}
