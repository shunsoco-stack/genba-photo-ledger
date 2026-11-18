// A client-rendered shell also allows exported hosts to serve arbitrary local IDs.
export function generateStaticParams() {
  return [{ id: "local" }];
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
