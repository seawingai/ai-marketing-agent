import { FastifyInstance } from 'fastify';
import { agent } from '@marketing-service/sdk/agent';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async function () {
    return { message: 'Hello marketing-service' };
  });

  fastify.get('/content/generate', async (req, reply) => {
    try {
      await agent.content.generate();
      const result = true;
      reply.send({ status: 'success', result });
    } catch (err) {
      console.error('Error generating content:', err);
      reply.code(500).send({ status: 'error', message: err.message });
    }
  });
  
  fastify.get('/content/publish', async (req, reply) => {
    try {
      await agent.content.publish();
      const result = true;
      reply.send({ status: 'success', result });
    } catch (err) {
      console.error('Error publishing content:', err);
      reply.code(500).send({ status: 'error', message: err.message });
    }
  });
}

