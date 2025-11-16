import DashboardClient from "./DashboardClient";

// Generate static params for all readers
export function generateStaticParams() {
  return [
    {readerId: 'luke'},
    {readerId: 'mia'},
    {readerId: 'emy'}
  ];
}

interface DashboardPageProps {
  params: Promise<{readerId: string}>;
}

export default async function DashboardPage({params}: DashboardPageProps) {
  const {readerId} = await params;

  return <DashboardClient readerId={readerId} />;
}
