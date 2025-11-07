import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function ReviewTable() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // useEffect(() => {
  //   let mounted = true;
  //   (async () => {
  //     try {
  //       setLoading(true);
  //       const res = await fetch("/api/reviews");
  //       if (!res.ok) throw new Error("Failed to fetch reviews");
  //       const data = await res.json();
  //       if (mounted) setRows(Array.isArray(data) ? data : []);
  //     } catch (e) {
  //       console.error(e);
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  //   return () => { mounted = false; };
  // }, []);

   useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // Read current user (stored on login/signup)
        const raw = localStorage.getItem("currentUser");
        const u = raw ? JSON.parse(raw) : null;
        const uid = u?.id;

        // Debug logging: current user context
        console.log("[ReviewTable] currentUser:", u);

        if (!uid) {
          // No user -> do not expose global data
          console.log("[ReviewTable] No user id found; not fetching reviews.");
          if (mounted) setRows([]);
          return;
        }

        const endpoint = `/api/users/${uid}/reviews`;
        console.log("[ReviewTable] Fetching:", endpoint);
        const res = await apiRequest("GET", endpoint);
        if (!res.ok) throw new Error("Failed to fetch user reviews");
        const data = await res.json();
        console.log("[ReviewTable] Received reviews:", Array.isArray(data) ? data.length : data);
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("[ReviewTable] Fetch error:", e);
        if (mounted) setRows([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredReviews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.id,
        r.language,
        r.model,
        r.status,
        r.reviewText,
        r.suggestions,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchTerm]);

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
              <TableHead>#</TableHead>
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
            {!loading && filteredReviews.map((review, idx) => (
              <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => setLocation(`/reviews/${review.id}`)}
                      data-testid={`button-view-${review.id}`}
                      disabled={deleting}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        setPendingId(review.id);
                        setConfirmOpen(true);
                      }}
                      data-testid={`button-delete-${review.id}`}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected review
              and remove its data from the review history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingId) return;
                try {
                  setDeleting(true);
                  const res = await fetch(`/api/reviews/${pendingId}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to delete review");
                  const ok = await res.json();
                  if (!ok?.success) throw new Error("Delete not acknowledged");
                  setRows((prev) => prev.filter((r) => r.id !== pendingId));
                  toast({ title: "Review deleted", description: `Review #${pendingId} was removed.` });
                } catch (err: any) {
                  console.error(err);
                  toast({ title: "Delete failed", description: err?.message || String(err) });
                } finally {
                  setDeleting(false);
                  setConfirmOpen(false);
                  setPendingId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground border border-destructive-border"
              data-testid="button-confirm-delete"
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
