import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/uploads", express.static("uploads"));
app.use("/api", routes);

// Middleware global de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Erro capturado no Express:", err);
  if (err.status === 413) {
    return res.status(413).json({ error: "O tamanho das fotos enviadas é muito grande. Por favor, tire fotos com menor resolução ou utilize imagens comprimidas." });
  }
  return res.status(err.status || 500).json({ error: err.message || "Erro interno no servidor" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
