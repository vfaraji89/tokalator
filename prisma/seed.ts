import { PrismaClient, ServiceTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Anthropic models and pricing data...\n');

  // Clear existing data
  await prisma.budgetAlert.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.servicePricing.deleteMany();
  await prisma.project.deleteMany();
  await prisma.model.deleteMany();

  // ============================================
  // ANTHROPIC MODELS (February 2026)
  // ============================================

  // Claude Opus 4.6
  const opus = await prisma.model.create({
    data: {
      name: 'claude-opus-4.6',
      displayName: 'Claude Opus 4.6',
      description: 'Most intelligent model with 128K output & adaptive thinking',
      baseQuality: 1.0,
      alphaParam: 0.30,  // Higher sensitivity to input (complex reasoning)
      betaParam: 0.35,   // Higher sensitivity to output (detailed responses)
      gammaParam: 0.20,  // Cache sensitivity
    },
  });

  // Claude Sonnet 4.5
  const sonnet = await prisma.model.create({
    data: {
      name: 'claude-sonnet-4.5',
      displayName: 'Claude Sonnet 4.5',
      description: 'Best combination of speed and intelligence',
      baseQuality: 0.85,
      alphaParam: 0.25,
      betaParam: 0.30,
      gammaParam: 0.20,
    },
  });

  // Claude Haiku 4.5
  const haiku = await prisma.model.create({
    data: {
      name: 'claude-haiku-4.5',
      displayName: 'Claude Haiku 4.5',
      description: 'Fastest model with near-frontier intelligence',
      baseQuality: 0.70,
      alphaParam: 0.20,
      betaParam: 0.25,
      gammaParam: 0.15,
    },
  });

  console.log('✅ Created models:', opus.displayName, sonnet.displayName, haiku.displayName);

  // ============================================
  // PRICING RULES
  // ============================================

  // Opus 4.6 - Two-tier pricing (≤200K and >200K for 1M beta)
  await prisma.pricingRule.create({
    data: {
      modelId: opus.id,
      promptTokenThreshold: null, // Base tier
      inputCostPerMTok: 5.0,
      outputCostPerMTok: 25.0,
      cacheWriteCostPerMTok: 6.25,
      cacheReadCostPerMTok: 0.50,
      serviceTier: ServiceTier.STANDARD,
    },
  });

  // Sonnet 4.5 - Two-tier pricing (≤200K and >200K)
  // Tier 1: ≤200K tokens
  await prisma.pricingRule.create({
    data: {
      modelId: sonnet.id,
      promptTokenThreshold: 0, // Base tier (0 to 200K)
      inputCostPerMTok: 3.0,
      outputCostPerMTok: 15.0,
      cacheWriteCostPerMTok: 3.75,
      cacheReadCostPerMTok: 0.30,
      serviceTier: ServiceTier.STANDARD,
    },
  });

  // Tier 2: >200K tokens
  await prisma.pricingRule.create({
    data: {
      modelId: sonnet.id,
      promptTokenThreshold: 200000, // Above 200K threshold
      inputCostPerMTok: 6.0,
      outputCostPerMTok: 22.50,
      cacheWriteCostPerMTok: 7.50,
      cacheReadCostPerMTok: 0.60,
      serviceTier: ServiceTier.STANDARD,
    },
  });

  // Haiku 4.5 - Single tier pricing
  await prisma.pricingRule.create({
    data: {
      modelId: haiku.id,
      promptTokenThreshold: null,
      inputCostPerMTok: 1.0,
      outputCostPerMTok: 5.0,
      cacheWriteCostPerMTok: 1.25,
      cacheReadCostPerMTok: 0.10,
      serviceTier: ServiceTier.STANDARD,
    },
  });

  console.log('✅ Created pricing rules for all models');

  // ============================================
  // ADDITIONAL SERVICES PRICING
  // ============================================

  await prisma.servicePricing.create({
    data: {
      serviceName: 'web_search',
      displayName: 'Web Search',
      costPerUnit: 10.0,
      unitType: '1K_SEARCHES',
      freeAllowance: null,
      freeAllowanceUnit: null,
    },
  });

  await prisma.servicePricing.create({
    data: {
      serviceName: 'code_execution',
      displayName: 'Code Execution',
      costPerUnit: 0.05,
      unitType: 'HOUR',
      freeAllowance: 50,
      freeAllowanceUnit: 'HOURS_PER_DAY_PER_ORG',
    },
  });

  console.log('✅ Created service pricing');

  // ============================================
  // DEFAULT PROJECT
  // ============================================

  const defaultProject = await prisma.project.create({
    data: {
      name: 'Default Project',
      description: 'Default project for tracking Anthropic API usage',
      monthlyBudget: 1000.0,
      alertThreshold: 0.8,
    },
  });

  console.log('✅ Created default project:', defaultProject.name);

  // ============================================
  // SAMPLE USAGE RECORDS
  // ============================================

  const now = new Date();
  const sampleUsage = [
    // Day 1: Opus heavy usage
    {
      projectId: defaultProject.id,
      modelId: opus.id,
      inputTokens: 50000,
      outputTokens: 15000,
      cacheWriteTokens: 10000,
      cacheReadTokens: 30000,
      inputCost: 0.25,   // 50K * $5/MTok
      outputCost: 0.375, // 15K * $25/MTok
      cacheWriteCost: 0.0625, // 10K * $6.25/MTok
      cacheReadCost: 0.015,   // 30K * $0.50/MTok
      totalCost: 0.7025,
      description: 'Complex agent task',
      recordedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    // Day 2: Sonnet moderate usage
    {
      projectId: defaultProject.id,
      modelId: sonnet.id,
      inputTokens: 100000,
      outputTokens: 50000,
      cacheWriteTokens: 20000,
      cacheReadTokens: 50000,
      inputCost: 0.30,   // 100K * $3/MTok
      outputCost: 0.75,  // 50K * $15/MTok
      cacheWriteCost: 0.075, // 20K * $3.75/MTok
      cacheReadCost: 0.015,  // 50K * $0.30/MTok
      totalCost: 1.14,
      description: 'Code review session',
      recordedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    // Day 3: Haiku high volume
    {
      projectId: defaultProject.id,
      modelId: haiku.id,
      inputTokens: 500000,
      outputTokens: 200000,
      cacheWriteTokens: 50000,
      cacheReadTokens: 200000,
      inputCost: 0.50,   // 500K * $1/MTok
      outputCost: 1.00,  // 200K * $5/MTok
      cacheWriteCost: 0.0625, // 50K * $1.25/MTok
      cacheReadCost: 0.02,    // 200K * $0.10/MTok
      totalCost: 1.5825,
      description: 'Batch classification tasks',
      recordedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    // Day 4: Sonnet with >200K context
    {
      projectId: defaultProject.id,
      modelId: sonnet.id,
      inputTokens: 300000, // >200K threshold
      outputTokens: 50000,
      cacheWriteTokens: 100000,
      cacheReadTokens: 0,
      inputCost: 1.80,   // 300K * $6/MTok (>200K tier)
      outputCost: 1.125, // 50K * $22.50/MTok (>200K tier)
      cacheWriteCost: 0.75, // 100K * $7.50/MTok (>200K tier)
      cacheReadCost: 0,
      totalCost: 3.675,
      description: 'Large document analysis',
      recordedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    // Day 5: Mixed usage with web search
    {
      projectId: defaultProject.id,
      modelId: sonnet.id,
      inputTokens: 80000,
      outputTokens: 40000,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      webSearches: 50,
      inputCost: 0.24,
      outputCost: 0.60,
      cacheWriteCost: 0,
      cacheReadCost: 0,
      webSearchCost: 0.50, // 50 searches * $10/1K
      totalCost: 1.34,
      description: 'Research task with web search',
      recordedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    // Day 6: Code execution
    {
      projectId: defaultProject.id,
      modelId: opus.id,
      inputTokens: 30000,
      outputTokens: 20000,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      codeExecMinutes: 30,
      inputCost: 0.15,
      outputCost: 0.50,
      cacheWriteCost: 0,
      cacheReadCost: 0,
      codeExecCost: 0.025, // 0.5 hours * $0.05/hour
      totalCost: 0.675,
      description: 'Data analysis with code execution',
      recordedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    // Today: Light usage
    {
      projectId: defaultProject.id,
      modelId: haiku.id,
      inputTokens: 20000,
      outputTokens: 10000,
      cacheWriteTokens: 5000,
      cacheReadTokens: 10000,
      inputCost: 0.02,
      outputCost: 0.05,
      cacheWriteCost: 0.00625,
      cacheReadCost: 0.001,
      totalCost: 0.07725,
      description: 'Quick Q&A session',
      recordedAt: now,
    },
  ];

  for (const usage of sampleUsage) {
    await prisma.usageRecord.create({ data: usage });
  }

  console.log('✅ Created sample usage records');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nSummary:');
  console.log(`  - Models: ${await prisma.model.count()}`);
  console.log(`  - Pricing Rules: ${await prisma.pricingRule.count()}`);
  console.log(`  - Service Pricing: ${await prisma.servicePricing.count()}`);
  console.log(`  - Projects: ${await prisma.project.count()}`);
  console.log(`  - Usage Records: ${await prisma.usageRecord.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
