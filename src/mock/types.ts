/**
 * Types for Mock Data
 *
 * These types are used internally by the mock system.
 * Some are simplified versions of the full types in ElementAPI.
 */

// Message type for feed messages
export interface Message {
  id: string;
  interactionId: string;
  text: string;
  from: "customer" | "agent" | "system";
  timestamp: string;
  type: "text" | "media" | "system";
  mediaUrl?: string;
  fileName?: string;
}

// Simplified Interaction type for mock data
// Full type is in ElementAPI but not exported - this captures the key fields
export interface Interaction {
  id: string;
  interactionId: string;
  accountId: string;
  initialCommType: string;
  initialSubCommType: string;
  commType: "phone" | "task" | "messaging" | "email";
  subCommType: string;
  createdFromTransfer: {
    isTransfer: boolean;
    cancelled: boolean;
    type: string | null;
  };
  completion: {
    type: string | null;
    value: string | null;
    displayName: string | null;
    timeUnix?: number;
  };
  lastUpdated?: string;
  completionTimeUnix?: number;
  isAbandoned: boolean;
  isMaxWait: boolean;
  ignoreUserHangup: boolean;
  status: string;
  startTime: string;
  startTimeUnix: number;
  statusUpdatedAt: string;
  statusUpdatedAtUnix: number;
  isCompleted: boolean;
  isCompletedConference?: boolean;
  details: {
    points?: number;
    subject: string;
    languageCodes: string[];
    notes?: string;
    result?: string;
    type?: string;
  };
  custom: Record<string, unknown> & {
    crm: {
      sfdc: {
        screenPopObjects?: unknown;
      };
      msdynamics: {
        screenPopObjects?: unknown;
      };
    };
    crmobjects?: unknown[];
  };
  sourceDetails: {
    name: string;
    callId?: string;
    email?: string;
    phoneNumber: string;
    person: {
      deviceId: string;
      personId: string;
      sessionId: string;
      phoneNumber?: string;
    };
    phoneNumberFormatted: PhoneNumberFormatted;
  };
  linkedIds: {
    edify: {
      personSessions: string[];
    };
  };
  routingDetails: {
    url: string;
    email?: string;
    phoneNumber: string;
    phoneNumberName: string;
    inboundNumber: string;
    inboundNumberName?: string;
    phoneNumberFormatted: PhoneNumberFormatted;
  };
  points: number;
  tags: Array<{
    name: string;
    isRequired: boolean;
    createdBy: string;
    createdAt: string;
    updatedBy: string | null;
    updatedAt: string | null;
    color: string;
    backgroundColor: string;
    iconCode: string;
    weight: number;
  }>;
  tagNames: string[];
  customer: {
    languageCode: string | null;
    channel: string | null;
    uniqueId: string | null;
    liveTranscription: {
      transcribed: boolean;
      active: boolean;
    };
    name: string;
    email: string;
    phoneNumber: PhoneNumberFormatted;
  };
  person?: {
    deviceId: string;
    sessionId: string;
    personId: string;
    phoneNumber?: string;
  };
  assignee: Record<string, unknown>;
  user: InteractionUser;
  relatedUsers: unknown[];
  isMute: boolean;
  isAudio: boolean;
  isVideo: boolean;
  isHold: boolean;
  isCallback: boolean;
  isInVoicemail: boolean;
  isBot: boolean;
  isBotWorkflowSessionId: string | null;
  isExitNoAgents: boolean;
  isRipable: boolean;
  isAID: boolean;
  isAIDCalculated: boolean;
  journey?: {
    query: string;
    value: string;
  };
  transfer?: {
    transferAnswer: boolean;
    transferWarm: boolean;
    isAnswered?: boolean;
    isAttendedTransfer: boolean;
    isBlindTransfer: boolean;
    isExternalTransfer: boolean;
    isTransfer: boolean;
    isWarm?: boolean;
    externalTransferAnswer: boolean;
    externalTransferWarm: boolean;
    externalTransferTo: string | null;
    channel: string | null;
    uniqueId: string | null;
  };
  recording: {
    isRecording: boolean;
    isRecorded: boolean;
    isMuted: boolean;
    direction: string | null;
  };
  hadLiveTranscriptionCustomer: boolean;
  hadLiveTranscriptionUser: boolean;
  hadRecording: boolean;
  integrations: Record<string, unknown>;
  queue: {
    id: string;
    name: string;
    weight: number;
    timezone: string;
    details: {
      customFields: unknown[];
      transfer: {
        queueAccessRequired: boolean;
      };
    };
  };
  nextTrigger: {
    step?: number;
    time?: number;
    trigger: string | null;
  };
  maxWait: {
    time: string | null;
    details: Record<string, unknown>;
  };
  exitNoAgents: {
    details: Record<string, unknown>;
  };
  createdOn: string;
  createdOnUnix: number;
  endTime: string | null;
  metrics: {
    numberOfTransfers: number;
    waitTime: number;
    holdTime: number;
    timeInteracting: number;
    handleTime: number;
    wrapUpTime: number;
    silenceTime: number;
    silencePercentage: string;
  };
  scores: {
    numMessages: number;
    numMessagesUser: number;
    numMessagesCustomer: number;
    overall: string | null;
    selfScore: string | null;
    csat: {
      value: string | null;
      comments: string | null;
    };
    sentiment: {
      overall: string | null;
      overallScore: string | null;
      userReported: string | null;
      user: {
        sentiment: string | null;
        score: string | null;
      };
      customer: {
        sentiment: string | null;
        score: string | null;
      };
    };
  };
  serverName: string | null;
  processId: string | null;
  timeoutTime: string | null;
  isAIDRestricted: boolean;
  viewers?: Array<{
    id: string;
    isAudio: boolean;
    isMuted: boolean;
    isPrivate: boolean;
    createdAt: string;
    channel: string | null;
    type?: "internal" | "external";
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      namePrefix: string | null;
      nameSuffix: string | null;
      fullName: string;
      title: string | null;
      status: {
        voipStatus: string | null;
        statusType: string;
        status: string;
        isAID: boolean;
      };
    };
  }>;
  isElite: boolean;
  callFailed?: {
    error: {
      code: string;
      message: string;
      failReason: string;
      participantId: string;
    };
    timestamp: string;
  };
}

interface PhoneNumberFormatted {
  type: string;
  numberType: string;
  isValid: boolean;
  isPossible: boolean;
  countryCallingCode: string;
  nationalNumber: string;
  number: string;
  country: string;
  numberParts: {
    areaCode: string;
    exchange: string;
    lastFour: string;
  };
  formatted: {
    international: string;
    national: string;
    display: string;
  };
}

interface InteractionUser {
  id: string;
  channel: string | null;
  uniqueId: string | null;
  liveTranscription: {
    transcribed: boolean;
    active: boolean;
  };
  extension: string;
  status: {
    voipStatus: string;
    statusType: string;
    status: string;
    isAID: boolean;
  };
  AIDable: boolean;
  namePrefix: string | null;
  firstName: string;
  lastName: string;
  nameSuffix: string | null;
  title: string | null;
  email: string;
  fullName: string;
  languageCode?: string;
  isMuted?: boolean;
}
