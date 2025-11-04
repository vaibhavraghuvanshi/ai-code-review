import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useLocation } from "wouter";

export function ReviewTable() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredReviews = rows.filter((r) => {
    const hay = `${r.id} ${r.language || ""} ${r.model || ""} ${r.status || ""}`.toLowerCase();
    return hay.includes(searchTerm.toLowerCase());
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-reviews"
        />
        <Button 
          className="gap-2" 
          onClick={() => setLocation("/dashboard")}
          data-testid="button-new-review"
        >
          <Plus className="h-4 w-4" />
          New Review
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8}>Loading…</TableCell></TableRow>
            )}
            {!loading && filteredReviews.length === 0 && (
              <TableRow><TableCell colSpan={8}>No reviews yet.</TableCell></TableRow>
            )}
            {!loading && filteredReviews.map((review) => (
              <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                <TableCell className="font-mono text-sm">{review.id}</TableCell>
                <TableCell>{review.language}</TableCell>
                <TableCell className="font-mono text-xs">{review.model ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{review.tokens ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{review.cost ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{review.createdAt ? new Date(review.createdAt).toLocaleString() : "-"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(review.status)}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setLocation(`/dashboard?reviewId=${review.id}`)}
                    data-testid={`button-view-${review.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
