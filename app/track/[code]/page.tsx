import { getPublicShipmentByCode } from "./actions";
import PublicTrackingClient from "./client";
import { notFound } from "next/navigation";

export default async function PublicTrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await getPublicShipmentByCode(code);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PublicTrackingClient data={result.data} />;
}
