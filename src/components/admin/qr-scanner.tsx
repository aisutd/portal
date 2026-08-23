"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { processScan } from "@/app/admin/events/[id]/scan/actions";
import { Button } from "@/components/ui/button";
import { ItemType } from "@prisma/client";

type EventItemOption = {
  id: string;
  name: string;
  type: ItemType;
};

export function QRScannerClient({ 
  eventId, 
  items 
}: { 
  eventId: string; 
  items: EventItemOption[]; 
}) {
  const [scanType, setScanType] = useState<"attendance" | "item">("attendance");
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleScan = async (scannedData: string) => {
    if (status === "loading" || status === "success") return;
    
    setStatus("loading");
    setMessage("Verifying...");

    const result = await processScan(
      eventId, 
      scannedData, 
      scanType, 
      scanType === "item" ? selectedItemId : undefined
    );

    if (result.success) {
      setStatus("success");
      setMessage(result.message!);
      setTimeout(() => setStatus("idle"), 2500);
    } else {
      setStatus("error");
      setMessage(result.error!);
      setTimeout(() => setStatus("idle"), 3500);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      {/* Mode Selector */}
      <div className="flex flex-col gap-2 rounded-xl bg-white p-4 border border-border-soft shadow-sm">
        <label className="style-caption text-xs text-ink-faint">SCAN MODE:</label>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={scanType === "attendance" ? "primary" : "ghost"}
            onClick={() => setScanType("attendance")}
          >
            Event Check-In
          </Button>
          {items.length > 0 && (
            <Button 
              size="sm" 
              variant={scanType === "item" ? "primary" : "ghost"}
              onClick={() => setScanType("item")}
            >
              Scan Item (Meal/Merch)
            </Button>
          )}
        </div>

        {scanType === "item" && (
          <select 
            className="mt-2 rounded-lg border border-border-soft p-2 style-caption text-sm bg-background"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Scanner Viewport */}
      <div className="overflow-hidden rounded-2xl border-4 border-border-soft bg-black">
        {status === "idle" || status === "loading" ? (
          <Scanner 
            onScan={(detectedCodes) => {
              if (detectedCodes && detectedCodes.length > 0) {
                handleScan(detectedCodes[0].rawValue);
              }
            }} 
            onError={(error) => console.log(error?.message)}
            scanDelay={1000}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center bg-white p-6 text-center">
             <p className={`font-display text-lg font-bold ${status === "success" ? "text-green-600" : "text-red-600"}`}>
               {message}
             </p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="style-caption text-sm text-ink-faint">
          {status === "idle" ? `Ready to scan for ${scanType === "attendance" ? "Check-in" : "Item"}` : message}
        </p>
        
        {status !== "idle" && (
          <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
            Scan Next
          </Button>
        )}
      </div>
    </div>
  );
}