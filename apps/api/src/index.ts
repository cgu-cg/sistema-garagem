import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import routes from "./routes";

const app = express();
const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploads
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/api/uploads", express.static(uploadsDir));

// API routes
app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend static build
const webDistCandidates = [
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(__dirname, "../../web/dist"),
  path.resolve(process.cwd(), "dist/apps/web"),
];
const webDist = webDistCandidates.find(p => fs.existsSync(p)) || webDistCandidates[0];

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(webDist, "index.html"));
  });
}

// Middleware global de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Erro capturado no Express:", err);
  if (err.status === 413) {
    return res.status(413).json({ error: "O tamanho das fotos enviadas é muito grande. Por favor, tire fotos com menor resolução ou utilize imagens comprimidas." });
  }
  return res.status(err.status || 500).json({ error: err.message || "Erro interno no servidor" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sistema Garagem rodando em http://0.0.0.0:${PORT}`);
});
