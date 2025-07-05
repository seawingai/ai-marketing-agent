import { MarketingAgent, MarketingAgentOptions } from '@awing/marketing-agent'

const options = new MarketingAgentOptions('./src/assets/db')
const agent = MarketingAgent.getInstance(options);

export { agent }; // Export the singleton agent instance


