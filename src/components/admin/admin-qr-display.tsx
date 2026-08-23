"use client";

import { QRCodeSVG } from "qrcode.react";

export function AdminQrDisplay({ url }: { url: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-inner border border-border-soft inline-block">
      <QRCodeSVG
        value={url}
        size={220}
        level="H"
        includeMargin={true}
        className="rounded-lg"
      />
    </div>
  );
}