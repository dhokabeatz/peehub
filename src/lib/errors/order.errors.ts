// Typed errors for the order flow.
// The route handler catches these and maps them to specific HTTP status codes.
// Using named classes (not string codes) means TypeScript enforces exhaustive handling.

export class BundleNotFoundError extends Error {
  readonly name = 'BundleNotFoundError'
  constructor() {
    super('Bundle not found or is no longer available')
  }
}

export class UnknownNetworkError extends Error {
  readonly name = 'UnknownNetworkError'
  constructor() {
    super('Could not detect a Ghana network from the recipient phone number')
  }
}

export class NetworkMismatchError extends Error {
  readonly name = 'NetworkMismatchError'
  readonly detected: string
  readonly expected: string
  constructor(detected: string, expected: string) {
    super(
      `Phone number belongs to ${detected} but the selected bundle is for ${expected}`,
    )
    this.detected = detected
    this.expected = expected
  }
}

export class WalletNotFoundError extends Error {
  readonly name = 'WalletNotFoundError'
  constructor() {
    super('Wallet not found for this account')
  }
}

export class InsufficientBalanceError extends Error {
  readonly name = 'InsufficientBalanceError'
  constructor() {
    super('Insufficient wallet balance')
  }
}
