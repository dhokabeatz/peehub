export class AdminBundleNotFoundError extends Error {
  readonly name = 'AdminBundleNotFoundError'

  constructor() {
    super('Bundle not found')
  }
}

export class AdminNetworkNotFoundError extends Error {
  readonly name = 'AdminNetworkNotFoundError'

  constructor() {
    super('Network not found')
  }
}

export class DuplicateBundleError extends Error {
  readonly name = 'DuplicateBundleError'

  constructor() {
    super('A bundle with this name already exists on the selected network')
  }
}

export class BundleNetworkImmutableError extends Error {
  readonly name = 'BundleNetworkImmutableError'

  constructor() {
    super('Bundle network assignment cannot be changed after creation')
  }
}

export class UsedBundleCoreAttributesLockedError extends Error {
  readonly name = 'UsedBundleCoreAttributesLockedError'
  readonly fields: string[]

  constructor(fields: string[]) {
    super('Core bundle attributes cannot be modified once the bundle has been used in orders')
    this.fields = fields
  }
}
