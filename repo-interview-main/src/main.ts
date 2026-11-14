import "reflect-metadata";
import { createExpressServer } from "routing-controllers";
import "dotenv/config";
import { ProductController } from "./controllers/ProductControllers";

const PORT = 3002;

const app = createExpressServer({
  routePrefix: "/bp",
  controllers: [ProductController],
});

app.listen(PORT, () => {
  console.log(`Servidor Iniciado`);
  console.log(`Host: http://localhost:${PORT}`);
  console.log(`Fecha/Hora: ${new Date().toLocaleString()}`);
});
