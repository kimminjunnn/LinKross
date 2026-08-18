import { NotificationCenter } from "@/components/notifications/notification-center";
import { listCompanyNotifications } from "@/lib/backend";

export default async function CompanyNotificationsPage() {
  const result = await listCompanyNotifications();

  return <NotificationCenter result={result} workspace="company" />;
}
