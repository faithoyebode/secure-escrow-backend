
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Escrow Platform API',
    version: '1.0.0',
    description: 'API documentation for Escrow Platform',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@escrow-platform.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          role: {
            type: 'string',
            enum: ['buyer', 'seller', 'admin'],
          },
          avatar: {
            type: 'string',
            nullable: true,
          },
          walletBalance: {
            type: 'number',
            format: 'float',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'float',
          },
          image: {
            type: 'string',
          },
          category: {
            type: 'string',
          },
          sellerId: {
            type: 'string',
            format: 'uuid',
          },
          sellerName: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Escrow: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          productId: {
            type: 'string',
            format: 'uuid',
          },
          productName: {
            type: 'string',
          },
          productImage: {
            type: 'string',
          },
          amount: {
            type: 'number',
            format: 'float',
          },
          buyerId: {
            type: 'string',
            format: 'uuid',
          },
          buyerName: {
            type: 'string',
          },
          sellerId: {
            type: 'string',
            format: 'uuid',
          },
          sellerName: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['pending', 'awaiting_delivery', 'delivered', 'completed', 'disputed', 'refunded', 'canceled'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Dispute: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          escrowId: {
            type: 'string',
            format: 'uuid',
          },
          raisedBy: {
            type: 'string',
            enum: ['buyer', 'seller'],
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          reason: {
            type: 'string',
          },
          evidence: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          status: {
            type: 'string',
            enum: ['pending', 'resolved', 'rejected'],
          },
          adminNotes: {
            type: 'string',
            nullable: true,
          },
          resolvedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      DisputeComment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          disputeId: {
            type: 'string',
            format: 'uuid',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          userRole: {
            type: 'string',
            enum: ['buyer', 'seller', 'admin'],
          },
          content: {
            type: 'string',
          },
          attachments: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access to the requested resource is forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFoundError: {
        description: 'The specified resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.ts'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve swagger spec as JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
