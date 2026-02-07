import { LiveMarketDashboard } from '@/components/live-market-dashboard';
import { ModelChangelog } from '@/components/model-changelog';

export default function MarketPage() {
  return (
    <div className="dark bg-eco-black min-h-screen">
      <LiveMarketDashboard />
      
      <div className="px-6 lg:px-8 pb-12">
        <ModelChangelog />
      </div>
    </div>
  );
}
