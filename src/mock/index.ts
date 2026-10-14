/**
 * Mock Module Exports
 *
 * Provides MockHost for simulating the parent host environment
 * and mock data for testing Elements in development.
 */

export { MockHost } from "./MockHost";
export type { ApiCallLog, MockHostOptions } from "./MockHost";

export {
  createMockData,
  defaultMockData,
  mockFeedMessage,
  mockFullInteraction,
  mockInteractionInfo,
  mockReasonCodes,
  mockReasonCodesResponse,
  mockTransferQueues,
  mockUserInfo,
  mockUserInteractions,
  mockUserQueues,
  mockUsers,
} from "./mockData";
export type { MockDataStore } from "./mockData";

export type { Interaction, Message } from "./types";

