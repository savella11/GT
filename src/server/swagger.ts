import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Construcciones Elite API",
      version: "1.0.0",
      description: "Documentación interactiva de la API para la plataforma Construcciones Elite",
      contact: {
        name: "Soporte Técnico",
        email: "soporte@construccioneselite.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
  },
  apis: ["./src/server/routes/**/*.ts"], // Busca comentarios JSDoc en las rutas
};

export const specs = swaggerJsdoc(options);
