import { ReviewTable } from '@/components/review-table';

export default function ReviewHistory() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recent Reviews</h1>
        <p className="text-muted-foreground">A list of your latest code review activities.</p>
      </div>

      <ReviewTable />
    </div>
  );
}
