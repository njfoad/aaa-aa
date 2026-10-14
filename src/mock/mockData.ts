/**
 * Mock Data for Development Environment
 *
 * This file contains default mock responses for all ElementAPI methods.
 * Import types from @avaya/infinity-elements-api to ensure type safety.
 *
 * When ElementAPI is updated, TypeScript will catch any mismatches here.
 */

import type {
  GetReasonCodesResponse,
  GetUserInteractionsResponse,
  GetUsersResponse,
  InteractionInfo,
  InteractionQueueInfo,
  ReasonCode,
  UserInfo,
  UserQueueInfo,
} from "@avaya/infinity-elements-api";
import type { Interaction, Message } from "./types";

// ============================================================================
// Mock User Data
// ============================================================================

export const mockUserInfo: UserInfo = {
  userId: "user-mock-001",
  status: "enabled",
  firstName: "Alex",
  lastName: "Developer",
  title: "Senior Agent",
  email: "alex.developer@example.com",
  mobile: "+1-555-123-4567",
  languageCode: "en",
  timezone: "America/New_York",
  licenseType: "premium",
  personalQueueId: "queue-personal-001",
  defaultOutboundQueue: "Sales Queue",
  phoneSpaces: 2,
  messagingSpaces: 5,
  emailSpaces: 10,
  taskSpaces: 5,
  queues: [
    {
      queueId: "queue-001",
      name: "Sales Queue",
      isAccess: true,
      isAutoLogin: true,
    },
    {
      queueId: "queue-002",
      name: "Support Queue",
      isAccess: true,
      isAutoLogin: false,
    },
    {
      queueId: "queue-003",
      name: "VIP Support",
      isAccess: true,
      isAutoLogin: false,
    },
  ],
  tags: [
    {
      tagId: "tag-001",
      name: "Senior Agent",
      backgroundColor: "#3B82F6",
      color: "#FFFFFF",
      iconCode: "star",
    },
    {
      tagId: "tag-002",
      name: "Spanish Speaker",
      backgroundColor: "#10B981",
      color: "#FFFFFF",
      iconCode: "language",
    },
  ],
};

// ============================================================================
// Mock Interaction Data
// ============================================================================

export const mockInteractionInfo: InteractionInfo = {
  id: "int-mock-001",
  interactionId: "int-mock-001",
  status: "connected",
  commType: "phone",
  direction: "inbound",
  customer: {
    name: "John Smith",
    number: "+1-555-987-6543",
    id: "cust-001",
  },
  startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  duration: 300,
  metadata: {
    queueName: "Sales Queue",
    priority: "normal",
  },
};

// Full interaction object for getUserInteractions
export const mockFullInteraction: Interaction = {
  id: "int-mock-001",
  interactionId: "int-mock-001",
  accountId: "account-001",
  initialCommType: "phone",
  initialSubCommType: "inbound",
  commType: "phone",
  subCommType: "inbound",
  createdFromTransfer: {
    isTransfer: false,
    cancelled: false,
    type: null,
  },
  completion: {
    type: null,
    value: null,
    displayName: null,
  },
  isAbandoned: false,
  isMaxWait: false,
  ignoreUserHangup: false,
  status: "connected",
  startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  startTimeUnix: Date.now() - 5 * 60 * 1000,
  statusUpdatedAt: new Date().toISOString(),
  statusUpdatedAtUnix: Date.now(),
  isCompleted: false,
  details: {
    subject: "Product Inquiry",
    languageCodes: ["en"],
    notes: "",
  },
  custom: {
    crm: {
      sfdc: {},
      msdynamics: {},
    },
  },
  sourceDetails: {
    name: "John Smith",
    phoneNumber: "+15559876543",
    person: {
      deviceId: "device-001",
      personId: "person-001",
      sessionId: "session-001",
    },
    phoneNumberFormatted: {
      type: "mobile",
      numberType: "mobile",
      isValid: true,
      isPossible: true,
      countryCallingCode: "1",
      nationalNumber: "5559876543",
      number: "+15559876543",
      country: "US",
      numberParts: {
        areaCode: "555",
        exchange: "987",
        lastFour: "6543",
      },
      formatted: {
        international: "+1 555-987-6543",
        national: "(555) 987-6543",
        display: "(555) 987-6543",
      },
    },
  },
  linkedIds: {
    edify: {
      personSessions: ["session-001"],
    },
  },
  routingDetails: {
    url: "",
    phoneNumber: "+15551234567",
    phoneNumberName: "Main Line",
    inboundNumber: "+15551234567",
    phoneNumberFormatted: {
      type: "landline",
      numberType: "landline",
      isValid: true,
      isPossible: true,
      countryCallingCode: "1",
      nationalNumber: "5551234567",
      number: "+15551234567",
      country: "US",
      numberParts: {
        areaCode: "555",
        exchange: "123",
        lastFour: "4567",
      },
      formatted: {
        international: "+1 555-123-4567",
        national: "(555) 123-4567",
        display: "(555) 123-4567",
      },
    },
  },
  points: 10,
  tags: [],
  tagNames: [],
  customer: {
    languageCode: "en",
    channel: null,
    uniqueId: "cust-001",
    liveTranscription: {
      transcribed: false,
      active: false,
    },
    name: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: {
      type: "mobile",
      numberType: "mobile",
      isValid: true,
      isPossible: true,
      countryCallingCode: "1",
      nationalNumber: "5559876543",
      number: "+15559876543",
      country: "US",
      numberParts: {
        areaCode: "555",
        exchange: "987",
        lastFour: "6543",
      },
      formatted: {
        international: "+1 555-987-6543",
        national: "(555) 987-6543",
        display: "(555) 987-6543",
      },
    },
  },
  assignee: {},
  user: {
    id: "user-mock-001",
    channel: null,
    uniqueId: null,
    liveTranscription: {
      transcribed: false,
      active: false,
    },
    extension: "1001",
    status: {
      voipStatus: "available",
      statusType: "available",
      status: "Available",
      isAID: false,
    },
    AIDable: false,
    namePrefix: null,
    firstName: "Alex",
    lastName: "Developer",
    nameSuffix: null,
    title: "Senior Agent",
    email: "alex.developer@example.com",
    fullName: "Alex Developer",
  },
  relatedUsers: [],
  isMute: false,
  isAudio: true,
  isVideo: false,
  isHold: false,
  isCallback: false,
  isInVoicemail: false,
  isBot: false,
  isBotWorkflowSessionId: null,
  isExitNoAgents: false,
  isRipable: false,
  isAID: false,
  isAIDCalculated: false,
  recording: {
    isRecording: true,
    isRecorded: false,
    isMuted: false,
    direction: null,
  },
  hadLiveTranscriptionCustomer: false,
  hadLiveTranscriptionUser: false,
  hadRecording: false,
  integrations: {},
  queue: {
    id: "queue-001",
    name: "Sales Queue",
    weight: 10,
    timezone: "America/New_York",
    details: {
      customFields: [],
      transfer: {
        queueAccessRequired: false,
      },
    },
  },
  nextTrigger: {
    trigger: null,
  },
  maxWait: {
    time: null,
    details: {},
  },
  exitNoAgents: {
    details: {},
  },
  createdOn: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  createdOnUnix: Date.now() - 5 * 60 * 1000,
  endTime: null,
  metrics: {
    numberOfTransfers: 0,
    waitTime: 30,
    holdTime: 0,
    timeInteracting: 270,
    handleTime: 300,
    wrapUpTime: 0,
    silenceTime: 15,
    silencePercentage: "5%",
  },
  scores: {
    numMessages: 0,
    numMessagesUser: 0,
    numMessagesCustomer: 0,
    overall: null,
    selfScore: null,
    csat: {
      value: null,
      comments: null,
    },
    sentiment: {
      overall: null,
      overallScore: null,
      userReported: null,
      user: {
        sentiment: null,
        score: null,
      },
      customer: {
        sentiment: null,
        score: null,
      },
    },
  },
  serverName: null,
  processId: null,
  timeoutTime: null,
  isAIDRestricted: false,
  isElite: false,
};

// ============================================================================
// Mock Users List (for getUsers)
// ============================================================================

export const mockUsers: GetUsersResponse[] = [
  {
    id: "user-002",
    firstName: "Sarah",
    lastName: "Johnson",
    fullName: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    mobile: "+1-555-234-5678",
    presence: "available",
    cxStatus: {
      statusType: "available",
      status: "Available",
    },
    extension: "1002",
    eligible: true,
  },
  {
    id: "user-003",
    firstName: "Mike",
    lastName: "Williams",
    fullName: "Mike Williams",
    email: "mike.williams@example.com",
    mobile: "+1-555-345-6789",
    presence: "busy",
    cxStatus: {
      statusType: "busy",
      status: "On Call",
    },
    extension: "1003",
    eligible: false,
  },
  {
    id: "user-004",
    firstName: "Emily",
    lastName: "Davis",
    fullName: "Emily Davis",
    email: "emily.davis@example.com",
    mobile: null,
    presence: "away",
    cxStatus: {
      statusType: "away",
      status: "Lunch Break",
    },
    extension: "1004",
    eligible: false,
  },
  {
    id: "user-005",
    firstName: "Chris",
    lastName: "Martinez",
    fullName: "Chris Martinez",
    email: "chris.martinez@example.com",
    mobile: "+1-555-456-7890",
    presence: "available",
    cxStatus: {
      statusType: "available",
      status: "Available",
    },
    extension: "1005",
    eligible: true,
  },
];

// ============================================================================
// Mock User Interactions Response
// ============================================================================

export const mockUserInteractions: GetUserInteractionsResponse = {
  interactions: [mockFullInteraction],
  viewing: [],
  combinedIds: ["int-mock-001"],
  queue: {
    loggedIn: [
      {
        queueId: "queue-001",
        name: "Sales Queue",
        queueWeight: 10,
        timeZone: "America/New_York",
        extension: 1001,
        createdOn: new Date().toISOString(),
        createdOnUnix: Date.now(),
      },
    ],
    access: [
      {
        queueId: "queue-001",
        name: "Sales Queue",
        queueWeight: 10,
        timeZone: "America/New_York",
        extension: 1001,
      },
      {
        queueId: "queue-002",
        name: "Support Queue",
        queueWeight: 5,
        timeZone: "America/New_York",
        extension: null,
      },
    ],
  },
  user: {
    id: "user-mock-001",
    firstName: "Alex",
    lastName: "Developer",
    fullName: "Alex Developer",
    title: "Senior Agent",
    email: "alex.developer@example.com",
    extension: "1001",
  },
};

// ============================================================================
// Mock Queues
// ============================================================================

export const mockUserQueues: UserQueueInfo[] = [
  { id: "queue-001", name: "Sales Queue" },
  { id: "queue-002", name: "Support Queue" },
  { id: "queue-003", name: "VIP Support" },
  { id: "queue-004", name: "Billing" },
];

export const mockTransferQueues: InteractionQueueInfo[] = [
  {
    id: "queue-001",
    name: "Sales Queue",
    extension: "2001",
    waitingInteractions: 3,
    countOfCallbacks: 1,
    countActiveAgents: 5,
    totalCurrentInteractions: 8,
    connectedInteractions: 5,
    avgInteractionWaitTime: 45,
    weight: 10,
    eligible: true,
  },
  {
    id: "queue-002",
    name: "Support Queue",
    extension: "2002",
    waitingInteractions: 7,
    countOfCallbacks: 2,
    countActiveAgents: 8,
    totalCurrentInteractions: 15,
    connectedInteractions: 8,
    avgInteractionWaitTime: 120,
    weight: 5,
    eligible: true,
  },
  {
    id: "queue-003",
    name: "VIP Support",
    extension: "2003",
    waitingInteractions: 0,
    countOfCallbacks: 0,
    countActiveAgents: 2,
    totalCurrentInteractions: 2,
    connectedInteractions: 2,
    avgInteractionWaitTime: 10,
    weight: 20,
    eligible: true,
  },
];

// ============================================================================
// Mock Reason Codes
// ============================================================================

export const mockReasonCodes: ReasonCode[] = [
  {
    id: "reason-001",
    reason: "Lunch Break",
    type: "away",
    typeDisplay: "Away",
    isDisabled: false,
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "admin",
    updatedAt: null,
    updatedBy: null,
    inWorkflowId: null,
    inWorkflowVersionId: null,
    outWorkflowId: null,
    outWorkflowVersionId: null,
    queryFieldId: null,
  },
  {
    id: "reason-002",
    reason: "Meeting",
    type: "away",
    typeDisplay: "Away",
    isDisabled: false,
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "admin",
    updatedAt: null,
    updatedBy: null,
    inWorkflowId: null,
    inWorkflowVersionId: null,
    outWorkflowId: null,
    outWorkflowVersionId: null,
    queryFieldId: null,
  },
  {
    id: "reason-003",
    reason: "Training",
    type: "busy",
    typeDisplay: "Busy",
    isDisabled: false,
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "admin",
    updatedAt: null,
    updatedBy: null,
    inWorkflowId: null,
    inWorkflowVersionId: null,
    outWorkflowId: null,
    outWorkflowVersionId: null,
    queryFieldId: null,
  },
  {
    id: "reason-004",
    reason: "Break",
    type: "away",
    typeDisplay: "Away",
    isDisabled: false,
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "admin",
    updatedAt: null,
    updatedBy: null,
    inWorkflowId: null,
    inWorkflowVersionId: null,
    outWorkflowId: null,
    outWorkflowVersionId: null,
    queryFieldId: null,
  },
];

export const mockReasonCodesResponse: GetReasonCodesResponse = {
  reasons: mockReasonCodes,
};

// ============================================================================
// Mock Feed Message
// ============================================================================

export const mockFeedMessage: Message = {
  id: "msg-001",
  interactionId: "int-mock-001",
  text: "Hello, I need help with my order.",
  from: "customer",
  timestamp: new Date().toISOString(),
  type: "text",
};

// ============================================================================
// Complete Mock Data Store
// ============================================================================

export interface MockDataStore {
  userInfo: UserInfo;
  interaction: InteractionInfo;
  fullInteraction: Interaction;
  users: GetUsersResponse[];
  userInteractions: GetUserInteractionsResponse;
  userQueues: UserQueueInfo[];
  transferQueues: InteractionQueueInfo[];
  reasonCodes: GetReasonCodesResponse;
}

export const defaultMockData: MockDataStore = {
  userInfo: mockUserInfo,
  interaction: mockInteractionInfo,
  fullInteraction: mockFullInteraction,
  users: mockUsers,
  userInteractions: mockUserInteractions,
  userQueues: mockUserQueues,
  transferQueues: mockTransferQueues,
  reasonCodes: mockReasonCodesResponse,
};

/**
 * Create a fresh copy of mock data (useful for resetting state)
 */
export function createMockData(): MockDataStore {
  return JSON.parse(JSON.stringify(defaultMockData));
}

