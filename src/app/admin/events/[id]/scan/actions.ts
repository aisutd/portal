"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceMethod } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";

export async function processScan(
  eventId: string, 
  qrToken: string, 
  scanType: "attendance" | "item", 
  eventItemId?: string
) {
  try {
    // 1. Get the authenticated admin performing the scan
    const currentUser = await getAuthenticatedUser();

    if (!currentUser || currentUser.role === "MEMBER" && currentUser.memberships?.[-1].membershipType !== "AIM_MENTOR") {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    // 2. Find the RSVP for this specific event using the qrToken
    const rsvp = await prisma.rSVP.findFirst({
      where: { eventId, qrToken },
      include: { 
        user: { include: { profile: true } }, 
        attendance: true,
      },
    });

    if (!rsvp) {
      return { success: false, error: "Invalid QR code or wrong event." };
    }

    const name = rsvp.user.profile 
      ? `${rsvp.user.profile.firstName} ${rsvp.user.profile.lastName}`
      : rsvp.user.email;

    // 3. Handle Event Check-In Only
    if (scanType === "attendance") {
      // Use upsert to handle concurrent scans cleanly
      const [, created] = await prisma.$transaction(async (tx) => {
        const existing = await tx.attendance.findUnique({
          where: { rsvpId: rsvp.id },
        });

        if (existing) return [existing, false] as const;

        const newRecord = await tx.attendance.create({
          data: {
            eventId,
            userId: rsvp.userId,
            rsvpId: rsvp.id,
            method: AttendanceMethod.MANUAL,
            qrTokenUsed: qrToken,
          },
        });

        return [newRecord, true] as const;
      });

      if (!created) {
        return {
          success: false,
          error: `${name} is already checked in!`,
          isWalkIn: rsvp.isWalkIn,
        };
      }

      return {
        success: true,
        message: rsvp.isWalkIn ? `Checked in: ${name} (Walk-In)` : `Checked in: ${name}`,
        isWalkIn: rsvp.isWalkIn,
      };
    }

    // 4. Handle Item Scans (Guaranteed Atomic Auto Check-In + Item Creation)
    if (scanType === "item") {
      if (!eventItemId) {
        return { success: false, error: "No item selected for scanning." };
      }

      return await prisma.$transaction(async (tx) => {
        let activeAttendanceId = rsvp.attendance?.id;
        let wasAutoCheckedIn = false;

        // Step 4A: Check or Create Attendance Record
        if (!activeAttendanceId) {
          // Double-check if created in a concurrent request
          const existingAttendance = await tx.attendance.findUnique({
            where: { rsvpId: rsvp.id },
            select: { id: true },
          });

          if (existingAttendance) {
            activeAttendanceId = existingAttendance.id;
          } else {
            const newAttendance = await tx.attendance.create({
              data: {
                eventId,
                userId: rsvp.userId,
                rsvpId: rsvp.id,
                method: AttendanceMethod.MANUAL,
                qrTokenUsed: qrToken,
              },
              select: { id: true },
            });
            activeAttendanceId = newAttendance.id;
            wasAutoCheckedIn = true;
          }
        }

        // Step 4B: Check for duplicate item claim
        const existingScan = await tx.itemScan.findUnique({
          where: {
            attendanceId_eventItemId: {
              attendanceId: activeAttendanceId,
              eventItemId: eventItemId,
            },
          },
        });

        if (existingScan) {
          return { 
            success: false, 
            error: `${name} already claimed this item!`,
            isWalkIn: rsvp.isWalkIn 
          };
        }

        // Step 4C: Create Item Scan linked directly to activeAttendanceId
        await tx.itemScan.create({
          data: {
            attendanceId: activeAttendanceId,
            eventItemId: eventItemId,
            scannedById: currentUser.id,
          },
        });

        const messagePrefix = wasAutoCheckedIn 
          ? `Checked in & item claimed for ${name}` 
          : `Item claimed for ${name}`;

        return { 
          success: true, 
          message: rsvp.isWalkIn ? `${messagePrefix} [Walk-In]` : messagePrefix,
          isWalkIn: rsvp.isWalkIn 
        };
      });
    }

    return { success: false, error: "Invalid scan configuration." };
  } catch (error) {
    console.error("Scan error:", error);
    return { success: false, error: "Server error during scan." };
  }
}