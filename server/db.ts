// Mock database module
import * as schema from "@shared/schema";

// This is a mock implementation that doesn't require a real database
console.log("Using mock database implementation");

// Export a mock db object that can be imported but won't be used
export const db = {
  // Add mock methods if needed
  query: async () => {
    return { rows: [] };
  }
};
