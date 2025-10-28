import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

export const stackClientApp = new StackClientApp({
  // You should store these in environment variables
  projectId: "e733d8ef-260a-4c64-a228-e58506e401ed",
  publishableClientKey: "pck_aytdffhqx79b6910vfbr7x5pmba7zyzxkza78x5z5h1y0",
  tokenStore: "cookie",
  redirectMethod: {
    useNavigate,
  }
});
