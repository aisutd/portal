import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ROLE_ORDER: UserRole[] = ["MEMBER", "OFFICER", "DIRECTOR", "EXECUTIVE"];

// Roles that see every published event, regardless of targeting
const SEES_ALL_ROLES: UserRole[] = ["DIRECTOR", "EXECUTIVE"];

// Logged-out visitors (or unknown users): only unrestricted, member-level events
const PUBLIC_FILTER: Prisma.EventWhereInput = {
    visibilityTeams: { isEmpty: true },
    visibilityMembership: { isEmpty: true },
    OR: [
        { visibilityRoles: { has: "MEMBER" } },
        { visibilityRoles: { isEmpty: true } },
    ],
};

export async function getEventVisibilityFilter(
    userId: string | null
): Promise<Prisma.EventWhereInput> {
    if (!userId) return PUBLIC_FILTER;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            team: true,
            memberships: {
                where: { activeFlag: true },
                select: { membershipType: true },
            },
        },
    });
    if (!user) return PUBLIC_FILTER;

    // Directors and executives: no visibility restrictions
    // (isPublished and date filters in the calling query still apply)
    if (SEES_ALL_ROLES.includes(user.role)) return {};

    const membershipTypes = user.memberships.map((m) => m.membershipType);
    // an officer also sees member events
    const rolesAtOrBelow = ROLE_ORDER.slice(0, ROLE_ORDER.indexOf(user.role) + 1);

    return {
        AND: [
            {
                OR: [
                    { visibilityRoles: { hasSome: rolesAtOrBelow } },
                    { visibilityRoles: { isEmpty: true } },
                ],
            },
            {
                OR: [
                    { visibilityTeams: { isEmpty: true } },
                    ...(user.team ? [{ visibilityTeams: { has: user.team } }] : []),
                ],
            },
            {
                OR: [
                    { visibilityMembership: { isEmpty: true } },
                    ...(membershipTypes.length
                        ? [{ visibilityMembership: { hasSome: membershipTypes } }]
                        : []),
                ],
            },
        ],
    };
}
/*
Need to look into the tag version, 
Problem: every user saw the same events, regardless of their role, team, or membership.
Solution: a new helper (src/lib/event-visibility.ts) builds a Prisma filter from the user’s role, team, and active memberships. It’s applied to the Events page queries and the dashboard’s recommended-events query.
Safe rollout: no schema change or migration, and untargeted events stay visible to everyone, so current behavior is preserved.
Not yet covered: direct links to /events/[id] and the RSVP route aren’t restricted, the mobile dashboard still needs checking, and there may not be an officer-facing form to set the targeting fields yet.
*/