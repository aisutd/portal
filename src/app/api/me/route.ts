import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ role: null, firstName: null }, { status: 401 });
  }

  const profile = user.profile;

  return NextResponse.json({
    role: user.role,
    // Same "given name" convention the members table uses: preferred name wins.
    firstName: profile ? profile.prefName || profile.firstName : null,
  });
}
