export const ORDER_STATUS = {
  PENDING: 'pending',       // just created, awaiting admin action
  PROCESSING: 'processing', // admin started fulfillment
  COMPLETED: 'completed',   // bundle delivered
  FAILED: 'failed',         // fulfillment failed — may trigger refund
  REFUNDED: 'refunded',     // wallet credited back after failure
} as const

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
