import { MarketingAgent, MarketingAgentOptions } from './marketing-agent';
import { ContentManager } from './content-manager';
import { ScheduleManager } from './schedule-manager';
import { MarketingDb } from '@awing/marketing-db';

const dbPath = 'C:/data/seawingai/git/ai-marketing-agent/apps/services/marketing-service/src/assets/db';

async function runContentManagerExample() {
  const db = new MarketingDb(dbPath);
  const contentManager = new ContentManager(db);
  try {
    const llmResponse = await contentManager.generate('scheduleId:taskId');
    console.log('Generated content:', llmResponse);
  } catch (err) {
    console.error('Error generating content:', err);
  }
  try {
    const publishResponse = await contentManager.publish('scheduleId:taskId');
    console.log('Publish response:', publishResponse);
  } catch (err) {
    console.error('Error publishing content:', err);
  }
}

async function runScheduleManagerExample() {
  const db = new MarketingDb(dbPath);
  const scheduleManager = new ScheduleManager(db);
  await scheduleManager.start();
}

async function runMarketingAgentExample() {
  const agentOptions = new MarketingAgentOptions(dbPath);
  const agent = MarketingAgent.getInstance(agentOptions);
  await agent.start();
  try {
    const generateResponse = await agent.generate('scheduleId:taskId');
    console.log('Agent generate response:', generateResponse);
  } catch (err) {
    console.error('Error generating with agent:', err);
  }
  try {
    const publishResponse = await agent.publish('scheduleId:taskId');
    console.log('Agent publish response:', publishResponse);
  } catch (err) {
    console.error('Error publishing with agent:', err);
  }
  await agent.stop();
}

export async function runExamples() {
  //await runContentManagerExample();
  //await runScheduleManagerExample();
  await runMarketingAgentExample();
}

if (require.main === module) {
  runExamples().catch(console.error);
} 