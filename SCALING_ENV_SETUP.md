# Environment Variables for GPT-Level Scaling

This document outlines all the environment variables needed for the zero-cost GPT-level scaling implementation.

## Required Environment Variables

### Database & Authentication
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### AI API Providers (Free Tiers)

#### Groq API (Primary)
```bash
GROQ_API_KEY=gsk_your_groq_api_key
```
- **Free Tier**: 1,000 requests/day, 30 RPM, 6,000 TPM
- **Sign up**: https://console.groq.com/
- **Models**: llama-3.1-8b-instant, llama-3.3-70b-versatile, qwen/qwen3-32b

#### Gemini API (Secondary)
```bash
GEMINI_API_KEY=your_gemini_api_key
```
- **Free Tier**: 1,500 requests/day, 15 RPM, 250K TPM
- **Sign up**: https://aistudio.google.com/
- **Models**: gemini-3-flash, gemini-3.1-flash-lite

#### Cohere API (Tertiary)
```bash
COHERE_API_KEY=your_cohere_api_key
```
- **Free Tier**: 1,000 requests/day, 20 RPM
- **Sign up**: https://cohere.com/
- **Models**: command-r-plus, command-r

### Distributed Caching (Upstash Redis)
```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```
- **Free Tier**: 10,000 commands/day, 256MB storage
- **Sign up**: https://upstash.com/
- **Purpose**: Distributed caching that survives serverless cold starts

### Search & Web Data
```bash
JINA_API_KEY=your_jina_api_key
```
- **Free Tier**: 1M tokens, 100 RPM
- **Sign up**: https://jina.ai/
- **Purpose**: Web search and content extraction

### Optional: Monitoring & Analytics
```bash
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production
```
- **Purpose**: Error tracking and performance monitoring
- **Sign up**: https://sentry.io/

## Setup Instructions

### 1. Create Upstash Redis Account
1. Go to https://upstash.com/
2. Sign up for free account
3. Create a new Redis database
4. Copy REST URL and REST token
5. Add to your environment variables

### 2. Get Free API Keys

#### Groq API
1. Go to https://console.groq.com/
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Add to environment variables

#### Gemini API
1. Go to https://aistudio.google.com/
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Add to environment variables

#### Cohere API
1. Go to https://cohere.com/
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Add to environment variables

#### Jina API
1. Go to https://jina.ai/
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Add to environment variables

### 3. Local Development Setup
```bash
# Copy the example environment file (if it exists)
cp .env.local.example .env.local

# Or create .env.local manually with the variables above
```

### 4. Vercel Deployment Setup
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all the variables listed above
4. Redeploy your application

## Capacity Planning

### Current Capacity (Before Scaling)
- **Daily Users**: 20-30
- **API Calls/Day**: 1,000 (Groq only)
- **Cache**: In-memory only (lost on cold starts)

### Expected Capacity (After Scaling)
- **Daily Users**: 100,000+
- **API Calls/Day**: 500,000+ (multi-provider)
- **Cache**: Distributed Redis (persistent)
- **Response Time**: <500ms p95

### API Provider Distribution
- **Groq**: 1,000 RPD (30% of traffic)
- **Gemini**: 1,500 RPD (45% of traffic)
- **Cohere**: 1,000 RPD (25% of traffic)
- **Total**: 3,500 RPD baseline capacity
- **With 70% cache hit rate**: ~11,600 effective RPD

## Monitoring

### Cache Statistics
```typescript
import { getCacheStats } from '@/lib/redis-cache';

const stats = await getCacheStats();
console.log('Memory cache size:', stats.memorySize);
console.log('Redis connected:', stats.redisConnected);
console.log('Cache hit rate:', stats.hitRate);
```

### Load Balancer Statistics
```typescript
import { getLoadBalancer } from '@/lib/api-load-balancer';

const balancer = getLoadBalancer();
const stats = balancer.getProviderStats();
console.log('Provider stats:', stats);
```

## Troubleshooting

### Redis Connection Issues
- **Error**: "Upstash Redis credentials not found"
- **Solution**: Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to environment variables

### API Rate Limiting
- **Error**: "All models are currently unavailable"
- **Solution**: The load balancer will automatically switch providers. Check provider stats to see which providers are rate-limited.

### Cache Not Working
- **Error**: Low cache hit rate
- **Solution**: Check Redis connection status and ensure UPSTASH_REDIS_REST_URL is correct

## Cost Breakdown

### Monthly Costs (All Free Tiers)
- **Upstash Redis**: $0 (10,000 commands/day)
- **Groq API**: $0 (1,000 RPD)
- **Gemini API**: $0 (1,500 RPD)
- **Cohere API**: $0 (1,000 RPD)
- **Jina API**: $0 (1M tokens)
- **Vercel Hosting**: $0 (100GB bandwidth)
- **Supabase**: $0 (500MB database)
- **Total**: $0/month

### When to Upgrade
- **Daily Active Users > 100,000**: Consider upgrading to paid tiers
- **API Calls > 500,000/day**: Upgrade API providers
- **Redis Commands > 10,000/day**: Upgrade Upstash plan
- **Database > 500MB**: Upgrade Supabase plan

## Security Notes

- Never commit API keys to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage for unusual activity
- Implement rate limiting at the application level

## Performance Optimization Tips

1. **Cache Aggressively**: Higher cache hit rates reduce API calls
2. **Use Edge Functions**: Deploy to edge for lower latency
3. **Batch Operations**: Use batch cache operations when possible
4. **Monitor Performance**: Track cache hit rates and response times
5. **Optimize Queries**: Reduce database query complexity
6. **Use CDN**: Cache static assets at the edge

## Support

For issues with:
- **Upstash Redis**: https://upstash.com/docs
- **Groq API**: https://console.groq.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Cohere API**: https://docs.cohere.com/
- **Jina API**: https://jina.ai/docs
