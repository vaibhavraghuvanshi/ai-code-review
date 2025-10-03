import { useState } from "react";
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

const mockReviews = [
  {
    id: "REV-001",
    repository: "ai-code-analyzer",
    branch: "main",
    reviewer: "AI Reviewer",
    date: "2024-07-20",
    status: "Approved",
    language: "JavaScript",
  },
  {
    id: "REV-002",
    repository: "user-dashboard-v2",
    branch: "feature/auth-flow",
    reviewer: "John Doe",
    date: "2024-07-19",
    status: "Pending",
    language: "TypeScript",
  },
  {
    id: "REV-003",
    repository: "api-gateway",
    branch: "hotfix/ssl-cert",
    reviewer: "AI Reviewer",
    date: "2024-07-18",
    status: "Rejected",
    language: "Python",
  },
  {
    id: "REV-004",
    repository: "frontend-components",
    branch: "dev/shadcn-upgrade",
    reviewer: "Jane Smith",
    date: "2024-07-17",
    status: "Approved",
    language: "React",
  },
  {
    id: "REV-005",
    repository: "backend-microservice",
    branch: "refactor/logging",
    reviewer: "AI Reviewer",
    date: "2024-07-16",
    status: "Approved",
    language: "C++",
  },
];

export function ReviewTable() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = mockReviews.filter(
    (review) =>
      review.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Pending":
        return "secondary";
      case "Rejected":
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
              <TableHead>Review ID</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.map((review) => (
              <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                <TableCell className="font-mono text-sm">{review.id}</TableCell>
                <TableCell>{review.repository}</TableCell>
                <TableCell className="font-mono text-sm">{review.branch}</TableCell>
                <TableCell>{review.reviewer}</TableCell>
                <TableCell>{review.date}</TableCell>
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
