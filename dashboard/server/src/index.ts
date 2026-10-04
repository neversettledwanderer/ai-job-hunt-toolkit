import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes.js";

const app = express();
app.use(cors());
app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[api error]", message);
  res.status(502).json({ error: message });
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`job-hunt-dashboard-server listening on http://localhost:${PORT}`);
});
