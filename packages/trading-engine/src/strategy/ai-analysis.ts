import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'

type AIResponse = {
  signal: Signal
  confidence: number
  reason: string
}

export class AIAnalysisStrategy implements Strategy {
  constructor(
    private readonly model = 'gpt-signal-v1',
    private readonly minConfidence = 0.65
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const fallback: StrategyResult = {
      signal: 'HOLD',
      confidence: 0,
      reason: 'AI analysis fallback: unavailable response',
    }

    if (data.length < this.getRequiredDataPoints()) {
      return {
        signal: 'HOLD',
        confidence: 0.2,
        reason: 'AI analysis requires at least 3 data points',
      }
    }

    try {
      const prompt = this.buildPrompt(data)
      const rawResponse = await this.requestAnalysis(prompt, data)
      const parsed = this.parseResponse(rawResponse)

      if (!parsed) return fallback

      const confidence = Math.min(1, Math.max(0, parsed.confidence))
      if (confidence < this.minConfidence) {
        return {
          signal: 'HOLD',
          confidence,
          reason: `AI confidence ${confidence.toFixed(2)} below threshold ${this.minConfidence.toFixed(2)}`,
        }
      }

      return {
        signal: parsed.signal,
        confidence,
        reason: parsed.reason,
      }
    } catch {
      return fallback
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    try {
      const result = await this.analyze(data)
      return result.signal
    } catch {
      return 'HOLD'
    }
  }

  getRequiredDataPoints(): number {
    return 3
  }

  protected buildPrompt(data: OHLCV[]): string {
    const latest = data[data.length - 1]
    const earliest = data[0]
    const trend = latest.close - earliest.close
    return [
      `Model: ${this.model}`,
      `Candles: ${data.length}`,
      `Latest close: ${latest.close.toFixed(4)}`,
      `Trend delta: ${trend.toFixed(4)}`,
      'Return JSON: {"signal":"BUY|SELL|HOLD","confidence":number,"reason":string}',
    ].join('\n')
  }

  protected async requestAnalysis(prompt: string, data: OHLCV[]): Promise<string> {
    await delay(5)

    if (prompt.includes('FORCE_ERROR')) {
      throw new Error('Simulated AI transport failure')
    }

    const first = data[0].close
    const last = data[data.length - 1].close
    const delta = last - first

    if (delta > 0) {
      return JSON.stringify({ signal: 'BUY', confidence: 0.78, reason: 'Momentum trend is positive' })
    }
    if (delta < 0) {
      return JSON.stringify({ signal: 'SELL', confidence: 0.78, reason: 'Momentum trend is negative' })
    }

    return JSON.stringify({ signal: 'HOLD', confidence: 0.7, reason: 'No clear directional edge' })
  }

  protected parseResponse(rawResponse: string): AIResponse | null {
    let parsedValue: unknown

    try {
      parsedValue = JSON.parse(rawResponse)
    } catch {
      return null
    }

    if (!isAIResponse(parsedValue)) return null
    return parsedValue
  }
}

function isAIResponse(value: unknown): value is AIResponse {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<AIResponse>
  const validSignal = candidate.signal === 'BUY' || candidate.signal === 'SELL' || candidate.signal === 'HOLD'

  return validSignal && typeof candidate.confidence === 'number' && typeof candidate.reason === 'string'
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
