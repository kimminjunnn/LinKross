import { NotificationCenter } from "@/components/notifications/notification-center";
import { listFreelancerNotifications } from "@/lib/backend";

export default async function FreelancerNotificationsPage() {
  const result = await listFreelancerNotifications();

  return <NotificationCenter result={result} workspace="freelancer" />;
}
