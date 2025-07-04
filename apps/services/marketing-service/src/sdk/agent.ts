import { MarketingAgent } from '@awing/marketing-agent'

const agent = MarketingAgent.getInstance('./assets/schedules.json');

export { agent }; // Export the singleton agent instance


