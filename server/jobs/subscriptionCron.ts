import cron from "node-cron";
import { renewActiveSubscriptions, expireOldSubscriptions, expireTrials } from "../services/subscriptionService";

export function setupSubscriptionJobs() {
  console.log("🕓 Subscription cron jobs initialized.");

  // Run every midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🧭 Running daily subscription maintenance...");
    await expireTrials();
    await expireOldSubscriptions();
    await renewActiveSubscriptions();
    console.log("✅ Daily subscription maintenance complete.");
  });
}
