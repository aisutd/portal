import Image from "next/image";
import Link from "next/link";

const SOCIALS = [
  {
    label: "Discord",
    href: "https://discord.gg/JFEkPHjzEK",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.42 0-1.334.956-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/utdais",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border-soft bg-cream px-[46px] py-[32px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[20px] sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-[8px] sm:items-start">
          <Image
            src="/ais_logo_black.png"
            alt="AIS Logo"
            width={120}
            height={36}
            className="h-[32px] w-auto object-contain"
          />
          <Link
            href="https://aisutd.org"
            target="_blank"
            rel="noopener noreferrer"
            className="style-caption text-ink-faint hover:text-brand transition-colors"
          >
            aisutd.org
          </Link>
        </div>

        <div className="flex items-center gap-[10px]">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="flex size-[38px] items-center justify-center rounded-full border border-border-soft bg-white text-ink-muted transition-all duration-200 hover:scale-110 hover:text-brand hover:shadow-sm"
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
