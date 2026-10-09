import { PROVIDER_MODELS, formatTokenCount, pricingSource, getProviderName } from '@/lib/providers';
import { ANTHROPIC_PRICING } from '@/lib/pricing';
import { CATALOG_UPDATED_AT } from '@/lib/models';

export default function PricingPage() {
  return (
    <article className="article">
      <header className="hero">
        <h1 className="hero-headline"><span className="hero-marker">Pricing Reference</span></h1>
        <p className="hero-description">Published API rates in USD per million text tokens, checked {CATALOG_UPDATED_AT}. Each model links to its provider pricing page. This is a pricing snapshot, not a live billing feed.</p>
      </header>
      <section>
        <h2 className="section-header">{PROVIDER_MODELS.length} model profiles</h2>
        <p>Input and output rates exclude cache discounts, tool calls, regional surcharges and service-tier adjustments. Check each model’s conditions before estimating a request.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="settings-table">
            <thead><tr><th>Model</th><th>Input / MTok</th><th>Output / MTok</th><th>Context</th><th>Max output</th><th>Cached input / MTok</th></tr></thead>
            <tbody>{PROVIDER_MODELS.map(model => (
              <tr key={model.id}>
                <td><a href={pricingSource(model)} target="_blank" rel="noopener noreferrer">{model.name}</a><br /><small>{getProviderName(model.provider)}</small></td>
                <td>${model.inputCostPerMTok.toFixed(2)}</td><td>${model.outputCostPerMTok.toFixed(2)}</td>
                <td>{formatTokenCount(model.contextWindow)}</td><td>{formatTokenCount(model.maxOutput)}</td>
                <td>${model.cachedInputCostPerMTok.toFixed(3)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section>
        <div className="section-divider" /><h2 className="section-header">Pricing conditions</h2>
        <ul>{PROVIDER_MODELS.filter(model => model.longContext || model.notes?.includes('Promotional')).map(model => (
          <li key={model.id}><strong>{model.name}:</strong> {model.longContext && `Above ${formatTokenCount(model.longContext.threshold)} input tokens, full-request input is ${model.longContext.inputMultiplier}× and output is ${model.longContext.outputMultiplier}× the base rate. `}{model.notes?.includes('Promotional') ? model.notes : ''}</li>
        ))}</ul>
        <p>These comparisons estimate independent text requests. Session-wide pricing rules, cached tokens, thinking tokens and tool usage can change the final bill.</p>
      </section>
      <section>
        <div className="section-divider" /><h2 className="section-header">Claude prompt caching</h2>
        <p>Five-minute cache writes and cache reads, in USD per million tokens. Other cache durations have different prices.</p>
        <div style={{ overflowX: 'auto' }}><table className="settings-table">
          <thead><tr><th>Model</th><th>5-minute write</th><th>Read</th></tr></thead>
          <tbody>{Object.entries(ANTHROPIC_PRICING).map(([id, rate]) => (
            <tr key={id}><td>{PROVIDER_MODELS.find(model => model.id === id)?.name ?? id}</td><td>${rate.standard.cacheWriteCostPerMTok.toFixed(2)}</td><td>${rate.standard.cacheReadCostPerMTok.toFixed(2)}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
      <section>
        <div className="section-divider" /><h2 className="section-header">Subscriptions and services</h2>
        <p>Chat subscriptions and API billing are separate products. Subscription names do not determine API context windows or guarantee unlimited usage. Tool calls, cache storage and hosted code execution may add charges.</p>
        <p><a href="https://platform.claude.com/docs/en/about-claude/pricing">Anthropic pricing</a> · <a href="https://developers.openai.com/api/docs/pricing">OpenAI pricing</a> · <a href="https://ai.google.dev/gemini-api/docs/pricing">Google pricing</a></p>
      </section>
    </article>
  );
}
