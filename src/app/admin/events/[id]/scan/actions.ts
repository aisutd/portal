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

    if (!currentUser) {
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

    // 3. Handle Event Check-In
    if (scanType === "attendance") {
      if (rsvp.attendance) {
        return { success: false, error: `${name} is already checked in!` };
      }

      await prisma.attendance.create({
        data: {
          rsvpId: rsvp.id,
          method: AttendanceMethod.QR_SCAN,
          qrTokenUsed: qrToken,
        },
      });

      return { success: true, message: `Checked in: ${name}` };
    }

    // 4. Handle Item Scans (Meals, Drinks, Merch) using ItemScan model
    if (scanType === "item" && eventItemId) {
      if (!rsvp.attendance) {
        return { success: false, error: `${name} must check into the event first!` };
      }

      const existingScan = await prisma.itemScan.findUnique({
        where: {
          attendanceId_eventItemId: {
            attendanceId: rsvp.attendance.id,
            eventItemId: eventItemId,
          },
        },
      });

      if (existingScan) {
        return { success: false, error: `${name} already claimed this item!` };
      }

      // Create the item scan record and link it to the admin's database ID
      await prisma.itemScan.create({
        data: {
          attendanceId: rsvp.attendance.id,
          eventItemId: eventItemId,
          scannedById: currentUser.id, // <-- Securely saves the admin's internal user ID
        },
      });

      return { success: true, message: `Item claimed for ${name}!` };
    }

    return { success: false, error: "Invalid scan configuration." };
  } catch (error) {
    console.error("Scan error:", error);
    return { success: false, error: "Server error during scan." };
  }
}