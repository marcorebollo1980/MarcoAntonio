"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
require("dotenv/config");
const ProductControllers_1 = require("./controllers/ProductControllers");
const PORT = 3002;
const app = (0, routing_controllers_1.createExpressServer)({
    routePrefix: "/bp",
    controllers: [ProductControllers_1.ProductController],
});
app.listen(PORT, () => {
    console.log(`Servidor Iniciado`);
    console.log(`Host: http://localhost:${PORT}`);
    console.log(`Fecha/Hora: ${new Date().toLocaleString()}`);
});
