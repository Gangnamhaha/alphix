export class PositionSizer {
  constructor(private readonly fixedRatio = 0.02) {}

  calculateQuantity(accountEquity: number, price: number): number {
    if (!Number.isFinite(accountEquity) || !Number.isFinite(price) || accountEquity <= 0 || price <= 0) {
      return 0
    }

    const notional = accountEquity * this.fixedRatio
    return notional / price
  }
}
