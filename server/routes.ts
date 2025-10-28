import express, { Request, Response, type Express } from "express";
import { storage } from "./storage";
import { createServer, type Server } from "http";

const router = express.Router();

/**
 * USERS ROUTES
 */

// Create a new user
router.post("/users", async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "username and email are required" });
    }

    const user = await storage.createUser({ username, email });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by ID
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by username
router.get("/users/username/:username", async (req: Request, res: Response) => {
  try {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * REVIEWS ROUTES
 */

// Create a new review
router.post("/reviews", async (req: Request, res: Response) => {
  try {
    const { userId, code, language, reviewText, status } = req.body;
    if (!userId || !code || !language) {
      return res
        .status(400)
        .json({ error: "userId, code and language are required" });
    }

    const review = await storage.createReview({
      userId,
      code,
      language,
      reviewText: reviewText || "",
      status: status || "pending",
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all reviews
router.get("/reviews", async (_req: Request, res: Response) => {
  try {
    const reviews = await storage.getAllReviews();
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get review by ID
router.get("/reviews/:id", async (req: Request, res: Response) => {
  try {
    const review = await storage.getReviewById(Number(req.params.id));
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all reviews by a user
router.get("/users/:id/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await storage.getReviewsByUser(req.params.id);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Mount routes on the provided Express app and return an http.Server instance.
 * index.ts expects to call `const server = await registerRoutes(app);`
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the router under /api so client calls to /api/* reach these handlers
  app.use("/api", router);

  // Create and return a Node http.Server without listening. The caller
  // (server/index.ts) will call server.listen(...) when ready.
  const server = createServer(app);
  return server;
}

export default router;
