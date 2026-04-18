export class OrderNotFoundError extends Error {
  readonly name = 'OrderNotFoundError'
  constructor() {
    super('Order not found')
  }
}

export class InvalidStatusTransitionError extends Error {
  readonly name = 'InvalidStatusTransitionError'
  readonly from: string
  readonly to: string
  constructor(from: string, to: string) {
    super(`Cannot transition order from "${from}" to "${to}"`)
    this.from = from
    this.to = to
  }
}

export class AlreadyRefundedError extends Error {
  readonly name = 'AlreadyRefundedError'
  constructor() {
    super('A refund has already been issued for this order')
  }
}
