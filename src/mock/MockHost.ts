/**
 * MockHost - Simulates the parent host for ElementAPI postMessage communication
 *
 * This class listens for postMessage requests from an iframe containing an Element,
 * responds with mock data, and provides methods to trigger events.
 */

import {
  createMockData,
  type MockDataStore,
} from "./mockData";
import type { Message } from "./types";

// Channel names must match ElementAPI
const CHANNEL_NAMES = {
  INTERACTION_STATUS_CHANGED: "interaction-status-changed",
  INTERACTION_ENDED: "on-interaction-ended",
  INTERACTION_ACCEPTED: "on-interaction-accepted",
  INTERACTION_UPDATED: "on-interaction-updated",
  CONSULT_STATUS_CHANGED: "consult-status-changed",
  FEED_MESSAGE: "feed-message",
} as const;

export interface ApiCallLog {
  id: string;
  timestamp: Date;
  method: string;
  params: unknown;
  response: unknown;
  success: boolean;
  duration: number;
}

export interface MockHostOptions {
  /** The iframe element containing the Element */
  iframe: HTMLIFrameElement;
  /** Custom mock data to override defaults */
  mockData?: Partial<MockDataStore>;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when an API call is made */
  onApiCall?: (log: ApiCallLog) => void;
}

/**
 * MockHost simulates the core-agent-ui parent for Elements running in iframes
 */
export class MockHost {
  private iframe: HTMLIFrameElement;
  private mockData: MockDataStore;
  private debug: boolean;
  private onApiCall?: (log: ApiCallLog) => void;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private apiCallLogs: ApiCallLog[] = [];

  constructor(options: MockHostOptions) {
    this.iframe = options.iframe;
    this.mockData = {
      ...createMockData(),
      ...options.mockData,
    };
    this.debug = options.debug ?? false;
    this.onApiCall = options.onApiCall;

    this.setupMessageListener();
    this.log("MockHost initialized");
  }

  /**
   * Update mock data at runtime
   */
  setMockData<K extends keyof MockDataStore>(key: K, data: MockDataStore[K]): void {
    this.mockData[key] = data;
    this.log(`Mock data updated: ${key}`);
  }

  /**
   * Get current mock data
   */
  getMockData(): MockDataStore {
    return this.mockData;
  }

  /**
   * Get all API call logs
   */
  getApiCallLogs(): ApiCallLog[] {
    return [...this.apiCallLogs];
  }

  /**
   * Clear API call logs
   */
  clearApiCallLogs(): void {
    this.apiCallLogs = [];
  }

  // ============================================================================
  // Event Triggers
  // ============================================================================

  /**
   * Trigger an interaction accepted event
   */
  triggerInteractionAccepted(interactionId: string): void {
    this.sendEventToIframe({
      type: CHANNEL_NAMES.INTERACTION_ACCEPTED,
      interactionId,
    });
    this.log(`Event: interaction-accepted (${interactionId})`);
  }

  /**
   * Trigger an interaction ended event
   */
  triggerInteractionEnded(interactionId: string): void {
    this.sendEventToIframe({
      type: CHANNEL_NAMES.INTERACTION_ENDED,
      interactionId,
    });
    this.log(`Event: interaction-ended (${interactionId})`);
  }

  /**
   * Trigger an interaction status changed event
   */
  triggerInteractionStatusChanged(interactionId: string, status: string): void {
    this.sendEventToIframe({
      type: CHANNEL_NAMES.INTERACTION_STATUS_CHANGED,
      interactionId,
      status,
    });
    this.log(`Event: interaction-status-changed (${interactionId}, ${status})`);
  }

  /**
   * Trigger an interaction updated event
   */
  triggerInteractionUpdated(interactionId: string, payload: unknown): void {
    this.sendEventToIframe({
      type: CHANNEL_NAMES.INTERACTION_UPDATED,
      interactionId,
      event: "interaction.update",
      payload,
    });
    this.log(`Event: interaction-updated (${interactionId})`);
  }

  /**
   * Trigger a consult status changed event
   */
  triggerConsultStatusChanged(
    interactionId: string,
    consultStatus: string,
    consultParty?: string,
    error?: string
  ): void {
    this.sendEventToIframe({
      type: CHANNEL_NAMES.CONSULT_STATUS_CHANGED,
      interactionId,
      consultStatus,
      consultParty,
      error,
    });
    this.log(`Event: consult-status-changed (${interactionId}, ${consultStatus})`);
  }

  /**
   * Trigger a feed message event
   */
  triggerFeedMessage(message: Message): void {
    const { type: messageType, ...rest } = message;
    this.sendEventToIframe({
      type: CHANNEL_NAMES.FEED_MESSAGE,
      messageType,
      ...rest,
    });
    this.log(`Event: feed-message (${message.id})`);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    this.log("MockHost destroyed");
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Only process messages from the iframe
      if (event.source !== this.iframe.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "api-request") {
        return;
      }

      this.handleApiRequest(data);
    };

    window.addEventListener("message", this.messageHandler);
  }

  private handleApiRequest(request: {
    type: string;
    requestId: string;
    method: string;
    params: unknown;
  }): void {
    const startTime = performance.now();
    this.log(`API Request: ${request.method}`, request.params);

    let response: unknown;
    let success = true;
    let error: string | undefined;

    try {
      response = this.processApiMethod(request.method, request.params);
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : "Unknown error";
      this.log(`API Error: ${request.method}`, error);
    }

    const duration = performance.now() - startTime;

    // Log the API call
    const logEntry: ApiCallLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      method: request.method,
      params: request.params,
      response: success ? response : { error },
      success,
      duration,
    };
    this.apiCallLogs.push(logEntry);
    this.onApiCall?.(logEntry);

    // Send response back to iframe
    this.sendResponseToIframe({
      type: "api-response",
      requestId: request.requestId,
      success,
      data: success ? response : undefined,
      error: success ? undefined : error,
    });
  }

  private processApiMethod(method: string, params: unknown): unknown {
    switch (method) {
      // User methods
      case "getUserInfo":
        return this.mockData.userInfo;

      case "getUserInteractions":
        return this.mockData.userInteractions;

      case "getUsers": {
        const p = params as { filter?: string } | undefined;
        if (p?.filter) {
          const filter = p.filter.toLowerCase();
          return this.mockData.users.filter(
            (u) =>
              u.fullName.toLowerCase().includes(filter) ||
              u.email.toLowerCase().includes(filter)
          );
        }
        return this.mockData.users;
      }

      // Interaction methods
      case "getInteraction":
        return this.mockData.interaction;

      // Queue methods
      case "getUserQueues": {
        const p = params as { filter?: string } | undefined;
        if (p?.filter) {
          const filter = p.filter.toLowerCase();
          return this.mockData.userQueues.filter((q) =>
            q.name.toLowerCase().includes(filter)
          );
        }
        return this.mockData.userQueues;
      }

      case "getTransferQueues":
      case "getTransferQueuesInteraction": {
        const p = params as { filter?: string } | undefined;
        if (p?.filter) {
          const filter = p.filter.toLowerCase();
          return this.mockData.transferQueues.filter((q) =>
            q.name.toLowerCase().includes(filter)
          );
        }
        return this.mockData.transferQueues;
      }

      case "getReasonCodes":
        return this.mockData.reasonCodes;

      // Action methods - return success messages
      case "endInteraction":
        return { message: "Interaction ended successfully" };

      case "acceptInteraction":
        return { message: "Interaction accepted successfully" };

      case "startVoiceCall":
        return { message: "Voice call started successfully" };

      case "createVoiceInteraction":
        return { message: "Voice interaction created successfully" };

      case "completeBlindTransfer":
        return true;

      case "singleStepTransfer":
        return { message: "Single step transfer completed successfully" };

      case "consultCall":
        return { message: "Consult call initiated successfully" };

      case "completeAttendedTransfer":
        return { message: "Attended transfer completed successfully" };

      case "attendedTransferWarm":
        return { message: "Warm transfer initiated successfully" };

      case "attendedTransferCancel":
        return { message: "Attended transfer cancelled successfully" };

      case "completeConference":
        return { message: "Conference completed successfully" };

      case "sendDialpadDigit":
        return { message: "Dialpad digit sent successfully" };

      case "insertTextIntoFeedInput":
        return { message: "Text inserted successfully" };

      case "sendRichMediaMessage":
        return { message: "Rich media message sent successfully" };

      case "sendChatMessage":
        return { message: "Chat message sent successfully" };

      case "setAgentStatus":
        return { message: "Agent status updated successfully" };

      case "viewerRemoveInteraction":
        return { message: "Interaction removed from viewer successfully" };

      case "triggerWorkflow": {
        const p = params as { workflowId?: string } | undefined;
        if (!p?.workflowId) {
          throw new Error("workflowId is required");
        }
        return {
          workflowSessionId: `ws-mock-${Date.now()}`,
          message: "Workflow triggered successfully",
        };
      }

      default:
        this.log(`Unknown API method: ${method}`);
        throw new Error(`Unknown API method: ${method}`);
    }
  }

  private sendResponseToIframe(response: {
    type: string;
    requestId: string;
    success: boolean;
    data?: unknown;
    error?: string;
  }): void {
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(response, "*");
    }
  }

  private sendEventToIframe(event: Record<string, unknown>): void {
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(event, "*");
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[MockHost]`, message, data ?? "");
    }
  }
}

