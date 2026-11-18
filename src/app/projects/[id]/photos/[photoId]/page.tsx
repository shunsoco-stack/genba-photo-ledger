import { AppView } from "@/components/app-view";

export function generateStaticParams() {
  return [{ photoId: "local" }];
}

export default function Page() {
  return <AppView />;
}
