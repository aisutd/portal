import TopNav from "./_components/TopNav";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-cream font-body text-ink">
      <TopNav active="Events" />
      {children}
    </div>
  );
}
