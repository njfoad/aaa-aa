**@avaya/infinity-elements-api v1.3.0**

***

# @avaya/infinity-elements-api

[![npm version](https://img.shields.io/npm/v/@avaya/infinity-elements-api.svg)](https://www.npmjs.com/package/@avaya/infinity-elements-api)

Element API for InfinityElements to interact with the Infinity Extensibility Framework. This library provides a robust interface for communication between web components and the Infinity Agent Desktop.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
  - [Basic Setup](#basic-setup)
  - [React Example](#react-example)
- [Core Concepts](#core-concepts)
- [Development](#development)
- [License](#license)
- [Related Packages](#related-packages)
- [API Documentation](#api-documentation)

## Installation

```bash
npm install @avaya/infinity-elements-api
```

## Features

- **🔌 Easy Integration** - Simple API for web components to interact with core-agent-ui
- **📡 Event-Driven** - Subscribe to interaction events (accepted, ended, status changes)
- **🎯 Type-Safe** - Full TypeScript support with comprehensive type definitions
- **📞 Call Management** - Complete call control (transfer, consult, hold, mute, etc.)
- **👤 Agent Management** - Get/set agent status, access user information
- **💬 Messaging** - Send rich media messages and interact with the chat feed

## Quick Start

### Basic Setup

```typescript
import { ElementAPI } from "@avaya/infinity-elements-api";

// Create API instance
const api = new ElementAPI();

// Get user information
const userInfo = await api.getUserInfo();
console.log("Agent:", userInfo.firstName, userInfo.lastName);
console.log("Email:", userInfo.email);

// Listen for interaction events
api.onInteractionAccepted((interactionId) => {
  console.log("Interaction accepted:", interactionId);
});

api.onInteractionEnded((interactionId) => {
  console.log("Interaction ended:", interactionId);
});

// Don't forget to clean up!
// In React: useEffect cleanup, in plain JS: on element unmount
api.destroy();
```

### React Example

```typescript
import { ElementAPI } from "@avaya/infinity-elements-api";
import { useEffect, useState } from "react";

function MyElement() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const api = new ElementAPI();

    // Fetch user info on mount
    api.getUserInfo().then(setUserInfo);

    // Subscribe to interaction events
    const unsubscribe = api.onInteractionAccepted((interactionId) => {
      console.log("Interaction accepted:", interactionId);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      api.destroy();
    };
  }, [api]);

  return (
    <div>
      <h1>Agent: {userInfo?.displayName}</h1>
      <p>Status: {userInfo?.agentStatus}</p>
    </div>
  );
}
```

## Core Concepts

### ElementAPI

The main class for interacting with the Infinity Extensibility Framework. It handles:

- API requests to core-agent-ui via `window.postMessage`
- Event subscriptions for interaction lifecycle
- Inter-element communication via the host (postMessage)

### Triggering Workflows

Elements can programmatically trigger AXP workflows using `triggerWorkflow()`. The host (agent UI) executes the call so credentials are never exposed to the element.

```typescript
// Trigger a workflow with input parameters
const result = await api.triggerWorkflow({
  workflowId: "wf-refund-process",
  inputData: { orderId: "ORD-123", amount: 49.99 },
});
console.log("Workflow started:", result.workflowSessionId);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | `string` | Yes | ID of the workflow to execute |
| `workflowVersion` | `string` | No | Workflow version (host defaults to `"latest"` when omitted) |
| `interactionId` | `string` | No | Interaction context override (auto-attached for interaction-level widgets) |
| `inputData` | `Record<string, unknown>` | No | Key/value data forwarded to the workflow as inputs |

**Workflow → Element communication pattern:**

Workflows communicate results back to elements through the shared interaction object rather than a direct return channel:

1. Element calls `triggerWorkflow({ workflowId, inputData })`
2. Workflow executes (may be short or long-running)
3. Workflow writes results via an **Update Interaction** action, then signals completion with an **Interaction Data Reload** action
4. Element receives `onInteractionDataReload` and reads updated data via `getInteraction()`

```typescript
// Listen for workflow results before triggering
const unsubscribe = api.onInteractionDataReload(async (interactionId) => {
  const updated = await api.getInteraction({ interactionId });
  console.log("Workflow result:", updated.metadata);
});

// Trigger the workflow
await api.triggerWorkflow({
  workflowId: "wf-refund-process",
  inputData: { orderId: "ORD-123", amount: 49.99 },
});
```

**Notes:**

- Any workflow can be triggered — no tagging or pre-registration in IEF is required
- Rate limiting and permissions are enforced by the workflow engine, not by IEF
- Error handling: if the workflow cannot be started (invalid ID, parameters, or permissions), the promise rejects with a structured error

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Generate documentation
npm run docs

# Lint
npm run lint
```

## License

MIT

## Related Packages

- [`@avaya/infinity-elements-sdk`](https://www.npmjs.com/package/@avaya/infinity-elements-sdk) - CLI tool for scaffolding InfinityElement projects

# API Documentation

## DialpadDigit

Defined in: [api/ElementAPI.ts:84](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L84)

DTMF dialpad digits (0-9) for sending tones during calls

### Example

```typescript
import { DialpadDigit } from '@avaya/infinity-elements-api';

await api.sendDialpadDigit(DialpadDigit.Five, null, false);
```

***

## ElementAPI

Defined in: [api/ElementAPI.ts:694](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L694)

ElementAPI - Main API for web components to interact with the Infinity Extensibility Framework

This is the primary interface that elements use to communicate with core-agent-ui.
Uses window.postMessage for API requests/responses and events.

## Sandboxed Iframe Environment

**IMPORTANT:** Elements run in sandboxed iframes using `srcdoc`, which means:
- `window.location.origin` returns `"null"` (the literal string "null")
- `document.referrer` may be empty
- Direct access to parent window properties is blocked
- BroadcastChannel doesn't work (requires valid origin for message scoping)

All communication with the host (core-agent-ui) must go through `window.postMessage`.
The host has a valid origin and can make HTTP requests, handle OAuth, etc.

### Examples

```typescript
import { ElementAPI } from '@avaya/infinity-elements-api';

const api = new ElementAPI({
  elementId: 'my-element',
  timeout: 5000,
  debug: true
});
```

```typescript
const userInfo = await api.getUserInfo();
console.log('Agent name:', userInfo.firstName, userInfo.lastName);
console.log('Email:', userInfo.email);
```

```typescript
api.onInteractionAccepted((interactionId) => {
  console.log('Interaction accepted:', interactionId);
});

api.onInteractionEnded((interactionId) => {
  console.log('Interaction ended:', interactionId);
});
```

### Extends

- [`ElementAPIEvents`](#elementapievents)

### Constructors

#### Constructor

```ts
new ElementAPI(options: ElementAPIOptions): ElementAPI;
```

Defined in: [api/ElementAPI.ts:728](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L728)

Creates a new ElementAPI instance

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElementAPIOptions`](#elementapioptions) |

##### Returns

[`ElementAPI`](#elementapi)

##### Example

```typescript
const api = new ElementAPI({
  elementId: 'my-custom-element',
  timeout: 10000,
  debug: true
});
```

##### Overrides

[`ElementAPIEvents`](#elementapievents).[`constructor`](#constructor-1)

### Methods

#### destroy()

```ts
destroy(): void;
```

Defined in: [api/ElementAPI.ts:769](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L769)

Clean up resources when the React component is unmounted or no longer needed

Removes all event listeners, closes channels, and clears pending requests.
Call this method in your React component's cleanup/unmount lifecycle.

##### Returns

`void`

##### Example

```typescript
// In a React component
useEffect(() => {
  const api = new ElementAPI();
  return () => {
    api.destroy(); // Cleanup on unmount
  };
}, []);
```

#### getInteraction()

```ts
getInteraction(options?: InteractionContextOptions): Promise<InteractionInfo>;
```

Defined in: [api/ElementAPI.ts:820](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L820)

Get information about the current active interaction

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<[`InteractionInfo`](#interactioninfo)\>

Promise resolving to the interaction information

##### Throws

Error if no active interaction exists

##### Examples

```typescript
try {
  const interaction = await api.getInteraction();
  console.log('Interaction ID:', interaction.interactionId);
  console.log('Customer:', interaction.customer?.name);
  console.log('Status:', interaction.status);
} catch (error) {
  console.error('No active interaction');
}
```

```typescript
const interaction = await api.getInteraction({ interactionId: 'int-123' });
console.log('Status:', interaction.status);
```

#### getUserInfo()

```ts
getUserInfo(): Promise<UserInfo>;
```

Defined in: [api/ElementAPI.ts:842](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L842)

Get information about the current logged-in user/agent

##### Returns

`Promise`\<[`UserInfo`](#userinfo)\>

Promise resolving to the user information including agent status, queues, and profile

##### Example

```typescript
const userInfo = await api.getUserInfo();
console.log('Agent:', userInfo.firstName, userInfo.lastName);
console.log('Queues:', userInfo.queues);
console.log('Email:', userInfo.email);
```

#### getAgentState()

```ts
getAgentState(): Promise<GetAgentStateResponse>;
```

Defined in: [api/ElementAPI.ts:852](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L852)

Get current agent state from the Agent Desktop cache (RTK / active user).
Does not call the backend; safe to call on element load before any `agent-state-changed` event.

##### Returns

`Promise`\<[`GetAgentStateResponse`](#getagentstateresponse)\>

Promise resolving to availability, CX login (`isAID`), agent id, queues with login flags, etc.

#### getConfig()

```ts
getConfig(): Promise<IEFConfig>;
```

Defined in: [api/ElementAPI.ts:890](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L890)

Get a snapshot of the element's IEF context — the interaction that
spawned it (if any), the current user id, the workflow session's
engagement id (if active), and the user's CRM configuration.

Safe to call as soon as the element loads — no event waiting required.
Returns a point-in-time snapshot; does not subscribe to updates.

The returned object is **expandable** — future releases may add new
properties without breaking existing consumers. Read by property name
rather than destructuring against a fixed key set.

##### Returns

`Promise`\<[`IEFConfig`](#iefconfig)\>

Promise resolving to the IEF context snapshot

##### Example

```typescript
const config = await api.getConfig();

// Identity — who the agent is and which customer session this belongs to
console.log('Agent:', config.userId);
console.log('Session:', config.engagementId);

// Interaction context — which interaction spawned this element
if (config.originalInteraction) {
  console.log('Channel:', config.originalInteraction.commType);
  console.log('Interaction ID:', config.originalInteraction.id);
}

// CRM-aware behaviour — act on admin-configured settings
if (config.crmConfig?.clickToDial) {
  enableClickToDial();
}
```

#### getUserInteractions()

```ts
getUserInteractions(params?: GetUserInteractionsParams): Promise<GetUserInteractionsResponse>;
```

Defined in: [api/ElementAPI.ts:923](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L923)

Get user interactions including owned and viewing interactions

Retrieves all active interactions for the current or specified user,
including interactions they own and ones they are viewing.
Optionally includes queue and user details.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`GetUserInteractionsParams`](#getuserinteractionsparams) | Optional parameters |

##### Returns

`Promise`\<[`GetUserInteractionsResponse`](#getuserinteractionsresponse)\>

Promise resolving to user interactions data

##### Examples

```typescript
// Get current user's interactions with full details
const result = await api.getUserInteractions({ details: true });
console.log('Owned interactions:', result.interactions);
console.log('Viewing interactions:', result.viewing);
console.log('Logged in queues:', result.queue.loggedIn);
```

```typescript
// Get interactions without queue/user details for better performance
const result = await api.getUserInteractions({ details: false });
const totalCount = result.interactions.length + result.viewing.length;
console.log('Total active interactions:', totalCount);
```

#### getUsers()

```ts
getUsers(params?: {
  interactionId?: string;
  filter?: string;
}): Promise<GetUsersResponse[]>;
```

Defined in: [api/ElementAPI.ts:984](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L984)

Get a list of users in Infinity

Returns users available for transfer or consult operations. Returns up to 100 users.

- **App Level (sidebar widgets):** Provide `interactionId` parameter
- **Interaction Level (interaction widgets):** Omit `interactionId`, uses interaction context automatically

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | \{ `interactionId?`: `string`; `filter?`: `string`; \} | Optional parameters |
| `params.interactionId?` | `string` | Required for app-level widgets, optional for interaction-level widgets |
| `params.filter?` | `string` | Optional substring search against user name fields |

##### Returns

`Promise`\<[`GetUsersResponse`](#getusersresponse)[]\>

Promise resolving to array of user information

##### Examples

```typescript
const users = await api.getUsers();
users.forEach(user => {
  console.log(`${user.fullName} - ${user.cxStatus.status} - ${user.presence}`);
});
```

```typescript
const users = await api.getUsers({ filter: 'john' });
console.log('Found users:', users.map(u => u.fullName));
```

```typescript
const users = await api.getUsers({ interactionId: 'int-123' });
users.forEach(user => {
  console.log(`${user.fullName} - ${user.cxStatus.status} - ${user.presence}`);
});
```

```typescript
const users = await api.getUsers({
  interactionId: 'int-123',
  filter: 'john'
});
```

```typescript
const users = await api.getUsers({ filter: searchInput });
const eligibleUsers = users.filter(u => u.eligible);
eligibleUsers.forEach(user => {
  console.log(`${user.fullName} (${user.extension}) - ${user.cxStatus.status}`);
});
```

#### viewerRemoveInteraction()

```ts
viewerRemoveInteraction(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1008](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1008)

Remove the current interaction from the viewer

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.viewerRemoveInteraction();
```

```typescript
await api.viewerRemoveInteraction({ interactionId: 'int-123' });
```

#### endInteraction()

```ts
endInteraction(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1037](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1037)

End the current interaction

Terminates the active interaction and disconnects the call.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.endInteraction();
console.log('Interaction ended');
```

```typescript
await api.endInteraction({ interactionId: 'int-123' });
```

#### startVoiceCall()

```ts
startVoiceCall(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1063](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1063)

Start a voice call for the current interaction

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.startVoiceCall();
```

```typescript
await api.startVoiceCall({ interactionId: 'int-123' });
```

#### createVoiceInteraction()

```ts
createVoiceInteraction(params: CreateVoiceInteractionParams): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1089](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1089)

Create a new voice interaction with a Queue ID and Phone Number

Creates a new outbound voice call interaction to the specified phone number
and assigns it to the specified queue.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`CreateVoiceInteractionParams`](#createvoiceinteractionparams) | Voice interaction parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Example

```typescript
await api.createVoiceInteraction({
  phoneNumber: '+1234567890',
  queueId: '003'
});
```

#### createInteraction()

```ts
createInteraction(options: CreateInteractionOptions): Promise<{
  interactionId: string;
}>;
```

Defined in: [api/ElementAPI.ts:1132](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1132)

Entry point for all outbound channel creation — email, SMS, chat, task, voice.

Generic replacement for channel-specific creation methods.
The Agent UI validates the request, opens the appropriate composition window
pre-populated with the provided values, and returns the new interaction ID.

createVoiceInteraction() remains available as a thin wrapper and is not deprecated.
No new channel-specific methods will be added — use commType instead.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CreateInteractionOptions`](#createinteractionoptions) | Channel type, recipient, and content parameters |

##### Returns

`Promise`\<\{
  `interactionId`: `string`;
\}\>

Object containing the newly created interaction ID

##### Throws

INVALID_COMM_TYPE if commType is not a supported value

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Examples

```typescript
const { interactionId } = await api.createInteraction({
  commType: "email",
  to: "customer@example.com",
  subject: "Follow-up",
  body: "Dear customer...",
});
```

```typescript
const { interactionId } = await api.createInteraction({
  commType: "task",
  subject: "Follow-up callback",
  navigateTo: false,
});
```

#### triggerWorkflow()

```ts
triggerWorkflow(params: TriggerWorkflowParams): Promise<TriggerWorkflowResponse>;
```

Defined in: [api/ElementAPI.ts:1199](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1199)

Trigger an AXP workflow by ID.

Wraps the platform `startWorkflowSession` API. The host (agent UI) executes
the actual call so credentials are never exposed to the element. When
`interactionId` is omitted the host automatically attaches the current
interaction context.

**Workflow → element communication pattern:**
Results flow back through the interaction object rather than a direct return
channel. The workflow performs an Update Interaction action with the result
data, then an Interaction Data Reload action. The element receives the update
via [onInteractionDataReload](#oninteractiondatareload-2)
and reads the updated data via [getInteraction](#getinteraction).

Rate limiting and permissions are enforced by the workflow engine, not by IEF.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`TriggerWorkflowParams`](#triggerworkflowparams) | Workflow trigger parameters |

##### Returns

`Promise`\<[`TriggerWorkflowResponse`](#triggerworkflowresponse)\>

Confirmation with the workflow session ID

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved (provide via params or navigate to an interaction)

##### Throws

MISSING_REQUIRED_PARAMS if workflowId is not provided

##### Throws

Error if the workflow engine rejects the request (invalid ID, invalid parameters, permissions, or network failure)

##### Examples

```typescript
const result = await api.triggerWorkflow({
  workflowId: 'wf-refund-process',
});
console.log('Workflow started:', result.workflowSessionId);
```

```typescript
const result = await api.triggerWorkflow({
  workflowId: 'wf-crm-update',
  inputData: { orderId: 'ORD-123', amount: 49.99 },
});
```

```typescript
// 1. Listen for workflow results before triggering
api.onInteractionDataReload(async (interactionId) => {
  const updated = await api.getInteraction({ interactionId });
  console.log('Workflow result:', updated.metadata);
});

// 2. Trigger the workflow
await api.triggerWorkflow({
  workflowId: 'wf-refund-process',
  inputData: { orderId: 'ORD-123', amount: 49.99 },
});
```

#### navigateTo()

```ts
navigateTo(to: string, options?: NavigateToOptions): Promise<NavigateToResponse>;
```

Defined in: [api/ElementAPI.ts:1280](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1280)

Navigate the agent desktop to a different view inside the agent app.

The element passes a fully-resolved relative URL as `to`; the host
validates the URL shape and consults a host-side blacklist before
forwarding to react-router. Because react-router is scoped to the agent
app's basename (`/app/agent/`), only paths inside the agent app are
reachable — external URLs, protocol-relative URLs, and `javascript:` /
`data:` schemes are rejected at the validator.

Signature mirrors react-router's `navigate(to, options?)` so partners
already familiar with react-router get the shape they expect.

**Requirements:** This method is part of the Infinity Extensibility
Framework and requires the `fg_infinity_extensibility_framework` feature
flag to be enabled in the agent desktop. When disabled, infinity elements
cannot load so this API is not available.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `to` | `string` | Relative path to navigate to (e.g. `/interactions/abc/feed`) |
| `options?` | [`NavigateToOptions`](#navigatetooptions) | Reserved per-call options (`replace`, `state`); see [NavigateToOptions](#navigatetooptions). None are honored by the host in v1.0.0. |

##### Returns

`Promise`\<[`NavigateToResponse`](#navigatetoresponse)\>

Navigation confirmation with the resulting path

##### Throws

Error if the Infinity Extensibility Framework is not enabled (elements won't load)

##### Throws

NAVIGATION_BLOCKED if the URL is malformed, external, traverses paths, or is host-blacklisted

##### Throws

NAVIGATION_FAILED if navigation could not be completed

##### Examples

```typescript
await api.navigateTo("/interactions");
```

```typescript
await api.navigateTo(`/interactions/${interactionId}/profile`);
```

```typescript
await api.navigateTo(
  `/interactions/${interactionId}/email/${messageId}/reply`,
);
```

```typescript
await api.navigateTo(
  `/interactions/${interactionId}/custom-tab/${tabId}`,
);
```

```typescript
await api.navigateTo("/interactions", { replace: true });
```

### Scope & Limits (v1.0.0)

- **External URLs:** Not allowed. `to` must be a relative path starting
  with `/` (and not `//`); render external content inside your own iframe.
- **Path traversal & unsafe characters:** Rejected by the host validator.
  Each path segment must contain at least one alphanumeric character and
  only use `[a-zA-Z0-9._-]`.
- **Length cap:** `to` is capped at 200 characters.
- **Semantics:** Imperative — the agent cannot opt out; navigation runs
  immediately after the host validates the URL.
- **Admin gating:** None in v1.0.0. Any Element loaded under the IEF
  feature flag may call `navigateTo`. Runtime safeguards: rate limit
  (10 req/sec/source), URL shape validator, host-side blacklist.
- **Multi-panel:** Route-level. The whole agent-desktop view changes; the
  active interaction is not disrupted (voice/audio and per-interaction
  state are independent of the routed view).

#### holdInteraction()

```ts
holdInteraction(interactionId: string): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1309](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1309)

Places an active voice interaction on hold.

The customer hears hold music (if configured by the tenant).
The agent desktop reflects the "On Hold" state once the backend confirms.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The voice interaction to place on hold |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

HOLD_MUTE_VOICE_ONLY if the interaction is not a voice channel

##### Throws

INTERACTION_NOT_CONNECTED if the interaction is not in connected state

##### Throws

INTERACTION_ALREADY_ON_HOLD if the interaction is already on hold

##### Example

```typescript
await api.holdInteraction("interaction-id-123");
```

#### resumeInteraction()

```ts
resumeInteraction(interactionId: string): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1332](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1332)

Resumes a voice interaction from hold, restoring audio between agent and customer.

Counterpart to holdInteraction().

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The voice interaction to resume |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

HOLD_MUTE_VOICE_ONLY if the interaction is not a voice channel

##### Throws

INTERACTION_NOT_ON_HOLD if the interaction is not currently on hold

##### Example

```typescript
await api.resumeInteraction("interaction-id-123");
```

#### muteInteraction()

```ts
muteInteraction(interactionId: string): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1356](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1356)

Mutes the agent's microphone during an active voice interaction.

The customer can no longer hear the agent. The agent can still hear the customer.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The voice interaction to mute |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

HOLD_MUTE_VOICE_ONLY if the interaction is not a voice channel

##### Throws

INTERACTION_NOT_CONNECTED if the interaction is not in connected state

##### Throws

ALREADY_MUTED if the microphone is already muted

##### Example

```typescript
await api.muteInteraction("interaction-id-123");
```

#### unmuteInteraction()

```ts
unmuteInteraction(interactionId: string): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1379](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1379)

Restores the agent's microphone during an active voice interaction.

Counterpart to muteInteraction().

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The voice interaction to unmute |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

HOLD_MUTE_VOICE_ONLY if the interaction is not a voice channel

##### Throws

NOT_MUTED if the microphone is not currently muted

##### Example

```typescript
await api.unmuteInteraction("interaction-id-123");
```

#### wrapUpInteraction()

```ts
wrapUpInteraction(interactionId: string, options: WrapUpInteractionOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1408](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1408)

Wraps up a completed interaction with a disposition code.

Applies the disposition code and notes, then removes the interaction from
the agent desktop. The interaction must no longer be in "Connected" state —
call this after the customer has disconnected or the agent has ended the call.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The interaction to wrap up |
| `options` | [`WrapUpInteractionOptions`](#wrapupinteractionoptions) | Disposition code and optional notes |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

INTERACTION_STILL_ACTIVE if the interaction is still in connected state

##### Throws

INVALID_DISPOSITION_CODE if the disposition code is not in the configured list

##### Example

```typescript
await api.wrapUpInteraction("interaction-id-123", {
  dispositionCode: "Resolved",
  notes: "Customer issue resolved",
});
```

#### closeUnresolved()

```ts
closeUnresolved(interactionId: string): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1435](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1435)

Parks an interaction without marking it as complete.

Removes the interaction from the agent's active list. The interaction
returns to the queue or remains available for re-assignment. No
disposition code is required.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | The interaction to park |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Example

```typescript
await api.closeUnresolved("interaction-id-123");
```

#### updateInteraction()

```ts
updateInteraction(interactionId: string | undefined, fields: UpdateInteractionFields): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1475](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1475)

Updates mutable fields on an active interaction.

Writes any combination of customer details (name, phone, email) and interaction
metadata (subject, body, notes, interactionType, endResult, routingPhone,
routingPhoneName, customerLanguageCode, fields). At least one field must be
provided. After a successful update the host broadcasts an `onInteractionDataReload`
event so all listening Elements can refresh their view.

Note: a single updateInteraction() call fires `onInteractionDataReload` twice in
immediate succession — consumers should debounce that event handler.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` \| `undefined` | The interaction to update (optional — uses current context if omitted) |
| `fields` | [`UpdateInteractionFields`](#updateinteractionfields) | Fields to update; at least one must be set |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Confirmation message on success

##### Throws

AGENT_NOT_LOGGED_IN if the agent is not in CX logged-in state

##### Throws

NO_INTERACTION_ID if no interaction ID can be resolved

##### Throws

NO_FIELDS_TO_UPDATE if all fields are omitted

##### Throws

ROUTING_PHONE_NAME_REQUIRED if routingPhone is provided without routingPhoneName

##### Example

```typescript
await api.updateInteraction("interaction-id-123", {
  name: "Jane Smith",
  subject: "Billing enquiry",
  notes: "Customer called about invoice #42",
  routingPhone: "+1-555-0200",
  routingPhoneName: "Main Queue",
  customerLanguageCode: "fr-FR",
});
```

#### completeBlindTransfer()

```ts
completeBlindTransfer(options: BlindTransferOptions): Promise<boolean>;
```

Defined in: [api/ElementAPI.ts:1504](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1504)

Complete a blind transfer

Transfers the call to another agent or number without consultation.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`BlindTransferOptions`](#blindtransferoptions) | Transfer configuration |

##### Returns

`Promise`\<`boolean`\>

Promise resolving to true if successful

##### Example

```typescript
const interaction = await api.getInteraction();
await api.completeBlindTransfer({
  interactionId: interaction.interactionId,
  transferTo: 'agent@example.com',
  transferToName: 'John Doe',
  transferCallerIdType: 'internal'
});
```

#### singleStepTransfer()

```ts
singleStepTransfer(params: SingleStepTransferParams): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1524](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1524)

Perform a single-step transfer

Transfers the interaction directly to the specified target.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`SingleStepTransferParams`](#singlesteptransferparams) | Transfer parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Example

```typescript
await api.singleStepTransfer({
  targetId: 'user123',
  targetName: 'Support Team'
});
```

#### consultCall()

```ts
consultCall(options: ConsultCallOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1571](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1571)

Initiate a consult call

Starts a consultation with another agent, phone number, or queue while keeping
the original caller on hold.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ConsultCallOptions`](#consultcalloptions) | Consult call configuration |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
const interaction = await api.getInteraction();
await api.consultCall({
  interactionId: interaction.interactionId,
  transferTo: 'supervisor@example.com'
});
```

```typescript
await api.consultCall({
  interactionId: interaction.interactionId,
  phoneNumber: '+1234567890'
});
```

```typescript
// Get available queues first
const queues = await api.getTransferQueuesInteraction();
const targetQueue = queues.find(q => q.name === 'Support Queue');

await api.consultCall({
  interactionId: interaction.interactionId,
  queueId: targetQueue.id
});
```

#### transferInteraction()

```ts
transferInteraction(options: TransferInteractionOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1613](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1613)

Generic transfer entry point for all channels — blind for all, consult for voice only.

Transfers an interaction to an agent, queue, or external address.
Digital interactions (email, SMS, chat, task) support blind transfer only.
Voice interactions additionally support consult (attended) transfer.

For consult transfers, this method only initiates the consult — the customer is placed
on hold and the agent is connected to the target. Use completeAttendedTransfer() or
attendedTransferCancel() to complete or cancel the transfer.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`TransferInteractionOptions`](#transferinteractionoptions) | Transfer parameters including target and transfer type |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Throws

CONSULT_NOT_SUPPORTED if transferType is "consult" on a non-voice interaction

##### Throws

INVALID_TRANSFER_TARGET if the target user or queue does not exist or is disabled

##### Examples

```typescript
await api.transferInteraction({
  interactionId: 'int-123',
  targetId: 'agent@example.com',
  targetName: 'Support Agent',
  transferType: 'blind',
});
```

```typescript
await api.transferInteraction({
  interactionId: 'int-123',
  targetId: 'supervisor@example.com',
  targetName: 'Supervisor',
  transferType: 'consult',
});
// Then complete or cancel:
await api.completeAttendedTransfer({ interactionId: 'int-123' });
```

#### completeAttendedTransfer()

```ts
completeAttendedTransfer(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1642](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1642)

Complete an attended transfer

Finalizes the attended transfer after consulting with the target party.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
// After consulting
await api.completeAttendedTransfer();
```

```typescript
await api.completeAttendedTransfer({ interactionId: 'int-123' });
```

#### completeConference()

```ts
completeConference(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1671](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1671)

Complete the interaction as a conference

Merges all parties into a conference call instead of completing a transfer.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
// After consulting
await api.completeConference();
```

```typescript
await api.completeConference({ interactionId: 'int-123' });
```

#### attendedTransferWarm()

```ts
attendedTransferWarm(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1699](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1699)

Perform a warm attended transfer

Introduces the caller to the transfer target before completing the transfer.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.attendedTransferWarm();
```

```typescript
await api.attendedTransferWarm({ interactionId: 'int-123' });
```

#### attendedTransferCancel()

```ts
attendedTransferCancel(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1727](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1727)

Cancel an attended transfer

Cancels the ongoing attended transfer and returns to the original call.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.attendedTransferCancel();
```

```typescript
await api.attendedTransferCancel({ interactionId: 'int-123' });
```

#### acceptInteraction()

```ts
acceptInteraction(options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1760](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1760)

Accept an incoming interaction

Accepts a queued or alerting interaction.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
api.onInteractionAccepted(async (interactionId) => {
  console.log('New interaction:', interactionId);
});

// When ready to accept
await api.acceptInteraction();
```

```typescript
await api.acceptInteraction({ interactionId: 'int-123' });
```

#### sendDialpadDigit()

```ts
sendDialpadDigit(
   digit: DialpadDigit, 
   audioOutputDeviceId: string | null, 
   noSendDialTone: boolean, 
   audioContextOverride?: "none" | "standard" | "webkit", 
   options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1802](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1802)

Send a DTMF dialpad digit during a call

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `digit` | [`DialpadDigit`](#dialpaddigit) | The dialpad digit to send (0-9) |
| `audioOutputDeviceId` | `string` \| `null` | Audio output device ID or null for default |
| `noSendDialTone` | `boolean` | Whether to suppress the dial tone sound |
| `audioContextOverride?` | `"none"` \| `"standard"` \| `"webkit"` | Audio context type override |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
import { DialpadDigit } from '@avaya/infinity-elements-api';

await api.sendDialpadDigit(
  DialpadDigit.One,
  null,
  false
);
```

```typescript
await api.sendDialpadDigit(
  DialpadDigit.One,
  null,
  false,
  undefined,
  { interactionId: 'int-123' }
);
```

#### insertTextIntoFeedInput()

```ts
insertTextIntoFeedInput(text: string, options?: InteractionContextOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1836](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1836)

Insert text into the chat feed input field

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `text` | `string` | The text to insert |
| `options?` | [`InteractionContextOptions`](#interactioncontextoptions) | Optional parameters |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.insertTextIntoFeedInput('Hello, how can I help you today?');
```

```typescript
await api.insertTextIntoFeedInput('Hello!', { interactionId: 'int-123' });
```

#### ~~sendRichMediaMessage()~~

```ts
sendRichMediaMessage(options: SendRichMediaMessageOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1877](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1877)

Send a rich media message (image, file, etc.) to the interaction

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SendRichMediaMessageOptions`](#sendrichmediamessageoptions) | Message options (must provide either mediaUrl or file) |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Deprecated

This method is deprecated and will be removed in a future version.

##### Examples

```typescript
await api.sendRichMediaMessage({
  name: 'Product Image',
  mediaUrl: 'https://example.com/image.jpg',
  text: 'Here is the product you requested'
});
```

```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await api.sendRichMediaMessage({
  name: 'Document',
  file: file,
  text: 'Attached document',
  interactionId: 'int-123'
});
```

#### sendChatMessage()

```ts
sendChatMessage(options: SendChatMessageOptions): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:1974](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L1974)

Send a chat message to the interaction

Supports sending text messages, media from URLs, or file uploads.
At least one of text, mediaUrl, or file must be provided.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SendChatMessageOptions`](#sendchatmessageoptions) | Message options (must provide interactionId and at least one of text, mediaUrl, or file) |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
await api.sendChatMessage({
  interactionId: 'int-123',
  text: 'Hello, how can I help you today?'
});
```

```typescript
await api.sendChatMessage({
  interactionId: 'int-123',
  text: 'VIP customer — 3 open cases in CRM',
  type: 'private'
});
```

```typescript
await api.sendChatMessage({
  interactionId: 'int-123',
  text: 'Suggested response: "I can help you with that refund."',
  type: 'agentAssist'
});
```

```typescript
await api.sendChatMessage({
  interactionId: 'int-123',
  mediaUrl: 'https://example.com/image.jpg',
  text: 'Here is the product you requested'
});
```

```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await api.sendChatMessage({
  interactionId: 'int-123',
  file: file,
  text: 'Attached document'
});
```

```typescript
await api.sendChatMessage({
  interactionId: 'int-123',
  text: 'Please review this document',
  file: documentFile,
  fileName: 'Important Document.pdf'
});
```

#### setAgentStatus()

```ts
setAgentStatus(
   userId: string, 
   status: AgentStatus, 
   reason?: {
  id: string;
  name: string;
}): Promise<{
  message: string;
}>;
```

Defined in: [api/ElementAPI.ts:2027](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2027)

Set the agent's status (Available, Away, Busy, etc.)

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `userId` | `string` | The user ID of the agent |
| `status` | [`AgentStatus`](#agentstatus) | The new agent status |
| `reason?` | \{ `id`: `string`; `name`: `string`; \} | Optional reason for the status change (required for some statuses) |
| `reason.id?` | `string` | - |
| `reason.name?` | `string` | - |

##### Returns

`Promise`\<\{
  `message`: `string`;
\}\>

Promise resolving to a success message

##### Examples

```typescript
const userInfo = await api.getUserInfo();
await api.setAgentStatus(userInfo.userId, { id: 'available', name: 'Available', category: 'available' });
```

```typescript
const userInfo = await api.getUserInfo();
await api.setAgentStatus(userInfo.userId, { id: 'away', name: 'Away', category: 'away' }, {
  id: 'lunch',
  name: 'Lunch Break'
});
```

#### getUserQueues()

```ts
getUserQueues(params?: {
  filter?: string;
}): Promise<UserQueueInfo[]>;
```

Defined in: [api/ElementAPI.ts:2056](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2056)

Get all queues available to the current user (App Level)

Returns a basic list of queues the agent has access to.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | \{ `filter?`: `string`; \} | Optional filter parameters |
| `params.filter?` | `string` | - |

##### Returns

`Promise`\<[`UserQueueInfo`](#userqueueinfo)[]\>

Promise resolving to array of user queue information

##### Example

```typescript
const queues = await api.getUserQueues();
console.log('Available queues:', queues.map(q => q.name));

// With filter
const salesQueues = await api.getUserQueues({ filter: 'Sales' });
```

#### getTransferQueues()

```ts
getTransferQueues(params: {
  interactionId: string;
  filter?: string;
}): Promise<InteractionQueueInfo[]>;
```

Defined in: [api/ElementAPI.ts:2082](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2082)

Get transfer queues with real-time statistics (App Level)

Returns detailed queue information including waiting interactions, active agents,
and average wait times. Requires explicit interactionId since this is used at app level
where interaction context is not available.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | \{ `interactionId`: `string`; `filter?`: `string`; \} | Required interactionId and optional filter parameters |
| `params.interactionId` | `string` | - |
| `params.filter?` | `string` | - |

##### Returns

`Promise`\<[`InteractionQueueInfo`](#interactionqueueinfo)[]\>

Promise resolving to array of queue information with statistics

##### Example

```typescript
const queues = await api.getTransferQueues({
  interactionId: 'int-123',
  filter: 'support'
});
queues.forEach(queue => {
  console.log(`${queue.name}: ${queue.waitingInteractions} waiting`);
  console.log(`Active agents: ${queue.countActiveAgents}`);
});
```

#### getTransferQueuesInteraction()

```ts
getTransferQueuesInteraction(params?: {
  filter?: string;
  interactionId?: string;
}): Promise<InteractionQueueInfo[]>;
```

Defined in: [api/ElementAPI.ts:2120](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2120)

Get transfer queues with real-time statistics (Interaction Level)

Returns detailed queue information including waiting interactions, active agents,
and average wait times. Uses interaction context automatically for interaction-level widgets.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | \{ `filter?`: `string`; `interactionId?`: `string`; \} | Optional filter parameters |
| `params.filter?` | `string` | Optional substring search against queue names |
| `params.interactionId?` | `string` | Optional interaction ID (required for app-level widgets, auto-provided for interaction-level widgets) |

##### Returns

`Promise`\<[`InteractionQueueInfo`](#interactionqueueinfo)[]\>

Promise resolving to array of queue information with statistics

##### Examples

```typescript
const queues = await api.getTransferQueuesInteraction({ filter: 'support' });
queues.forEach(queue => {
  console.log(`${queue.name}: ${queue.waitingInteractions} waiting`);
  console.log(`Active agents: ${queue.countActiveAgents}`);
});
```

```typescript
const queues = await api.getTransferQueuesInteraction({
  filter: 'support',
  interactionId: 'int-123'
});
```

#### getReasonCodes()

```ts
getReasonCodes(params?: GetReasonCodesParams): Promise<GetReasonCodesResponse>;
```

Defined in: [api/ElementAPI.ts:2151](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2151)

Get reason codes for agent status changes

Returns available reason codes that can be used when changing agent status.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`GetReasonCodesParams`](#getreasoncodesparams) | Optional parameters |

##### Returns

`Promise`\<[`GetReasonCodesResponse`](#getreasoncodesresponse)\>

Promise resolving to reason codes response

##### Examples

```typescript
const response = await api.getReasonCodes();
console.log('Reason codes:', response.reasons);
```

```typescript
const response = await api.getReasonCodes({ type: 'away' });
const awayReasons = response.reasons;
```

#### getAvayaJwt()

```ts
getAvayaJwt(options: {
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  clientId?: string;
  scopes?: string[];
  redirectUri?: string;
  popupOptions?: PopupOptions;
  forceRefresh?: boolean;
}): Promise<string>;
```

Defined in: [api/ElementAPI.ts:2201](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2201)

Get Avaya JWT token with multi-level request deduplication and automatic refresh
- Returns cached token from localStorage if available and not expired
- Automatically refreshes token if expired (using refresh token)
- Prevents duplicate concurrent fetch requests (instance-level)
- Prevents duplicate OAuth popups across iframes/elements (cross-iframe coordination)
- Initiates Keycloak OAuth flow if no token exists

Cross-iframe coordination ensures that if 10 iframes all call getAvayaJwt(),
only ONE OAuth popup will appear, and all iframes will receive the same token.

Uses localStorage for coordination to ensure only one OAuth popup appears

GUARANTEE: This function ALWAYS either returns a JWT string or throws an error.
There are no code paths that return undefined or hang indefinitely.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | \{ `authorizationEndpoint?`: `string`; `tokenEndpoint?`: `string`; `clientId?`: `string`; `scopes?`: `string`[]; `redirectUri?`: `string`; `popupOptions?`: [`PopupOptions`](#popupoptions); `forceRefresh?`: `boolean`; \} | Configuration options (all optional, uses defaults if not provided) |
| `options.authorizationEndpoint?` | `string` | Keycloak authorization endpoint URL |
| `options.tokenEndpoint?` | `string` | Keycloak token endpoint URL |
| `options.clientId?` | `string` | OAuth client ID |
| `options.scopes?` | `string`[] | OAuth scopes to request |
| `options.redirectUri?` | `string` | OAuth redirect URI (URL to redirect.html) |
| `options.popupOptions?` | [`PopupOptions`](#popupoptions) | Popup window size/position (defaults to 500x600) |
| `options.forceRefresh?` | `boolean` | Force token refresh even if not expired (defaults to false) |

##### Returns

`Promise`\<`string`\>

Promise<string> The JWT token (never returns undefined, always throws on error)

##### Example

```typescript
// Use defaults
const jwt = await api.getAvayaJwt();

// With configuration
const jwt = await api.getAvayaJwt({
  authorizationEndpoint: 'https://keycloak.example.com/auth/realms/xxx/protocol/openid-connect/auth',
  tokenEndpoint: 'https://keycloak.example.com/auth/realms/xxx/protocol/openid-connect/token',
  clientId: 'my-client-id',
  redirectUri: 'https://myapp.com/redirect.html',
  forceRefresh: true
});
```

#### refreshToken()

```ts
refreshToken(options: {
  tokenEndpoint?: string;
  clientId?: string;
}): Promise<string>;
```

Defined in: [api/ElementAPI.ts:2316](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2316)

Refresh the access token using the stored refresh token

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | \{ `tokenEndpoint?`: `string`; `clientId?`: `string`; \} | Configuration options |
| `options.tokenEndpoint?` | `string` | Keycloak token endpoint URL (required) |
| `options.clientId?` | `string` | OAuth client ID (required) |

##### Returns

`Promise`\<`string`\>

Promise<string> The new JWT access token

##### Throws

Error if refresh token is not available or refresh fails

##### Example

```typescript
try {
  const newJwt = await api.refreshToken({
    tokenEndpoint: 'https://keycloak.example.com/auth/realms/xxx/protocol/openid-connect/token',
    clientId: 'my-client-id'
  });
  console.log('Token refreshed successfully');
} catch (error) {
  console.error('Token refresh failed:', error);
  // May need to re-authenticate
}
```

#### clearAvayaJwt()

```ts
clearAvayaJwt(): void;
```

Defined in: [api/ElementAPI.ts:2375](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2375)

Clear the cached JWT token and force re-authentication on next getAvayaJwt call

##### Returns

`void`

##### Example

```typescript
api.clearAvayaJwt();
const newJwt = await api.getAvayaJwt(); // Will trigger OAuth flow
```

#### sendInterElementMessage()

```ts
sendInterElementMessage<T>(message: T): void;
```

Defined in: [api/ElementAPI.ts:2682](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2682)

Send a message to other elements via the host (parent window)

Messages are routed through the host application which acts as a broker,
relaying messages to all other element iframes. This approach works in
sandboxed iframes where BroadcastChannel is not available.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the message |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `T` | The message to send (can be any serializable type) |

##### Returns

`void`

##### Example

```typescript
api.sendInterElementMessage({ type: 'my-event', payload: { key: 'value' } });
```

#### onInterElementMessage()

```ts
onInterElementMessage<T>(callback: (message: T) => void): () => void;
```

Defined in: [api/ElementAPI.ts:2721](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2721)

Subscribe to messages from other elements routed through the host

The host application receives inter-element messages and relays them to
all element iframes. This works in sandboxed iframes where BroadcastChannel
is not available.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The expected type of messages |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | (`message`: `T`) => `void` | Function called when a message is received |

##### Returns

Unsubscribe function to stop listening

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onInterElementMessage<MyMessageType>((message) => {
  console.log('Received:', message);
});

// Later, stop listening
unsubscribe();
```

#### log()

```ts
protected log(message: string, data?: unknown): void;
```

Defined in: [api/ElementAPI.ts:2923](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L2923)

Debug logging - no-op by default, overridden by ElementAPI subclass

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `data?` | `unknown` |

##### Returns

`void`

##### Overrides

[`ElementAPIEvents`](#elementapievents).[`log`](#log-2)

#### emitError()

```ts
protected emitError(error: {
  code: string;
  message: string;
  details?: unknown;
}): void;
```

Defined in: [api/ElementAPIEvents.ts:193](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L193)

Dispatch an error to all registered error listeners.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | \{ `code`: `string`; `message`: `string`; `details?`: `unknown`; \} |
| `error.code` | `string` |
| `error.message` | `string` |
| `error.details?` | `unknown` |

##### Returns

`void`

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`emitError`](#emiterror-2)

#### handleMessage()

```ts
protected handleMessage(data: Record<string, any>): boolean;
```

Defined in: [api/ElementAPIEvents.ts:212](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L212)

Handle an incoming window message and dispatch to appropriate listeners.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `Record`\<`string`, `any`\> |

##### Returns

`boolean`

true if the message was handled as an event, false otherwise.

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`handleMessage`](#handlemessage-2)

#### onInteractionStatusChanged()

```ts
onInteractionStatusChanged(callback: InteractionStatusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:417](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L417)

Subscribe to interaction status changes

Fires when the status of an interaction changes (e.g., alerting, connected, held)

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionStatusChangedCallback`](#interactionstatuschangedcallback) | Function to call when interaction status changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onInteractionStatusChanged(({ interactionId, status }) => {
  console.log(`Interaction ${interactionId} status changed to ${status}`);
});

// Later, to unsubscribe:
unsubscribe();
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionStatusChanged`](#oninteractionstatuschanged-2)

#### onInteractionAccepted()

```ts
onInteractionAccepted(callback: InteractionAcceptedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:440](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L440)

Subscribe to interaction accepted events

Fires when an agent accepts an incoming interaction

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionAcceptedCallback`](#interactionacceptedcallback) | Function to call when an interaction is accepted |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionAccepted((interactionId) => {
  console.log('Accepted interaction:', interactionId);
  // Load customer data, show interaction UI, etc.
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionAccepted`](#oninteractionaccepted-2)

#### onInteractionEnded()

```ts
onInteractionEnded(callback: InteractionEndedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:461](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L461)

Subscribe to interaction ended events

Fires when an interaction is ended or disconnected

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionEndedCallback`](#interactionendedcallback) | Function to call when an interaction ends |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionEnded((interactionId) => {
  console.log('Interaction ended:', interactionId);
  // Clean up UI, save data, etc.
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionEnded`](#oninteractionended-2)

#### onInteractionUpdated()

```ts
onInteractionUpdated(callback: InteractionUpdatedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:482](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L482)

Subscribe to interaction updated events

Fires when an interaction is updated with new information

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionUpdatedCallback`](#interactionupdatedcallback) | Function to call when an interaction is updated |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionUpdated(({ interactionId, payload }) => {
  console.log('Interaction updated:', interactionId);
  console.log('New data:', payload);
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionUpdated`](#oninteractionupdated-2)

#### onInteractionDataReload()

```ts
onInteractionDataReload(callback: InteractionDataReloadCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:506](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L506)

Subscribe to interaction data reload events.

Fires after a successful updateInteraction() call, signalling the element
to refresh its local copy of the interaction data from its own backend or
re-fetch fields it cares about.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionDataReloadCallback`](#interactiondatareloadcallback) | Function to call when the interaction data should be reloaded |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onInteractionDataReload((interactionId) => {
  console.log('Reload data for:', interactionId);
  // Re-fetch interaction details from your backend
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionDataReload`](#oninteractiondatareload-2)

#### onConsultStatusChanged()

```ts
onConsultStatusChanged(callback: ConsultStatusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:526](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L526)

Subscribe to consult status changes

Fires when the status of a consultation changes

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ConsultStatusChangedCallback`](#consultstatuschangedcallback) | Function to call when consult status changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onConsultStatusChanged(({ interactionId, consultStatus, consultParty }) => {
  console.log(`Consult ${consultStatus} with ${consultParty}`);
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onConsultStatusChanged`](#onconsultstatuschanged-2)

#### onCompleteAsConference()

```ts
onCompleteAsConference(callback: CompleteAsConferenceCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:546](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L546)

Subscribe to complete as conference events

Fires when an interaction is completed as a conference

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`CompleteAsConferenceCallback`](#completeasconferencecallback) | Function to call when an interaction is completed as a conference |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onCompleteAsConference(({ interactionId }) => {
  console.log(`Interaction ${interactionId} completed as conference`);
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onCompleteAsConference`](#oncompleteasconference-2)

#### onReceivedFeedMessage()

```ts
onReceivedFeedMessage(callback: FeedMessageCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:567](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L567)

Subscribe to feed messages

Fires when a new message is received in the interaction feed

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`FeedMessageCallback`](#feedmessagecallback) | Function to call when a feed message is received. Receives (message: Message, interactionId?: string) |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onReceivedFeedMessage((message, interactionId) => {
  console.log('New message:', message.text, 'for interaction:', interactionId);
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onReceivedFeedMessage`](#onreceivedfeedmessage-2)

#### onError()

```ts
onError(callback: ErrorCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:588](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L588)

Subscribe to error events

Fires when an error occurs in the API

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ErrorCallback`](#errorcallback) | Function to call when an error occurs |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onError((error) => {
  console.error('API Error:', error.code, error.message);
  // Display error notification to user
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onError`](#onerror-2)

#### ~~onChangedAgentState()~~

```ts
onChangedAgentState(callback: AgentStateChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:611](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L611)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | [`AgentStateChangedCallback`](#agentstatechangedcallback) |

##### Returns

```ts
(): void;
```

###### Returns

`void`

##### Deprecated

Use [onAgentStateChange](#onagentstatechange-2) instead for the full structured payload

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onChangedAgentState`](#onchangedagentstate-2)

#### onAgentStateChange()

```ts
onAgentStateChange(callback: AgentStateChangeCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:633](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L633)

Subscribe to agent state changed events

Fires when the agent's state changes (e.g. availability, CX login/logout, queue login/logout).
Supersedes [onChangedAgentState](#onchangedagentstate-2) with a fully structured payload including
`isAID`, `queues`, `agentState`, `timestamp`, `agentId`, and `reasonCode`.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`AgentStateChangeCallback`](#agentstatechangecallback) | Function to call when agent state changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onAgentStateChange(({ agentState, isAID, queues }) => {
  console.log(`State: ${agentState}, CX logged in: ${isAID}`);
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onAgentStateChange`](#onagentstatechange-2)

#### onInteractionFocusChanged()

```ts
onInteractionFocusChanged(callback: InteractionFocusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:664](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L664)

Subscribe to interaction focus changed events.

Fires when the agent switches to a different interaction tab,
delivering the focused interactionId. Fires with null when the
agent navigates away from all interactions (e.g. Home, Analytics).

Also fires on email and SMS interaction accept even when createInteraction()
was called with navigateTo: false — digital channel accept always triggers
a focus change regardless of the navigateTo flag.

App-level elements should store the received interactionId and pass
it explicitly to getInteraction({ interactionId }) to avoid relying
on URL context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionFocusChangedCallback`](#interactionfocuschangedcallback) | Function to call when the focused interaction changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionFocusChanged((interactionId) => {
  if (!interactionId) return;
  api.getInteraction({ interactionId }).then(data => render(data));
});
```

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`onInteractionFocusChanged`](#oninteractionfocuschanged-2)

#### destroyEventListeners()

```ts
protected destroyEventListeners(): void;
```

Defined in: [api/ElementAPIEvents.ts:672](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L672)

Clear all event listeners

##### Returns

`void`

##### Inherited from

[`ElementAPIEvents`](#elementapievents).[`destroyEventListeners`](#destroyeventlisteners-2)

***

## ElementAPIEvents

Defined in: [api/ElementAPIEvents.ts:127](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L127)

ElementAPIEvents - Base class providing event subscription and dispatch for ElementAPI

Owns all event listener Sets, provides on* subscription methods,
and dispatches incoming window messages to the appropriate listeners.
ElementAPI extends this class to inherit all event functionality.

### Extended by

- [`ElementAPI`](#elementapi)

### Constructors

#### Constructor

```ts
new ElementAPIEvents(): ElementAPIEvents;
```

##### Returns

[`ElementAPIEvents`](#elementapievents)

### Methods

#### log()

```ts
protected log(_message: string, _data?: unknown): void;
```

Defined in: [api/ElementAPIEvents.ts:150](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L150)

Debug logging - no-op by default, overridden by ElementAPI subclass

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `_message` | `string` |
| `_data?` | `unknown` |

##### Returns

`void`

#### emitError()

```ts
protected emitError(error: {
  code: string;
  message: string;
  details?: unknown;
}): void;
```

Defined in: [api/ElementAPIEvents.ts:193](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L193)

Dispatch an error to all registered error listeners.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | \{ `code`: `string`; `message`: `string`; `details?`: `unknown`; \} |
| `error.code` | `string` |
| `error.message` | `string` |
| `error.details?` | `unknown` |

##### Returns

`void`

#### handleMessage()

```ts
protected handleMessage(data: Record<string, any>): boolean;
```

Defined in: [api/ElementAPIEvents.ts:212](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L212)

Handle an incoming window message and dispatch to appropriate listeners.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `Record`\<`string`, `any`\> |

##### Returns

`boolean`

true if the message was handled as an event, false otherwise.

#### onInteractionStatusChanged()

```ts
onInteractionStatusChanged(callback: InteractionStatusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:417](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L417)

Subscribe to interaction status changes

Fires when the status of an interaction changes (e.g., alerting, connected, held)

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionStatusChangedCallback`](#interactionstatuschangedcallback) | Function to call when interaction status changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onInteractionStatusChanged(({ interactionId, status }) => {
  console.log(`Interaction ${interactionId} status changed to ${status}`);
});

// Later, to unsubscribe:
unsubscribe();
```

#### onInteractionAccepted()

```ts
onInteractionAccepted(callback: InteractionAcceptedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:440](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L440)

Subscribe to interaction accepted events

Fires when an agent accepts an incoming interaction

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionAcceptedCallback`](#interactionacceptedcallback) | Function to call when an interaction is accepted |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionAccepted((interactionId) => {
  console.log('Accepted interaction:', interactionId);
  // Load customer data, show interaction UI, etc.
});
```

#### onInteractionEnded()

```ts
onInteractionEnded(callback: InteractionEndedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:461](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L461)

Subscribe to interaction ended events

Fires when an interaction is ended or disconnected

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionEndedCallback`](#interactionendedcallback) | Function to call when an interaction ends |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionEnded((interactionId) => {
  console.log('Interaction ended:', interactionId);
  // Clean up UI, save data, etc.
});
```

#### onInteractionUpdated()

```ts
onInteractionUpdated(callback: InteractionUpdatedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:482](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L482)

Subscribe to interaction updated events

Fires when an interaction is updated with new information

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionUpdatedCallback`](#interactionupdatedcallback) | Function to call when an interaction is updated |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionUpdated(({ interactionId, payload }) => {
  console.log('Interaction updated:', interactionId);
  console.log('New data:', payload);
});
```

#### onInteractionDataReload()

```ts
onInteractionDataReload(callback: InteractionDataReloadCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:506](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L506)

Subscribe to interaction data reload events.

Fires after a successful updateInteraction() call, signalling the element
to refresh its local copy of the interaction data from its own backend or
re-fetch fields it cares about.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionDataReloadCallback`](#interactiondatareloadcallback) | Function to call when the interaction data should be reloaded |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onInteractionDataReload((interactionId) => {
  console.log('Reload data for:', interactionId);
  // Re-fetch interaction details from your backend
});
```

#### onConsultStatusChanged()

```ts
onConsultStatusChanged(callback: ConsultStatusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:526](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L526)

Subscribe to consult status changes

Fires when the status of a consultation changes

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ConsultStatusChangedCallback`](#consultstatuschangedcallback) | Function to call when consult status changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onConsultStatusChanged(({ interactionId, consultStatus, consultParty }) => {
  console.log(`Consult ${consultStatus} with ${consultParty}`);
});
```

#### onCompleteAsConference()

```ts
onCompleteAsConference(callback: CompleteAsConferenceCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:546](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L546)

Subscribe to complete as conference events

Fires when an interaction is completed as a conference

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`CompleteAsConferenceCallback`](#completeasconferencecallback) | Function to call when an interaction is completed as a conference |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onCompleteAsConference(({ interactionId }) => {
  console.log(`Interaction ${interactionId} completed as conference`);
});
```

#### onReceivedFeedMessage()

```ts
onReceivedFeedMessage(callback: FeedMessageCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:567](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L567)

Subscribe to feed messages

Fires when a new message is received in the interaction feed

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`FeedMessageCallback`](#feedmessagecallback) | Function to call when a feed message is received. Receives (message: Message, interactionId?: string) |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onReceivedFeedMessage((message, interactionId) => {
  console.log('New message:', message.text, 'for interaction:', interactionId);
});
```

#### onError()

```ts
onError(callback: ErrorCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:588](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L588)

Subscribe to error events

Fires when an error occurs in the API

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ErrorCallback`](#errorcallback) | Function to call when an error occurs |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onError((error) => {
  console.error('API Error:', error.code, error.message);
  // Display error notification to user
});
```

#### ~~onChangedAgentState()~~

```ts
onChangedAgentState(callback: AgentStateChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:611](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L611)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | [`AgentStateChangedCallback`](#agentstatechangedcallback) |

##### Returns

```ts
(): void;
```

###### Returns

`void`

##### Deprecated

Use [onAgentStateChange](#onagentstatechange-2) instead for the full structured payload

#### onAgentStateChange()

```ts
onAgentStateChange(callback: AgentStateChangeCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:633](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L633)

Subscribe to agent state changed events

Fires when the agent's state changes (e.g. availability, CX login/logout, queue login/logout).
Supersedes [onChangedAgentState](#onchangedagentstate-2) with a fully structured payload including
`isAID`, `queues`, `agentState`, `timestamp`, `agentId`, and `reasonCode`.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`AgentStateChangeCallback`](#agentstatechangecallback) | Function to call when agent state changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
const unsubscribe = api.onAgentStateChange(({ agentState, isAID, queues }) => {
  console.log(`State: ${agentState}, CX logged in: ${isAID}`);
});
```

#### onInteractionFocusChanged()

```ts
onInteractionFocusChanged(callback: InteractionFocusChangedCallback): () => void;
```

Defined in: [api/ElementAPIEvents.ts:664](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L664)

Subscribe to interaction focus changed events.

Fires when the agent switches to a different interaction tab,
delivering the focused interactionId. Fires with null when the
agent navigates away from all interactions (e.g. Home, Analytics).

Also fires on email and SMS interaction accept even when createInteraction()
was called with navigateTo: false — digital channel accept always triggers
a focus change regardless of the navigateTo flag.

App-level elements should store the received interactionId and pass
it explicitly to getInteraction({ interactionId }) to avoid relying
on URL context.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`InteractionFocusChangedCallback`](#interactionfocuschangedcallback) | Function to call when the focused interaction changes |

##### Returns

Unsubscribe function

```ts
(): void;
```

###### Returns

`void`

##### Example

```typescript
api.onInteractionFocusChanged((interactionId) => {
  if (!interactionId) return;
  api.getInteraction({ interactionId }).then(data => render(data));
});
```

#### destroyEventListeners()

```ts
protected destroyEventListeners(): void;
```

Defined in: [api/ElementAPIEvents.ts:672](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L672)

Clear all event listeners

##### Returns

`void`

***

## IframeSecurity

Defined in: [security/IframeSecurity.ts:100](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L100)

Static utility class for iframe security validation and monitoring.

### Constructors

#### Constructor

```ts
new IframeSecurity(): IframeSecurity;
```

##### Returns

[`IframeSecurity`](#iframesecurity)

### Methods

#### validateIframe()

```ts
static validateIframe(iframe: HTMLIFrameElement, options: IframeValidationOptions): IframeValidationResult;
```

Defined in: [security/IframeSecurity.ts:104](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L104)

Validates that an iframe element has the expected security configuration.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `iframe` | `HTMLIFrameElement` |
| `options` | [`IframeValidationOptions`](#iframevalidationoptions) |

##### Returns

[`IframeValidationResult`](#iframevalidationresult)

#### monitorIframe()

```ts
static monitorIframe(iframe: HTMLIFrameElement, options: IframeMonitorOptions): () => void;
```

Defined in: [security/IframeSecurity.ts:205](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L205)

Monitors an iframe for changes to security-critical attributes.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `iframe` | `HTMLIFrameElement` |
| `options` | [`IframeMonitorOptions`](#iframemonitoroptions) |

##### Returns

```ts
(): void;
```

###### Returns

`void`

#### validateParentOrigins()

```ts
static validateParentOrigins(allowedOrigins: string[]): IframeValidationResult;
```

Defined in: [security/IframeSecurity.ts:248](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L248)

Validates the current window's parent environment by checking ancestor origins.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `allowedOrigins` | `string`[] |

##### Returns

[`IframeValidationResult`](#iframevalidationresult)

***

## InteractionInfo

Defined in: [api/ElementAPI.ts:38](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L38)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | [api/ElementAPI.ts:39](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L39) |
| <a id="interactionid"></a> `interactionId` | `string` | [api/ElementAPI.ts:40](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L40) |
| <a id="status"></a> `status` | `string` | [api/ElementAPI.ts:41](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L41) |
| <a id="commtype"></a> `commType?` | `string` | [api/ElementAPI.ts:42](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L42) |
| <a id="direction"></a> `direction?` | `string` | [api/ElementAPI.ts:43](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L43) |
| <a id="customer"></a> `customer?` | \{ `name?`: `string`; `number?`: `string`; `id?`: `string`; \} | [api/ElementAPI.ts:44](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L44) |
| `customer.name?` | `string` | [api/ElementAPI.ts:45](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L45) |
| `customer.number?` | `string` | [api/ElementAPI.ts:46](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L46) |
| `customer.id?` | `string` | [api/ElementAPI.ts:47](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L47) |
| <a id="starttime"></a> `startTime?` | `string` | [api/ElementAPI.ts:49](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L49) |
| <a id="duration"></a> `duration?` | `number` | [api/ElementAPI.ts:50](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L50) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | [api/ElementAPI.ts:51](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L51) |

***

## InteractionUpdatePayload

Defined in: [api/ElementAPI.ts:54](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L54)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-1"></a> `id` | `string` | [api/ElementAPI.ts:55](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L55) |
| <a id="status-1"></a> `status?` | `string` | [api/ElementAPI.ts:56](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L56) |
| <a id="commtype-1"></a> `commType?` | `string` | [api/ElementAPI.ts:57](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L57) |
| <a id="subcommtype"></a> `subCommType?` | `string` | [api/ElementAPI.ts:58](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L58) |
| <a id="isaudio"></a> `isAudio?` | `boolean` | [api/ElementAPI.ts:59](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L59) |
| <a id="ishold"></a> `isHold?` | `boolean` | [api/ElementAPI.ts:60](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L60) |
| <a id="ismute"></a> `isMute?` | `boolean` | [api/ElementAPI.ts:61](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L61) |
| <a id="details"></a> `details?` | \{ `notes?`: `string`; `subject?`: `string`; \} | [api/ElementAPI.ts:62](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L62) |
| `details.notes?` | `string` | [api/ElementAPI.ts:63](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L63) |
| `details.subject?` | `string` | [api/ElementAPI.ts:64](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L64) |
| <a id="sourcedetails"></a> `sourceDetails?` | \{ `phoneNumber?`: `string`; `email?`: `string`; `name?`: `string`; \} | [api/ElementAPI.ts:66](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L66) |
| `sourceDetails.phoneNumber?` | `string` | [api/ElementAPI.ts:67](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L67) |
| `sourceDetails.email?` | `string` | [api/ElementAPI.ts:68](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L68) |
| `sourceDetails.name?` | `string` | [api/ElementAPI.ts:69](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L69) |

***

## BlindTransferOptions

Defined in: [api/ElementAPI.ts:107](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L107)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="interactionid-1"></a> `interactionId` | `string` | [api/ElementAPI.ts:108](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L108) |
| <a id="transferto"></a> `transferTo` | `string` | [api/ElementAPI.ts:109](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L109) |
| <a id="transfertoname"></a> `transferToName` | `string` | [api/ElementAPI.ts:110](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L110) |
| <a id="transfercalleridtype"></a> `transferCallerIdType?` | `string` | [api/ElementAPI.ts:111](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L111) |

***

## SingleStepTransferParams

Defined in: [api/ElementAPI.ts:114](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L114)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="targetid"></a> `targetId` | `string` | - | [api/ElementAPI.ts:115](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L115) |
| <a id="targetname"></a> `targetName` | `string` | - | [api/ElementAPI.ts:116](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L116) |
| <a id="interactionid-2"></a> `interactionId?` | `string` | Optional interaction ID (required for app-level widgets, auto-provided for interaction-level widgets) | [api/ElementAPI.ts:118](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L118) |

***

## CreateVoiceInteractionParams

Defined in: [api/ElementAPI.ts:121](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L121)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="phonenumber"></a> `phoneNumber` | `string` | [api/ElementAPI.ts:122](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L122) |
| <a id="queueid"></a> `queueId` | `string` | [api/ElementAPI.ts:123](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L123) |

***

## CreateInteractionOptions

Defined in: [api/ElementAPI.ts:130](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L130)

Options for creating a generic outbound interaction across any channel type.
Replaces channel-specific creation methods with a single unified API.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="commtype-2"></a> `commType` | `"task"` \| `"email"` \| `"sms"` \| `"chat"` \| `"voice"` | Channel type for the new interaction | [api/ElementAPI.ts:132](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L132) |
| <a id="subcommtype-1"></a> `subCommType?` | `string` | Optional sub-type for further channel classification. Defaults per channel: voice → "outbound", email → "outbound", sms → "text", chat → "chat", task → "other". Omit to use the channel default. Passing an invalid value for the channel is rejected with a descriptive error listing the accepted values. | [api/ElementAPI.ts:139](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L139) |
| <a id="to"></a> `to?` | `string` | Recipient — phone number for voice/SMS, email address for email | [api/ElementAPI.ts:141](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L141) |
| <a id="queueid-1"></a> `queueId?` | `string` | Queue ID — required for voice; also needed for email/SMS to resolve the outbound address | [api/ElementAPI.ts:143](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L143) |
| <a id="subject"></a> `subject?` | `string` | Subject line for the interaction record. On email channel this populates details.subject only — it does NOT pre-populate the native Desktop email compose editor, which maintains a separate draft data model. | [api/ElementAPI.ts:149](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L149) |
| <a id="body"></a> `body?` | `string` | Body content for the interaction record (email and SMS only; voice, chat, and task silently drop it). On email channel this populates details.body only — it does NOT pre-populate the native Desktop email compose editor, which maintains a separate draft data model. On SMS channel, body pre-populates the compose editor as a one-shot initial value, cleared after first use. | [api/ElementAPI.ts:157](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L157) |
| <a id="fields"></a> `fields?` | `Record`\<`string`, `unknown`\> | Additional custom fields to attach to the interaction at creation time | [api/ElementAPI.ts:159](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L159) |
| <a id="navigateto"></a> `navigateTo?` | `boolean` | Whether to navigate the agent desktop to the new interaction view after creation. Defaults to true. Set to false to create the interaction in the background. | [api/ElementAPI.ts:164](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L164) |
| <a id="interactiontype"></a> `interactionType?` | `string` | Interaction type / work code category (maps to details.type on the backend) | [api/ElementAPI.ts:166](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L166) |
| <a id="result"></a> `result?` | `string` | End result / disposition code to set at creation time (maps to details.result). Note: the equivalent updateInteraction() parameter is named `endResult` for backward compatibility with existing Elements. | [api/ElementAPI.ts:172](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L172) |
| <a id="notes"></a> `notes?` | `string` | Notes to attach at creation time (maps to details.notes) | [api/ElementAPI.ts:174](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L174) |
| <a id="name"></a> `name?` | `string` | Display name of the source (customer) party (maps to sourceDetails.name). Naming matches the equivalent updateInteraction() field. | [api/ElementAPI.ts:179](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L179) |
| <a id="email"></a> `email?` | `string` | Explicit source email address — takes priority over `to` for sourceDetails.email. Naming matches the equivalent updateInteraction() field. | [api/ElementAPI.ts:184](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L184) |
| <a id="phone"></a> `phone?` | `string` | Explicit source phone number — takes priority over `to` for sourceDetails.phoneNumber. Writing this field triggers full customer identity re-resolution on the platform: new person/session records are created keyed to the new number, and prior identifiers move to the archive. This is intentional platform behaviour — the same as editing the phone number in the native Desktop UI. Naming matches the equivalent updateInteraction() field. | [api/ElementAPI.ts:193](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L193) |
| <a id="routingphone"></a> `routingPhone?` | `string` | Routing phone number (maps to routingDetails.phoneNumber) | [api/ElementAPI.ts:195](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L195) |
| <a id="routingphonename"></a> `routingPhoneName?` | `string` | Display name for the routing phone number (maps to routingDetails.phoneNumberName). Only forwarded when routingPhone is also provided; silently dropped if routingPhone is absent. | [api/ElementAPI.ts:197](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L197) |
| <a id="customerlanguagecode"></a> `customerLanguageCode?` | `string` | Customer preferred language code (maps to customer.languageCode) | [api/ElementAPI.ts:199](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L199) |

***

## InteractionContextOptions

Defined in: [api/ElementAPI.ts:206](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L206)

Common options for interaction-context methods
Used to optionally specify an interaction ID for app-level widgets

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interactionid-3"></a> `interactionId?` | `string` | Optional interaction ID (required for app-level widgets, auto-provided for interaction-level widgets) | [api/ElementAPI.ts:208](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L208) |

***

## SendRichMediaMessageOptions

Defined in: [api/ElementAPI.ts:211](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L211)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="name-1"></a> `name?` | `string` | - | [api/ElementAPI.ts:212](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L212) |
| <a id="mediaurl"></a> `mediaUrl?` | `string` | - | [api/ElementAPI.ts:213](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L213) |
| <a id="file"></a> `file?` | `File` | - | [api/ElementAPI.ts:214](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L214) |
| <a id="text"></a> `text?` | `string` | - | [api/ElementAPI.ts:215](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L215) |
| <a id="interactionid-4"></a> `interactionId?` | `string` | Optional interaction ID (required for app-level widgets, auto-provided for interaction-level widgets) | [api/ElementAPI.ts:217](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L217) |

***

## SendChatMessageOptions

Defined in: [api/ElementAPI.ts:240](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L240)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interactionid-5"></a> `interactionId` | `string` | Required interaction ID | [api/ElementAPI.ts:242](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L242) |
| <a id="text-1"></a> `text?` | `string` | Optional message text | [api/ElementAPI.ts:244](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L244) |
| <a id="mediaurl-1"></a> `mediaUrl?` | `string` | Optional media URL (image, file, etc.) | [api/ElementAPI.ts:246](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L246) |
| <a id="file-1"></a> `file?` | `File` | Optional file to upload | [api/ElementAPI.ts:248](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L248) |
| <a id="filename"></a> `fileName?` | `string` | Optional file name for the message/file | [api/ElementAPI.ts:250](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L250) |
| <a id="type"></a> `type?` | [`SendChatMessageType`](#sendchatmessagetype) | Controls where and how the message is delivered. Omitting this parameter preserves today's behavior (sends as agent to customer). - "agent": Explicitly sends as the agent to the customer. - "private": Routes to the agent's feed only; customer does NOT see it. Persisted in the transcript. - "agentAssist": Routes to the Agent Assist panel UI; NOT in the main chat feed. Customer does NOT see it. Does not appear in the main transcript — visible in the AI Assist panel only. See SendChatMessageType for a full comparison. | [api/ElementAPI.ts:261](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L261) |

***

## ConsultCallOptions

Defined in: [api/ElementAPI.ts:264](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L264)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interactionid-6"></a> `interactionId` | `string` | - | [api/ElementAPI.ts:265](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L265) |
| <a id="transferto-1"></a> `transferTo?` | `string` | User ID or handle to consult with (internal user/agent) | [api/ElementAPI.ts:267](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L267) |
| <a id="phonenumber-1"></a> `phoneNumber?` | `string` | Phone number to consult with (external number) | [api/ElementAPI.ts:269](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L269) |
| <a id="queueid-2"></a> `queueId?` | `string` | Queue ID to consult to. Can be obtained via getTransferQueuesInteraction | [api/ElementAPI.ts:271](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L271) |

***

## TransferInteractionOptions

Defined in: [api/ElementAPI.ts:279](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L279)

Options for transferring an interaction to an agent, queue, or external address.
Works across all channel types. Digital channels support blind transfer only.
Voice additionally supports consult (attended) transfer.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interactionid-7"></a> `interactionId` | `string` | The interaction to transfer | [api/ElementAPI.ts:281](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L281) |
| <a id="targetid-1"></a> `targetId` | `string` | User ID, queue ID, or external address to transfer to | [api/ElementAPI.ts:283](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L283) |
| <a id="targetname-1"></a> `targetName?` | `string` | Display name of the transfer target | [api/ElementAPI.ts:285](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L285) |
| <a id="transfertype"></a> `transferType` | `"blind"` \| `"consult"` | Transfer type. "blind" — supported for all channel types. Interaction is handed off immediately. "consult" — voice only. Places customer on hold; agent consults with target before completing. Returns CONSULT_NOT_SUPPORTED for digital channels (email, SMS, chat, task). | [api/ElementAPI.ts:292](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L292) |

***

## AgentStatus

Defined in: [api/ElementAPI.ts:295](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L295)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-2"></a> `id` | `string` | [api/ElementAPI.ts:296](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L296) |
| <a id="name-2"></a> `name` | `string` | [api/ElementAPI.ts:297](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L297) |
| <a id="category"></a> `category` | `string` | [api/ElementAPI.ts:298](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L298) |

***

## WrapUpInteractionOptions

Defined in: [api/ElementAPI.ts:304](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L304)

Options for wrapping up a completed interaction.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="dispositioncode"></a> `dispositionCode?` | `string` | Disposition code to apply. Optional — if omitted the interaction is wrapped up without a disposition code. When provided, must exist in the queue's configured result list (if one is configured). | [api/ElementAPI.ts:310](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L310) |
| <a id="notes-1"></a> `notes?` | `string` | Optional notes to attach to the interaction | [api/ElementAPI.ts:312](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L312) |

***

## NavigateToOptions

Defined in: [api/ElementAPI.ts:326](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L326)

Per-call options for `navigateTo()`. Mirrors react-router's `NavigateOptions`.

No fields ship in v1.0.0 — `replace` and `state` below are reserved for
future SDK releases and are currently silently ignored by the host. They are
declared on the type so partners can opt into the planned shape early; their
values are not yet honored at runtime.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="replace"></a> `replace?` | `boolean` | Replace the current history entry instead of pushing a new one. **Remarks** Reserved — not implemented in v1.0.0. Future SDK releases will honor this. | [api/ElementAPI.ts:332](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L332) |
| <a id="state"></a> `state?` | `unknown` | Opaque state to attach to the destination route's history entry. **Remarks** Reserved — not implemented in v1.0.0. Future SDK releases will honor this. | [api/ElementAPI.ts:339](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L339) |

***

## NavigateToResponse

Defined in: [api/ElementAPI.ts:345](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L345)

Response from a navigation request.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="message"></a> `message` | `string` | Success confirmation message | [api/ElementAPI.ts:347](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L347) |
| <a id="path"></a> `path` | `string` | The path that was navigated to | [api/ElementAPI.ts:349](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L349) |

***

## UpdateInteractionFieldsBase

Defined in: [api/ElementAPI.ts:352](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L352)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="name-3"></a> `name?` | `string` | Customer display name | [api/ElementAPI.ts:354](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L354) |
| <a id="phone-1"></a> `phone?` | `string` | Customer phone number. Writing this field triggers full customer identity re-resolution on the platform: new person/session records are created keyed to the new number, and prior identifiers move to the archive. This is intentional platform behaviour — the same as editing the phone number in the native Desktop UI. | [api/ElementAPI.ts:362](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L362) |
| <a id="email-1"></a> `email?` | `string` | Customer email address | [api/ElementAPI.ts:364](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L364) |
| <a id="subject-1"></a> `subject?` | `string` | Interaction subject. On email channel this populates details.subject on the interaction record only — it does NOT pre-populate the native Desktop email compose editor. | [api/ElementAPI.ts:370](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L370) |
| <a id="body-1"></a> `body?` | `string` | Body content for the interaction record (messaging channels only). On email channel this populates details.body on the interaction record only — it does NOT pre-populate the native Desktop email compose editor, which maintains a separate draft data model. On SMS channel, body updates the interaction record only — it does not update the live compose editor for an in-progress interaction. | [api/ElementAPI.ts:378](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L378) |
| <a id="notes-2"></a> `notes?` | `string` | Notes — persisted after wrap-up | [api/ElementAPI.ts:380](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L380) |
| <a id="interactiontype-1"></a> `interactionType?` | `string` | Interaction type / work code category | [api/ElementAPI.ts:382](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L382) |
| <a id="endresult"></a> `endResult?` | `string` | End result / disposition code (maps to details.result on the backend). Note: this field is named `endResult` here for backward compatibility with existing Elements; the equivalent createInteraction() parameter is named `result`. | [api/ElementAPI.ts:388](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L388) |
| <a id="customerlanguagecode-1"></a> `customerLanguageCode?` | `string` | Customer preferred language code (maps to customer.languageCode) | [api/ElementAPI.ts:390](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L390) |
| <a id="fields-1"></a> `fields?` | `Record`\<`string`, `unknown`\> | Custom key-value pairs to merge into the interaction's custom fields | [api/ElementAPI.ts:392](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L392) |

***

## TriggerWorkflowParams

Defined in: [api/ElementAPI.ts:414](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L414)

Parameters for triggering an AXP workflow from an element.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="workflowid"></a> `workflowId` | `string` | ID of the workflow to execute | [api/ElementAPI.ts:416](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L416) |
| <a id="workflowversion"></a> `workflowVersion?` | `string` | Optional workflow version to execute. When omitted, the host defaults to `"current"`. | [api/ElementAPI.ts:420](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L420) |
| <a id="interactionid-8"></a> `interactionId?` | `string` | Optional interaction ID override. When omitted the host automatically attaches the current interaction context. Required for app-level widgets that are not scoped to a single interaction. | [api/ElementAPI.ts:426](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L426) |
| <a id="inputdata"></a> `inputData?` | `Record`\<`string`, `unknown`\> | Optional key/value input data forwarded to the workflow as its input parameters | [api/ElementAPI.ts:428](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L428) |

***

## TriggerWorkflowResponse

Defined in: [api/ElementAPI.ts:434](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L434)

Response returned after successfully triggering a workflow.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interactionid-9"></a> `interactionId?` | `string` | ID of the interaction the workflow was triggered on | [api/ElementAPI.ts:436](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L436) |
| <a id="message-1"></a> `message` | `string` | Human-readable confirmation message | [api/ElementAPI.ts:438](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L438) |

***

## ReasonCode

Defined in: [api/ElementAPI.ts:441](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L441)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-3"></a> `id` | `string` | [api/ElementAPI.ts:442](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L442) |
| <a id="reason"></a> `reason` | `string` | [api/ElementAPI.ts:443](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L443) |
| <a id="type-1"></a> `type` | `"away"` \| `"busy"` \| `"available"` \| `"queueLogout"` | [api/ElementAPI.ts:444](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L444) |
| <a id="typedisplay"></a> `typeDisplay` | `string` | [api/ElementAPI.ts:445](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L445) |
| <a id="eliteauxcode"></a> `eliteAuxCode?` | `number` | [api/ElementAPI.ts:446](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L446) |
| <a id="isdisabled"></a> `isDisabled` | `boolean` | [api/ElementAPI.ts:447](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L447) |
| <a id="issystemcode"></a> `isSystemCode?` | `boolean` | [api/ElementAPI.ts:448](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L448) |
| <a id="createdat"></a> `createdAt` | `string` | [api/ElementAPI.ts:449](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L449) |
| <a id="createdby"></a> `createdBy` | `string` | [api/ElementAPI.ts:450](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L450) |
| <a id="updatedat"></a> `updatedAt` | `string` \| `null` | [api/ElementAPI.ts:451](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L451) |
| <a id="updatedby"></a> `updatedBy` | `string` \| `null` | [api/ElementAPI.ts:452](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L452) |
| <a id="inworkflowid"></a> `inWorkflowId` | `string` \| `null` | [api/ElementAPI.ts:453](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L453) |
| <a id="inworkflowversionid"></a> `inWorkflowVersionId` | `string` \| `null` | [api/ElementAPI.ts:454](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L454) |
| <a id="outworkflowid"></a> `outWorkflowId` | `string` \| `null` | [api/ElementAPI.ts:455](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L455) |
| <a id="outworkflowversionid"></a> `outWorkflowVersionId` | `string` \| `null` | [api/ElementAPI.ts:456](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L456) |
| <a id="queryfieldid"></a> `queryFieldId` | `string` \| `null` | [api/ElementAPI.ts:457](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L457) |

***

## GetReasonCodesParams

Defined in: [api/ElementAPI.ts:460](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L460)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="type-2"></a> `type?` | `"away"` \| `"busy"` \| `"available"` \| `"queueLogout"` \| `null` | [api/ElementAPI.ts:461](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L461) |

***

## GetReasonCodesResponse

Defined in: [api/ElementAPI.ts:464](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L464)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="reasons"></a> `reasons` | [`ReasonCode`](#reasoncode)[] | [api/ElementAPI.ts:465](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L465) |

***

## GetUserInteractionsParams

Defined in: [api/ElementAPI.ts:468](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L468)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="userid"></a> `userId?` | `string` | [api/ElementAPI.ts:469](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L469) |
| <a id="details-1"></a> `details?` | `boolean` | [api/ElementAPI.ts:470](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L470) |

***

## QueueLoggedIn

Defined in: [api/ElementAPI.ts:473](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L473)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="queueid-3"></a> `queueId` | `string` | [api/ElementAPI.ts:474](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L474) |
| <a id="name-4"></a> `name` | `string` | [api/ElementAPI.ts:475](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L475) |
| <a id="queueweight"></a> `queueWeight` | `number` | [api/ElementAPI.ts:476](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L476) |
| <a id="timezone"></a> `timeZone` | `string` | [api/ElementAPI.ts:477](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L477) |
| <a id="extension"></a> `extension` | `number` \| `null` | [api/ElementAPI.ts:478](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L478) |
| <a id="createdon"></a> `createdOn` | `string` | [api/ElementAPI.ts:479](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L479) |
| <a id="createdonunix"></a> `createdOnUnix` | `number` | [api/ElementAPI.ts:480](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L480) |

***

## QueueAccess

Defined in: [api/ElementAPI.ts:483](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L483)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="queueid-4"></a> `queueId` | `string` | [api/ElementAPI.ts:484](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L484) |
| <a id="name-5"></a> `name` | `string` | [api/ElementAPI.ts:485](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L485) |
| <a id="queueweight-1"></a> `queueWeight` | `number` | [api/ElementAPI.ts:486](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L486) |
| <a id="timezone-1"></a> `timeZone` | `string` | [api/ElementAPI.ts:487](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L487) |
| <a id="extension-1"></a> `extension` | `number` \| `null` | [api/ElementAPI.ts:488](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L488) |

***

## UserInteractionsUser

Defined in: [api/ElementAPI.ts:491](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L491)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-4"></a> `id` | `string` | [api/ElementAPI.ts:492](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L492) |
| <a id="firstname"></a> `firstName` | `string` | [api/ElementAPI.ts:493](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L493) |
| <a id="lastname"></a> `lastName` | `string` | [api/ElementAPI.ts:494](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L494) |
| <a id="fullname"></a> `fullName` | `string` | [api/ElementAPI.ts:495](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L495) |
| <a id="title"></a> `title` | `string` \| `null` | [api/ElementAPI.ts:496](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L496) |
| <a id="email-2"></a> `email` | `string` | [api/ElementAPI.ts:497](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L497) |
| <a id="extension-2"></a> `extension` | `string` \| `null` | [api/ElementAPI.ts:498](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L498) |

***

## GetUserInteractionsResponse

Defined in: [api/ElementAPI.ts:501](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L501)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="interactions"></a> `interactions` | [`Interaction`](#interaction)[] | [api/ElementAPI.ts:502](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L502) |
| <a id="viewing"></a> `viewing` | [`Interaction`](#interaction)[] | [api/ElementAPI.ts:503](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L503) |
| <a id="combinedids"></a> `combinedIds?` | `string`[] | [api/ElementAPI.ts:504](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L504) |
| <a id="queue"></a> `queue` | \{ `loggedIn`: [`QueueLoggedIn`](#queueloggedin)[]; `access`: [`QueueAccess`](#queueaccess)[]; \} | [api/ElementAPI.ts:505](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L505) |
| `queue.loggedIn` | [`QueueLoggedIn`](#queueloggedin)[] | [api/ElementAPI.ts:506](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L506) |
| `queue.access` | [`QueueAccess`](#queueaccess)[] | [api/ElementAPI.ts:507](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L507) |
| <a id="user"></a> `user` | [`UserInteractionsUser`](#userinteractionsuser) | [api/ElementAPI.ts:509](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L509) |

***

## ElementAPIOptions

Defined in: [api/ElementAPI.ts:515](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L515)

Configuration options for ElementAPI initialization

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="elementid"></a> `elementId?` | `string` | Unique identifier for this element instance (auto-generated if not provided) | [api/ElementAPI.ts:517](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L517) |
| <a id="timeout"></a> `timeout?` | `number` | API request timeout in milliseconds (default: 5000) | [api/ElementAPI.ts:519](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L519) |
| <a id="debug"></a> `debug?` | `boolean` | Enable debug logging to console (default: false) | [api/ElementAPI.ts:521](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L521) |
| <a id="requesttarget"></a> `requestTarget?` | `Window` | When set (e.g. iframe.contentWindow), API sends requests to this window instead of window.parent. Use this when ElementAPI runs in the adaptor/bridge and the Agent UI is in an iframe. | [api/ElementAPI.ts:526](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L526) |
| <a id="targetwindow"></a> `targetWindow?` | `Window` | Legacy alias for `requestTarget`. Kept for compatibility with Peter's shell/adaptor prototype. | [api/ElementAPI.ts:531](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L531) |
| <a id="customerhosted"></a> `customerHosted?` | [`CustomerHostedSecurityOptions`](#customerhostedsecurityoptions) | Enables stricter iframe/origin checks for customer-hosted bridge/adaptor integrations. When set, ElementAPI validates the target iframe, pins postMessage to the configured origin, listens for iframe security changes, and blocks communication if the iframe becomes unsafe. | [api/ElementAPI.ts:538](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L538) |
| <a id="security"></a> `security?` | [`ElementAPISecurityOptions`](#elementapisecurityoptions) | Legacy security option name from the earlier shell/child prototype. When `security.iframe` is provided, it is translated into `customerHosted`. | [api/ElementAPI.ts:543](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L543) |

***

## CustomerHostedSecurityOptions

Defined in: [api/ElementAPI.ts:549](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L549)

Security configuration for customer-hosted bridge/adaptor integrations.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="iframe"></a> `iframe` | `HTMLIFrameElement` | The iframe that hosts Agent UI. | [api/ElementAPI.ts:551](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L551) |
| <a id="targetorigin"></a> `targetOrigin?` | `string` | Trusted origin for outbound postMessage calls. Defaults to the iframe src origin. Must be an http(s) origin. | [api/ElementAPI.ts:556](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L556) |
| <a id="requiredsandboxtokens"></a> `requiredSandboxTokens?` | `string`[] | Sandbox permissions that must be present on the iframe. Defaults to ["allow-scripts", "allow-same-origin"]. | [api/ElementAPI.ts:561](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L561) |
| <a id="disallowedsandboxtokens"></a> `disallowedSandboxTokens?` | `string`[] | Sandbox permissions that are considered unsafe for the iframe. Defaults to ["allow-top-navigation", "allow-top-navigation-by-user-activation", "allow-popups-to-escape-sandbox"]. | [api/ElementAPI.ts:566](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L566) |
| <a id="monitortampering"></a> `monitorTampering?` | `boolean` | Whether to watch iframe security attributes for runtime tampering. Defaults to `true`. | [api/ElementAPI.ts:571](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L571) |

***

## ElementAPISecurityOptions

Defined in: [api/ElementAPI.ts:580](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L580)

Backward-compatible security configuration from the earlier shell/child prototype.

Prefer `customerHosted` for adaptor/bridge integrations. This interface is kept
so Peter's option names can be accepted without rewriting callers.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="iframe-1"></a> `iframe?` | `HTMLIFrameElement` | The iframe hosting Agent UI when running in shell/adaptor mode. When set, these options are translated into `customerHosted`. | [api/ElementAPI.ts:585](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L585) |
| <a id="expectedorigin"></a> `expectedOrigin?` | `string` | Expected iframe origin in shell/adaptor mode. Maps to `customerHosted.targetOrigin`. | [api/ElementAPI.ts:590](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L590) |
| <a id="allowedparentorigins"></a> `allowedParentOrigins?` | `string`[] | Allowed parent origins from the original child-mode prototype. Retained for compatibility/documentation; the dedicated Agent UI security hook should enforce parent-origin checks in embedded child mode. | [api/ElementAPI.ts:596](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L596) |
| <a id="monitortampering-1"></a> `monitorTampering?` | `boolean` | Whether to monitor the iframe for runtime tampering. Maps to `customerHosted.monitorTampering`. | [api/ElementAPI.ts:601](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L601) |
| <a id="requiredsandboxtokens-1"></a> `requiredSandboxTokens?` | `string`[] | Optional strict sandbox requirements to apply in shell/adaptor mode. | [api/ElementAPI.ts:605](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L605) |
| <a id="disallowedsandboxtokens-1"></a> `disallowedSandboxTokens?` | `string`[] | Optional disallowed sandbox permissions to apply in shell/adaptor mode. | [api/ElementAPI.ts:609](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L609) |

***

## InteractionQueueInfo

Defined in: [api/ElementAPI.ts:613](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L613)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-5"></a> `id` | `string` | [api/ElementAPI.ts:614](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L614) |
| <a id="name-6"></a> `name` | `string` | [api/ElementAPI.ts:615](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L615) |
| <a id="extension-3"></a> `extension` | `string` \| `null` | [api/ElementAPI.ts:616](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L616) |
| <a id="waitinginteractions"></a> `waitingInteractions` | `number` | [api/ElementAPI.ts:617](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L617) |
| <a id="countofcallbacks"></a> `countOfCallbacks` | `number` | [api/ElementAPI.ts:618](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L618) |
| <a id="countactiveagents"></a> `countActiveAgents` | `number` | [api/ElementAPI.ts:619](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L619) |
| <a id="totalcurrentinteractions"></a> `totalCurrentInteractions` | `number` | [api/ElementAPI.ts:620](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L620) |
| <a id="connectedinteractions"></a> `connectedInteractions` | `number` | [api/ElementAPI.ts:621](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L621) |
| <a id="avginteractionwaittime"></a> `avgInteractionWaitTime` | `number` | [api/ElementAPI.ts:622](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L622) |
| <a id="weight"></a> `weight` | `number` | [api/ElementAPI.ts:623](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L623) |
| <a id="eligible"></a> `eligible` | `boolean` | [api/ElementAPI.ts:624](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L624) |

***

## UserQueueInfo

Defined in: [api/ElementAPI.ts:628](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L628)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-6"></a> `id` | `string` | [api/ElementAPI.ts:629](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L629) |
| <a id="name-7"></a> `name` | `string` | [api/ElementAPI.ts:630](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L630) |

***

## KeycloakConfig

Defined in: [auth/KeycloakAuth.ts:29](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L29)

Keycloak OAuth 2.0 PKCE Authentication Module

## Sandboxed Iframe Environment

**IMPORTANT:** Elements run in sandboxed iframes using `srcdoc`, which means:
- `window.location.origin` returns `"null"` (the literal string "null")
- `document.referrer` may be empty
- Direct fetch to external URLs may fail due to CORS
- BroadcastChannel doesn't work (requires valid origin)

Because of these limitations:
- Token refresh requests are delegated to the host via postMessage
- The host (with a valid origin) makes the actual HTTP request
- OAuth popup flow works because the popup opens redirect.html on the host's origin

## OAuth Flow

Uses postMessage-based config exchange with redirect.html:
1. Component opens popup directly
2. redirect.html requests config via postMessage
3. Component responds with config + code verifier
4. redirect.html performs token exchange
5. redirect.html sends token back to component

No localStorage bridging needed - config stays in memory.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="authorizationendpoint"></a> `authorizationEndpoint?` | `string` | - | [auth/KeycloakAuth.ts:30](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L30) |
| <a id="tokenendpoint"></a> `tokenEndpoint?` | `string` | - | [auth/KeycloakAuth.ts:31](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L31) |
| <a id="clientid"></a> `clientId?` | `string` | - | [auth/KeycloakAuth.ts:32](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L32) |
| <a id="scopes"></a> `scopes?` | `string`[] | - | [auth/KeycloakAuth.ts:33](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L33) |
| <a id="redirecturi"></a> `redirectUri?` | `string` | URL to redirect.html - used for OAuth callback and token refresh | [auth/KeycloakAuth.ts:35](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L35) |

***

## PopupOptions

Defined in: [auth/KeycloakAuth.ts:38](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L38)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="width"></a> `width?` | `number` | [auth/KeycloakAuth.ts:39](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L39) |
| <a id="height"></a> `height?` | `number` | [auth/KeycloakAuth.ts:40](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L40) |
| <a id="left"></a> `left?` | `number` | [auth/KeycloakAuth.ts:41](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L41) |
| <a id="top"></a> `top?` | `number` | [auth/KeycloakAuth.ts:42](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L42) |

***

## TokenResponse

Defined in: [auth/KeycloakAuth.ts:199](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L199)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="access_token"></a> `access_token` | `string` | [auth/KeycloakAuth.ts:200](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L200) |
| <a id="refresh_token"></a> `refresh_token?` | `string` | [auth/KeycloakAuth.ts:201](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L201) |
| <a id="expires_in"></a> `expires_in?` | `number` | [auth/KeycloakAuth.ts:202](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L202) |
| <a id="refresh_expires_in"></a> `refresh_expires_in?` | `number` | [auth/KeycloakAuth.ts:203](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L203) |
| <a id="token_type"></a> `token_type?` | `string` | [auth/KeycloakAuth.ts:204](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L204) |
| <a id="id_token"></a> `id_token?` | `string` | [auth/KeycloakAuth.ts:205](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L205) |

***

## StoredTokenData

Defined in: [auth/KeycloakAuth.ts:208](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L208)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="accesstoken"></a> `accessToken` | `string` | [auth/KeycloakAuth.ts:209](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L209) |
| <a id="refreshtoken-2"></a> `refreshToken?` | `string` | [auth/KeycloakAuth.ts:210](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L210) |
| <a id="expiresat"></a> `expiresAt?` | `number` | [auth/KeycloakAuth.ts:211](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L211) |
| <a id="refreshexpiresat"></a> `refreshExpiresAt?` | `number` | [auth/KeycloakAuth.ts:212](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L212) |

***

## IframeValidationResult

Defined in: [security/IframeSecurity.ts:9](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L9)

Result of an iframe security validation check.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="valid"></a> `valid` | `boolean` | Whether the iframe passed all blocking security checks. | [security/IframeSecurity.ts:11](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L11) |
| <a id="errors"></a> `errors` | `string`[] | Critical security issues that should block communication. | [security/IframeSecurity.ts:13](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L13) |
| <a id="warnings"></a> `warnings` | `string`[] | Non-blocking issues worth surfacing to the caller. | [security/IframeSecurity.ts:15](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L15) |

***

## IframeValidationOptions

Defined in: [security/IframeSecurity.ts:21](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L21)

Options for validating an iframe element's security configuration.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="expectedorigin-1"></a> `expectedOrigin?` | `string` | Expected origin for the iframe's src URL. If provided, the iframe's src must resolve to this origin exactly. | [security/IframeSecurity.ts:26](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L26) |
| <a id="requiredsandbox"></a> `requiredSandbox?` | `string`[] | Sandbox tokens that must be present when a sandbox attribute exists. Defaults to `["allow-scripts", "allow-popups", "allow-forms"]`. | [security/IframeSecurity.ts:31](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L31) |
| <a id="disallowedsandbox"></a> `disallowedSandbox?` | `string`[] | Sandbox tokens that must not be present. Defaults to `[]`. | [security/IframeSecurity.ts:36](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L36) |
| <a id="requirehttps"></a> `requireHttps?` | `boolean` | Whether the iframe src must use HTTPS. Defaults to `true`. | [security/IframeSecurity.ts:41](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L41) |
| <a id="requiresandbox"></a> `requireSandbox?` | `boolean` | Whether the iframe must declare a sandbox attribute. Defaults to `false`. | [security/IframeSecurity.ts:46](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L46) |

***

## TamperDetails

Defined in: [security/IframeSecurity.ts:52](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L52)

Callback details when iframe tampering is detected.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="attribute"></a> `attribute` | `string` | The attribute that changed. | [security/IframeSecurity.ts:54](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L54) |
| <a id="oldvalue"></a> `oldValue` | `string` \| `null` | The original value captured when monitoring started. | [security/IframeSecurity.ts:56](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L56) |
| <a id="newvalue"></a> `newValue` | `string` \| `null` | The new value after the mutation. | [security/IframeSecurity.ts:58](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L58) |

***

## IframeMonitorOptions

Defined in: [security/IframeSecurity.ts:68](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L68)

Options for monitoring an iframe for security-critical attribute changes.

Uses a snapshot-and-compare model: all watched attribute values are captured
when `monitorIframe()` is called, and any subsequent change fires the
callback regardless of whether the new value is still "valid".

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="ontamperdetected"></a> `onTamperDetected` | (`details`: [`TamperDetails`](#tamperdetails)) => `void` | Callback invoked when any watched attribute changes from its initial value. | [security/IframeSecurity.ts:72](../node_modules/@avaya/infinity-elements-api/src/security/IframeSecurity.ts#L72) |

***

## CrmConfig

Defined in: [types/iefConfig.ts:19](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L19)

Admin-configured CRM settings for the current user.

The known fields below come from the user object's `crmConfigurations`
record. Additional admin-defined keys may be present — read them via the
index signature, but do not assume any unlisted key is guaranteed to exist.

### Indexable

```ts
[key: string]: unknown
```

Additional admin-defined keys.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id-7"></a> `id` | `string` | CRM configuration record id. | [types/iefConfig.ts:21](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L21) |
| <a id="clicktodial"></a> `clickToDial?` | `boolean` | Whether click-to-dial is enabled for this user. | [types/iefConfig.ts:23](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L23) |
| <a id="clicktoconsult"></a> `clickToConsult?` | `boolean` | Whether click-to-consult is enabled for this user. | [types/iefConfig.ts:25](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L25) |
| <a id="omnichannelenabled"></a> `omnichannelEnabled?` | `"S"` \| `"C"` \| `"N"` | Omnichannel mode: "S" (single), "C" (concurrent), or "N" (none). | [types/iefConfig.ts:27](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L27) |
| <a id="complementarydefaultstatus"></a> `complementaryDefaultStatus?` | `string` | Default status applied when complementary channel actions complete. | [types/iefConfig.ts:29](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L29) |

***

## IEFConfig

Defined in: [types/iefConfig.ts:43](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L43)

Snapshot of the element's context within the current session.
Returned by `ElementAPI.getConfig()`.

**Expandable shape:** new properties may be added in future releases —
element implementations should not rely on an exhaustive shape, and the
object should be read by property name rather than by destructuring against
a fixed key set.

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="originalinteraction"></a> `originalInteraction` | [`InteractionInfo`](#interactioninfo) \| `null` | The interaction that spawned this element, or `null` for home-based elements that were not launched from a specific interaction. | [types/iefConfig.ts:48](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L48) |
| <a id="userid-1"></a> `userId` | `string` | Agent / user identity for the current session. | [types/iefConfig.ts:51](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L51) |
| <a id="engagementid"></a> `engagementId` | `string` \| `null` | Customer session identifier that persists throughout the customer's active session. Created when an interaction is initiated and survives transfers — the `interactionId` changes on transfer but this value remains the same. Resets to a new value when the interaction is closed-resolved and the customer contacts again. `null` when the element is home-based (not spawned from an interaction), or when the spawning interaction carries no engagement context. | [types/iefConfig.ts:63](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L63) |
| <a id="crmconfig-1"></a> `crmConfig` | [`CrmConfig`](#crmconfig) \| `null` | Admin-configured CRM settings for the current user. `null` if the user's CRM configuration could not be loaded. | [types/iefConfig.ts:69](../node_modules/@avaya/infinity-elements-api/src/types/iefConfig.ts#L69) |

***

## Interaction

Defined in: [types/interaction.ts:7](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L7)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-8"></a> `id` | `string` | [types/interaction.ts:8](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L8) |
| <a id="interactionid-11"></a> `interactionId` | `string` | [types/interaction.ts:9](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L9) |
| <a id="accountid"></a> `accountId` | `string` | [types/interaction.ts:10](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L10) |
| <a id="initialcommtype"></a> `initialCommType` | `string` | [types/interaction.ts:11](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L11) |
| <a id="initialsubcommtype"></a> `initialSubCommType` | `string` | [types/interaction.ts:12](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L12) |
| <a id="commtype-3"></a> `commType` | `CommType` | [types/interaction.ts:13](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L13) |
| <a id="subcommtype-2"></a> `subCommType` | `string` | [types/interaction.ts:14](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L14) |
| <a id="createdfromtransfer"></a> `createdFromTransfer` | `CreatedFromTransfer` | [types/interaction.ts:15](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L15) |
| <a id="completion"></a> `completion` | `Completion` | [types/interaction.ts:16](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L16) |
| <a id="lastupdated"></a> `lastUpdated?` | `string` | [types/interaction.ts:17](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L17) |
| <a id="completiontimeunix"></a> `completionTimeUnix?` | `number` | [types/interaction.ts:18](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L18) |
| <a id="isabandoned"></a> `isAbandoned` | `boolean` | [types/interaction.ts:19](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L19) |
| <a id="ismaxwait"></a> `isMaxWait` | `boolean` | [types/interaction.ts:20](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L20) |
| <a id="ignoreuserhangup"></a> `ignoreUserHangup` | `boolean` | [types/interaction.ts:21](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L21) |
| <a id="status-3"></a> `status` | `string` | [types/interaction.ts:22](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L22) |
| <a id="starttime-1"></a> `startTime` | `string` | [types/interaction.ts:23](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L23) |
| <a id="starttimeunix"></a> `startTimeUnix` | `number` | [types/interaction.ts:24](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L24) |
| <a id="statusupdatedat"></a> `statusUpdatedAt` | `string` | [types/interaction.ts:25](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L25) |
| <a id="statusupdatedatunix"></a> `statusUpdatedAtUnix` | `number` | [types/interaction.ts:26](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L26) |
| <a id="iscompleted"></a> `isCompleted` | `boolean` | [types/interaction.ts:27](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L27) |
| <a id="iscompletedconference"></a> `isCompletedConference?` | `boolean` | [types/interaction.ts:28](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L28) |
| <a id="details-2"></a> `details` | `Details` | [types/interaction.ts:29](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L29) |
| <a id="custom"></a> `custom` | `Record`\<`string`, `unknown`\> & \{ `crm`: \{ `sfdc`: \{ `screenPopObjects?`: `unknown`; \}; `msdynamics`: \{ `screenPopObjects?`: `unknown`; \}; \}; `crmobjects?`: `unknown`[]; \} | [types/interaction.ts:30](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L30) |
| <a id="sourcedetails-1"></a> `sourceDetails` | `SourceDetails` | [types/interaction.ts:41](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L41) |
| <a id="linkedids"></a> `linkedIds` | `LinkedIds` | [types/interaction.ts:42](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L42) |
| <a id="routingdetails"></a> `routingDetails` | `RoutingDetails` | [types/interaction.ts:43](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L43) |
| <a id="points"></a> `points` | `number` | [types/interaction.ts:44](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L44) |
| <a id="tags"></a> `tags` | `Tag`[] | [types/interaction.ts:45](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L45) |
| <a id="tagnames"></a> `tagNames` | `string`[] | [types/interaction.ts:46](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L46) |
| <a id="customer-1"></a> `customer` | `Customer` | [types/interaction.ts:47](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L47) |
| <a id="person"></a> `person?` | `Person` | [types/interaction.ts:48](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L48) |
| <a id="assignee"></a> `assignee` | `Record`\<`string`, `unknown`\> | [types/interaction.ts:49](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L49) |
| <a id="user-1"></a> `user` | `User` | [types/interaction.ts:50](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L50) |
| <a id="relatedusers"></a> `relatedUsers` | `unknown`[] | [types/interaction.ts:51](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L51) |
| <a id="ismute-1"></a> `isMute` | `boolean` | [types/interaction.ts:52](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L52) |
| <a id="isaudio-1"></a> `isAudio` | `boolean` | [types/interaction.ts:53](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L53) |
| <a id="isvideo"></a> `isVideo` | `boolean` | [types/interaction.ts:54](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L54) |
| <a id="ishold-1"></a> `isHold` | `boolean` | [types/interaction.ts:55](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L55) |
| <a id="iscallback"></a> `isCallback` | `boolean` | [types/interaction.ts:56](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L56) |
| <a id="isinvoicemail"></a> `isInVoicemail` | `boolean` | [types/interaction.ts:57](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L57) |
| <a id="isbot"></a> `isBot` | `boolean` | [types/interaction.ts:58](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L58) |
| <a id="isbotworkflowsessionid"></a> `isBotWorkflowSessionId` | `string` \| `null` | [types/interaction.ts:59](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L59) |
| <a id="isexitnoagents"></a> `isExitNoAgents` | `boolean` | [types/interaction.ts:60](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L60) |
| <a id="isripable"></a> `isRipable` | `boolean` | [types/interaction.ts:61](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L61) |
| <a id="isaid-2"></a> `isAID` | `boolean` | [types/interaction.ts:62](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L62) |
| <a id="isaidcalculated"></a> `isAIDCalculated` | `boolean` | [types/interaction.ts:63](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L63) |
| <a id="journey"></a> `journey?` | \{ `query`: `string`; `value`: `string`; \} | [types/interaction.ts:64](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L64) |
| `journey.query` | `string` | [types/interaction.ts:65](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L65) |
| `journey.value` | `string` | [types/interaction.ts:66](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L66) |
| <a id="transfer"></a> `transfer?` | `Transfer` | [types/interaction.ts:68](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L68) |
| <a id="recording"></a> `recording` | `Recording` | [types/interaction.ts:69](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L69) |
| <a id="hadlivetranscriptioncustomer"></a> `hadLiveTranscriptionCustomer` | `boolean` | [types/interaction.ts:70](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L70) |
| <a id="hadlivetranscriptionuser"></a> `hadLiveTranscriptionUser` | `boolean` | [types/interaction.ts:71](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L71) |
| <a id="hadrecording"></a> `hadRecording` | `boolean` | [types/interaction.ts:72](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L72) |
| <a id="integrations"></a> `integrations` | `Record`\<`string`, `unknown`\> | [types/interaction.ts:73](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L73) |
| <a id="queue-1"></a> `queue` | `Queue` | [types/interaction.ts:74](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L74) |
| <a id="nexttrigger"></a> `nextTrigger` | `NextTrigger` | [types/interaction.ts:75](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L75) |
| <a id="maxwait"></a> `maxWait` | `MaxWait` | [types/interaction.ts:76](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L76) |
| <a id="exitnoagents"></a> `exitNoAgents` | `ExitNoAgents` | [types/interaction.ts:77](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L77) |
| <a id="createdon-1"></a> `createdOn` | `string` | [types/interaction.ts:78](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L78) |
| <a id="createdonunix-1"></a> `createdOnUnix` | `number` | [types/interaction.ts:79](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L79) |
| <a id="endtime"></a> `endTime` | `string` \| `null` | [types/interaction.ts:80](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L80) |
| <a id="metrics"></a> `metrics` | `Metrics` | [types/interaction.ts:81](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L81) |
| <a id="scores"></a> `scores` | `Scores` | [types/interaction.ts:82](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L82) |
| <a id="servername"></a> `serverName` | `string` \| `null` | [types/interaction.ts:83](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L83) |
| <a id="processid"></a> `processId` | `string` \| `null` | [types/interaction.ts:84](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L84) |
| <a id="timeouttime"></a> `timeoutTime` | `string` \| `null` | [types/interaction.ts:85](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L85) |
| <a id="isaidrestricted"></a> `isAIDRestricted` | `boolean` | [types/interaction.ts:86](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L86) |
| <a id="viewers"></a> `viewers?` | `Viewer`[] | [types/interaction.ts:87](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L87) |
| <a id="iselite"></a> `isElite` | `boolean` | [types/interaction.ts:88](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L88) |
| <a id="callfailed"></a> `callFailed?` | \{ `error`: \{ `code`: `string`; `message`: `string`; `failReason`: `string`; `participantId`: `string`; \}; `timestamp`: `string`; \} | [types/interaction.ts:89](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L89) |
| `callFailed.error` | \{ `code`: `string`; `message`: `string`; `failReason`: `string`; `participantId`: `string`; \} | [types/interaction.ts:90](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L90) |
| `callFailed.error.code` | `string` | [types/interaction.ts:91](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L91) |
| `callFailed.error.message` | `string` | [types/interaction.ts:92](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L92) |
| `callFailed.error.failReason` | `string` | [types/interaction.ts:93](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L93) |
| `callFailed.error.participantId` | `string` | [types/interaction.ts:94](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L94) |
| `callFailed.timestamp` | `string` | [types/interaction.ts:96](../node_modules/@avaya/infinity-elements-api/src/types/interaction.ts#L96) |

***

## Message

Defined in: [types/message.ts:118](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L118)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-9"></a> `id` | `string` | [types/message.ts:119](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L119) |
| <a id="author"></a> `author` | \{ `displayName?`: `string`; `id?`: `string`; `type`: `"user"` \| `"phoneNumber"`; `details?`: \{ `displayName?`: `string`; `id?`: `string`; `avatarUrl?`: `string`; `imageLastChangedAt?`: `string` \| `null`; \}; \} | [types/message.ts:120](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L120) |
| `author.displayName?` | `string` | [types/message.ts:121](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L121) |
| `author.id?` | `string` | [types/message.ts:122](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L122) |
| `author.type` | `"user"` \| `"phoneNumber"` | [types/message.ts:123](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L123) |
| `author.details?` | \{ `displayName?`: `string`; `id?`: `string`; `avatarUrl?`: `string`; `imageLastChangedAt?`: `string` \| `null`; \} | [types/message.ts:124](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L124) |
| `author.details.displayName?` | `string` | [types/message.ts:125](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L125) |
| `author.details.id?` | `string` | [types/message.ts:126](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L126) |
| `author.details.avatarUrl?` | `string` | [types/message.ts:127](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L127) |
| `author.details.imageLastChangedAt?` | `string` \| `null` | [types/message.ts:128](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L128) |
| <a id="displaynameoverride"></a> `displayNameOverride?` | `string` | [types/message.ts:131](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L131) |
| <a id="channel"></a> `channel?` | `string` | [types/message.ts:132](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L132) |
| <a id="channelmessagecomponentid"></a> `channelMessageComponentId?` | `string` | [types/message.ts:133](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L133) |
| <a id="createdat-1"></a> `createdAt` | `string` | [types/message.ts:134](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L134) |
| <a id="direction-1"></a> `direction` | `"in"` \| `"out"` | [types/message.ts:135](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L135) |
| <a id="fromphonenumber"></a> `fromPhoneNumber?` | `string` \| `null` | [types/message.ts:136](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L136) |
| <a id="isbot-1"></a> `isBot` | `boolean` | [types/message.ts:137](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L137) |
| <a id="iscanned"></a> `isCanned?` | `boolean` | [types/message.ts:138](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L138) |
| <a id="isdeleted"></a> `isDeleted?` | `boolean` | [types/message.ts:139](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L139) |
| <a id="isedited"></a> `isEdited?` | `boolean` | [types/message.ts:140](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L140) |
| <a id="isemail"></a> `isEmail?` | `boolean` | [types/message.ts:141](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L141) |
| <a id="ismms"></a> `isMms?` | `boolean` | [types/message.ts:142](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L142) |
| <a id="ispinned"></a> `isPinned?` | `boolean` | [types/message.ts:143](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L143) |
| <a id="isprivate"></a> `isPrivate` | `boolean` | [types/message.ts:144](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L144) |
| <a id="issaved"></a> `isSaved?` | `boolean` | [types/message.ts:145](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L145) |
| <a id="issms"></a> `isSms?` | `boolean` | [types/message.ts:146](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L146) |
| <a id="message-3"></a> `message` | `string` \| `FancyMessage`[] | [types/message.ts:147](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L147) |
| <a id="paginationid"></a> `paginationId` | `string` | [types/message.ts:148](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L148) |
| <a id="pinnedat"></a> `pinnedAt` | `string` \| `null` | [types/message.ts:149](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L149) |
| <a id="pinnedby"></a> `pinnedBy` | `string` \| `null` | [types/message.ts:150](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L150) |
| <a id="pinnedbyuserfirstlastname"></a> `pinnedByUserFirstLastName` | `string` \| `null` | [types/message.ts:151](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L151) |
| <a id="subtype"></a> `subType?` | `MessageSubType` | [types/message.ts:152](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L152) |
| <a id="type-3"></a> `type` | `"email"` \| `"sms"` \| `"chat"` | [types/message.ts:153](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L153) |
| <a id="updatedat-1"></a> `updatedAt?` | `string` \| `null` | [types/message.ts:154](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L154) |
| <a id="threadchannelmessageid"></a> `threadChannelMessageId?` | `string` \| `null` | [types/message.ts:155](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L155) |
| <a id="translations"></a> `translations?` | `Record`\<`string`, `string`\> | [types/message.ts:156](../node_modules/@avaya/infinity-elements-api/src/types/message.ts#L156) |

***

## GetUsersResponse

Defined in: [types/user.ts:10](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L10)

Response from getUsers API
Used for transfer/consult target selection

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id-10"></a> `id` | `string` | Handle / internal user ID | [types/user.ts:12](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L12) |
| <a id="firstname-1"></a> `firstName` | `string` | First name | [types/user.ts:14](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L14) |
| <a id="lastname-1"></a> `lastName` | `string` | Last name | [types/user.ts:16](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L16) |
| <a id="fullname-1"></a> `fullName` | `string` | Full name | [types/user.ts:18](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L18) |
| <a id="email-3"></a> `email` | `string` | Email address | [types/user.ts:20](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L20) |
| <a id="mobile"></a> `mobile` | `string` \| `null` | Mobile phone number | [types/user.ts:22](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L22) |
| <a id="presence"></a> `presence` | `string` \| `null` | VoIP/presence status (e.g., "available", "busy", "offline") | [types/user.ts:24](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L24) |
| <a id="cxstatus"></a> `cxStatus` | \{ `statusType`: `string`; `status`: `string`; \} | CX status information | [types/user.ts:26](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L26) |
| `cxStatus.statusType` | `string` | CX status category (e.g., "available", "busy", "away") | [types/user.ts:28](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L28) |
| `cxStatus.status` | `string` | CX status display name (e.g., "Available", "On Call", "Lunch") | [types/user.ts:30](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L30) |
| <a id="extension-4"></a> `extension` | `string` \| `null` | Extension number | [types/user.ts:33](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L33) |
| <a id="eligible-1"></a> `eligible` | `boolean` | Whether user is eligible for transfer | [types/user.ts:35](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L35) |

***

## UserLocation

Defined in: [types/user.ts:38](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L38)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="addressdata"></a> `addressData?` | \{ `address1`: `string`; `address2`: `string`; `city`: `string`; `state`: `string`; `country`: `string`; `postalCode`: `string`; `locationName`: `string`; \} | [types/user.ts:39](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L39) |
| `addressData.address1` | `string` | [types/user.ts:40](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L40) |
| `addressData.address2` | `string` | [types/user.ts:41](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L41) |
| `addressData.city` | `string` | [types/user.ts:42](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L42) |
| `addressData.state` | `string` | [types/user.ts:43](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L43) |
| `addressData.country` | `string` | [types/user.ts:44](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L44) |
| `addressData.postalCode` | `string` | [types/user.ts:45](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L45) |
| `addressData.locationName` | `string` | [types/user.ts:46](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L46) |
| <a id="locationid"></a> `locationId` | `string` | [types/user.ts:48](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L48) |
| <a id="e911number"></a> `e911Number` | `string` | [types/user.ts:49](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L49) |
| <a id="ise911"></a> `isE911` | `string` \| `boolean` | [types/user.ts:50](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L50) |
| <a id="e911calleridnumber"></a> `e911CallerIdNumber?` | `string` \| `null` | [types/user.ts:51](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L51) |

***

## QueueInfo

Defined in: [types/user.ts:54](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L54)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="queueid-6"></a> `queueId` | `string` | [types/user.ts:55](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L55) |
| <a id="name-8"></a> `name` | `string` | [types/user.ts:56](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L56) |
| <a id="isaccess"></a> `isAccess` | `boolean` | [types/user.ts:57](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L57) |
| <a id="isautologin"></a> `isAutoLogin` | `boolean` | [types/user.ts:58](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L58) |
| <a id="proficiency"></a> `proficiency?` | `unknown` | [types/user.ts:59](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L59) |

***

## UserTag

Defined in: [types/user.ts:62](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L62)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="tagid"></a> `tagId` | `string` | [types/user.ts:63](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L63) |
| <a id="backgroundcolor"></a> `backgroundColor` | `string` | [types/user.ts:64](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L64) |
| <a id="color"></a> `color` | `string` | [types/user.ts:65](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L65) |
| <a id="iconcode"></a> `iconCode` | `string` | [types/user.ts:66](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L66) |
| <a id="name-9"></a> `name` | `string` | [types/user.ts:67](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L67) |

***

## DefaultLeaveEventToStatus

Defined in: [types/user.ts:70](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L70)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="action"></a> `action` | `string` | [types/user.ts:71](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L71) |
| <a id="status-4"></a> `status` | `string` | [types/user.ts:72](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L72) |

***

## InfinityElement

Defined in: [types/user.ts:94](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L94)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="accountid-1"></a> `accountId` | `string` | [types/user.ts:95](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L95) |
| <a id="apiversionid"></a> `apiVersionId` | `string` | [types/user.ts:96](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L96) |
| <a id="config"></a> `config` | [`InfinityElementConfig`](#infinityelementconfig) | [types/user.ts:97](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L97) |
| <a id="createdat-2"></a> `createdAt` | `string` | [types/user.ts:98](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L98) |
| <a id="createdby-1"></a> `createdBy` | `string` | [types/user.ts:99](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L99) |
| <a id="folderid"></a> `folderId` | `string` \| `null` | [types/user.ts:100](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L100) |
| <a id="icon"></a> `icon` | `string` | [types/user.ts:101](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L101) |
| <a id="id-11"></a> `id` | `string` | [types/user.ts:102](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L102) |
| <a id="name-10"></a> `name` | `string` | [types/user.ts:103](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L103) |
| <a id="tagname"></a> `tagName` | `string` | [types/user.ts:104](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L104) |
| <a id="updatedat-2"></a> `updatedAt` | `string` | [types/user.ts:105](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L105) |
| <a id="updatedby-1"></a> `updatedBy` | `string` \| `null` | [types/user.ts:106](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L106) |
| <a id="uploadedat"></a> `uploadedAt` | `string` \| `null` | [types/user.ts:107](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L107) |
| <a id="uploadedby"></a> `uploadedBy` | `string` \| `null` | [types/user.ts:108](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L108) |

***

## UserInfo

Defined in: [types/user.ts:111](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L111)

### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="userid-2"></a> `userId` | `string` | User ID | [types/user.ts:114](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L114) |
| <a id="status-5"></a> `status?` | `string` | Whether the user is enabled (status === 'enabled' for yes) | [types/user.ts:116](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L116) |
| <a id="firstname-2"></a> `firstName` | `string` | First name | [types/user.ts:118](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L118) |
| <a id="lastname-2"></a> `lastName` | `string` | Last name | [types/user.ts:120](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L120) |
| <a id="namesuffix"></a> `nameSuffix?` | `string` \| `null` | Name suffix (e.g., Jr., Sr., III) | [types/user.ts:122](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L122) |
| <a id="title-1"></a> `title` | `string` | Job title | [types/user.ts:124](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L124) |
| <a id="email-4"></a> `email` | `string` | Email address | [types/user.ts:126](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L126) |
| <a id="mobile-1"></a> `mobile?` | `string` \| `null` | Mobile phone number | [types/user.ts:128](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L128) |
| <a id="languagecode"></a> `languageCode?` | `string` | Language code (e.g., 'en', 'es') | [types/user.ts:130](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L130) |
| <a id="location"></a> `location?` | [`UserLocation`](#userlocation) \| `null` | E911 location information | [types/user.ts:132](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L132) |
| <a id="timezone-2"></a> `timezone?` | `string` | Timezone (e.g., 'America/New_York') | [types/user.ts:134](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L134) |
| <a id="licensetype"></a> `licenseType?` | `string` | License type | [types/user.ts:138](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L138) |
| <a id="consolepermissions"></a> `consolePermissions?` | \{ `account?`: `Record`\<`"read"`, `string`\>; `api?`: `Record`\<`"read"`, `string`\>; `callRecordings?`: `Record`\<`"delete"`, `string`\>; `cx?`: `Record`\<`"read"`, `string`\>; `mL?`: `Record`\<`"read"`, `string`\>; `numbers?`: `Record`\<`"read"`, `string`\>; `objects?`: `Record`\<`"read"`, `string`\>; `portal?`: `Record`\<`"console-web"`, `string`\>; `queues?`: `Record`\<`"read"`, `string`\>; \} | Console permissions | [types/user.ts:140](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L140) |
| `consolePermissions.account?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:141](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L141) |
| `consolePermissions.api?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:142](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L142) |
| `consolePermissions.callRecordings?` | `Record`\<`"delete"`, `string`\> | - | [types/user.ts:143](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L143) |
| `consolePermissions.cx?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:144](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L144) |
| `consolePermissions.mL?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:145](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L145) |
| `consolePermissions.numbers?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:146](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L146) |
| `consolePermissions.objects?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:147](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L147) |
| `consolePermissions.portal?` | `Record`\<`"console-web"`, `string`\> | - | [types/user.ts:148](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L148) |
| `consolePermissions.queues?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:149](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L149) |
| <a id="apppermissions"></a> `appPermissions?` | \{ `agent?`: `Record`\<`"read"`, `string`\>; `analytics?`: `Record`\<`"read"`, `string`\>; `chat?`: `Record`\<`"read"` \| `"admin"`, `string`\>; `coaching?`: `Record`\<`"read"`, `string`\>; `contacts?`: `Record`\<`"read"`, `string`\>; `workflowReplay?`: `Record`\<`"read"`, `string`\>; `dashboards?`: `Record`\<`"read"`, `string`\>; `portal?`: \{ `app-android`: `string`; `app-ios`: `string`; `app-osx`: `string`; `app-web`: `string`; `app-win`: `string`; `app-support-access`: `string`; \}; `queueList?`: `Record`\<`"read"`, `string`\>; `queueToggling?`: `Record`\<`"read"`, `string`\>; `teamview?`: `Record`\<`"read"`, `string`\>; `ucFax?`: `Record`\<`"read"`, `string`\>; `outreachmonitor?`: `Record`\<`"read"`, `string`\>; \} | Application permissions | [types/user.ts:152](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L152) |
| `appPermissions.agent?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:153](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L153) |
| `appPermissions.analytics?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:154](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L154) |
| `appPermissions.chat?` | `Record`\<`"read"` \| `"admin"`, `string`\> | - | [types/user.ts:155](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L155) |
| `appPermissions.coaching?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:156](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L156) |
| `appPermissions.contacts?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:157](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L157) |
| `appPermissions.workflowReplay?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:158](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L158) |
| `appPermissions.dashboards?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:159](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L159) |
| `appPermissions.portal?` | \{ `app-android`: `string`; `app-ios`: `string`; `app-osx`: `string`; `app-web`: `string`; `app-win`: `string`; `app-support-access`: `string`; \} | - | [types/user.ts:160](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L160) |
| `appPermissions.portal.app-android` | `string` | - | [types/user.ts:161](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L161) |
| `appPermissions.portal.app-ios` | `string` | - | [types/user.ts:162](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L162) |
| `appPermissions.portal.app-osx` | `string` | - | [types/user.ts:163](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L163) |
| `appPermissions.portal.app-web` | `string` | - | [types/user.ts:164](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L164) |
| `appPermissions.portal.app-win` | `string` | - | [types/user.ts:165](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L165) |
| `appPermissions.portal.app-support-access` | `string` | - | [types/user.ts:166](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L166) |
| `appPermissions.queueList?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:168](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L168) |
| `appPermissions.queueToggling?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:169](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L169) |
| `appPermissions.teamview?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:170](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L170) |
| `appPermissions.ucFax?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:171](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L171) |
| `appPermissions.outreachmonitor?` | `Record`\<`"read"`, `string`\> | - | [types/user.ts:172](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L172) |
| <a id="outboundpermissions"></a> `outboundPermissions?` | \{ `task`: `"0"` \| `"1"`; `email`: `"0"` \| `"1"`; `phone`: `"0"` \| `"1"`; `messaging`: `"0"` \| `"1"`; \} | Outbound permissions by communication type | [types/user.ts:175](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L175) |
| `outboundPermissions.task` | `"0"` \| `"1"` | - | [types/user.ts:176](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L176) |
| `outboundPermissions.email` | `"0"` \| `"1"` | - | [types/user.ts:177](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L177) |
| `outboundPermissions.phone` | `"0"` \| `"1"` | - | [types/user.ts:178](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L178) |
| `outboundPermissions.messaging` | `"0"` \| `"1"` | - | [types/user.ts:179](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L179) |
| <a id="rejectinteractions"></a> `rejectInteractions?` | `boolean` | Inbound permissions - can reject interactions | [types/user.ts:182](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L182) |
| <a id="monitoringaction"></a> `monitoringAction?` | `string` | Monitoring action configuration | [types/user.ts:184](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L184) |
| <a id="completedaction"></a> `completedAction?` | `string` | Completed action configuration | [types/user.ts:186](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L186) |
| <a id="interactionviewstype"></a> `interactionViewsType?` | `string` | Interaction view type | [types/user.ts:188](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L188) |
| <a id="modifyinteractionviews"></a> `modifyInteractionViews?` | `boolean` | Can create/edit interaction views | [types/user.ts:190](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L190) |
| <a id="tags-1"></a> `tags?` | [`UserTag`](#usertag)[] | List of assigned tags | [types/user.ts:194](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L194) |
| <a id="personalqueueid"></a> `personalQueueId?` | `string` | Personal queue ID | [types/user.ts:198](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L198) |
| <a id="defaultoutboundqueue"></a> `defaultOutboundQueue?` | `string` | Default outbound queue name | [types/user.ts:200](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L200) |
| <a id="outboundactionandstatus"></a> `outboundActionAndStatus?` | [`DefaultLeaveEventToStatus`](#defaultleaveeventtostatus) | Outbound call action and status | [types/user.ts:202](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L202) |
| <a id="inboundactionandstatus"></a> `inboundActionAndStatus?` | [`DefaultLeaveEventToStatus`](#defaultleaveeventtostatus) | Inbound call action and status | [types/user.ts:204](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L204) |
| <a id="callbackactionandstatus"></a> `callbackActionAndStatus?` | [`DefaultLeaveEventToStatus`](#defaultleaveeventtostatus) | Callback action and status | [types/user.ts:206](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L206) |
| <a id="voicemailactionandstatus"></a> `voicemailActionAndStatus?` | [`DefaultLeaveEventToStatus`](#defaultleaveeventtostatus) | Voicemail action and status | [types/user.ts:208](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L208) |
| <a id="queues-2"></a> `queues?` | [`QueueInfo`](#queueinfo)[] | List of assigned queues with access, auto-login, and proficiency info | [types/user.ts:210](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L210) |
| <a id="phonespaces"></a> `phoneSpaces?` | `number` | Number of concurrent phone interactions allowed | [types/user.ts:214](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L214) |
| <a id="messagingspaces"></a> `messagingSpaces?` | `number` | Number of concurrent messaging interactions allowed | [types/user.ts:216](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L216) |
| <a id="emailspaces"></a> `emailSpaces?` | `number` | Number of concurrent email interactions allowed | [types/user.ts:218](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L218) |
| <a id="taskspaces"></a> `taskSpaces?` | `number` | Number of concurrent task interactions allowed | [types/user.ts:220](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L220) |
| <a id="eliteextension"></a> `eliteExtension?` | `string` \| `null` | Elite Agent Extension | [types/user.ts:224](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L224) |
| <a id="eliteagentid"></a> `eliteAgentId?` | `string` \| `null` | Elite Agent ID | [types/user.ts:226](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L226) |
| <a id="elitesipaddress"></a> `eliteSipAddress?` | `string` \| `null` | SIP Address | [types/user.ts:228](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L228) |
| <a id="elitesbcgroupid"></a> `eliteSbcGroupId?` | `string` \| `null` | SBC Group ID | [types/user.ts:230](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L230) |
| <a id="crmconfigurations"></a> `crmConfigurations?` | `unknown` | CRM Configuration object | [types/user.ts:234](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L234) |
| <a id="infinityelements"></a> `infinityElements?` | [`InfinityElement`](#infinityelement)[] | App-level Infinity Elements assigned | [types/user.ts:236](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L236) |
| <a id="authtoken"></a> `authToken?` | `string` | Authentication token (JWT) using accessToken | [types/user.ts:240](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L240) |

***

## SendChatMessageType

```ts
type SendChatMessageType = "agent" | "private" | "agentAssist";
```

Defined in: [api/ElementAPI.ts:238](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L238)

Controls where and how a sendChatMessage() call is delivered.

| value | Who sees it | Where it appears | Transcript |
|---|---|---|---|
| "agent" | Agent + Customer | Main chat feed | Main transcript |
| "private" | Agent only | Main chat feed (distinct styling) | Main transcript |
| "agentAssist" | Agent only | Agent Assist panel UI | AI Assist panel only |

- "agent": Sends to the customer as the agent (default, existing behavior).
- "private": Appears in the agent's feed only; customer does NOT see it.
  Persisted in the main interaction transcript for QA and supervisor review.
- "agentAssist": Routes to the Agent Assist panel UI, NOT the main chat feed.
  Customer does NOT see it. Does NOT appear in the main interaction transcript;
  visible in the AI Assist panel only (persists for the session). Requires the
  Agent Assist panel to be enabled for the queue (fg_ai_assist gate + queue
  panels config); if not enabled the message is stored in V4 but not surfaced.

***

## RoutingFieldsPair

```ts
type RoutingFieldsPair = 
  | {
  routingPhone: string;
  routingPhoneName: string;
}
  | {
  routingPhone?: never;
  routingPhoneName?: never;
};
```

Defined in: [api/ElementAPI.ts:397](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L397)

***

## UpdateInteractionFields

```ts
type UpdateInteractionFields = UpdateInteractionFieldsBase & RoutingFieldsPair;
```

Defined in: [api/ElementAPI.ts:409](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPI.ts#L409)

Fields that can be updated on an active interaction.
At least one field must be provided.

`routingPhone` and `routingPhoneName` must always be provided together.
TypeScript callers get a compile-time error; JavaScript callers receive a
bridge runtime error.

***

## InteractionStatusChangedCallback()

```ts
type InteractionStatusChangedCallback = (payload: {
  interactionId: string;
  status: string;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:22](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L22)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | \{ `interactionId`: `string`; `status`: `string`; \} |
| `payload.interactionId` | `string` |
| `payload.status` | `string` |

### Returns

`void`

***

## InteractionEndedCallback()

```ts
type InteractionEndedCallback = (interactionId: string) => void;
```

Defined in: [api/ElementAPIEvents.ts:26](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L26)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `interactionId` | `string` |

### Returns

`void`

***

## InteractionAcceptedCallback()

```ts
type InteractionAcceptedCallback = (interactionId: string) => void;
```

Defined in: [api/ElementAPIEvents.ts:27](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L27)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `interactionId` | `string` |

### Returns

`void`

***

## InteractionUpdatedCallback()

```ts
type InteractionUpdatedCallback = (payload: {
  interactionId: string;
  event: "interaction.update";
  payload: Interaction;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:28](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L28)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | \{ `interactionId`: `string`; `event`: `"interaction.update"`; `payload`: [`Interaction`](#interaction); \} |
| `payload.interactionId` | `string` |
| `payload.event` | `"interaction.update"` |
| `payload.payload` | [`Interaction`](#interaction) |

### Returns

`void`

***

## ConsultStatusChangedCallback()

```ts
type ConsultStatusChangedCallback = (payload: {
  interactionId: string;
  consultStatus: string;
  consultParty?: string;
  error?: string;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:33](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L33)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | \{ `interactionId`: `string`; `consultStatus`: `string`; `consultParty?`: `string`; `error?`: `string`; \} |
| `payload.interactionId` | `string` |
| `payload.consultStatus` | `string` |
| `payload.consultParty?` | `string` |
| `payload.error?` | `string` |

### Returns

`void`

***

## CompleteAsConferenceCallback()

```ts
type CompleteAsConferenceCallback = (payload: {
  interactionId: string;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:39](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L39)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | \{ `interactionId`: `string`; \} |
| `payload.interactionId` | `string` |

### Returns

`void`

***

## InteractionDataReloadCallback()

```ts
type InteractionDataReloadCallback = (interactionId: string) => void;
```

Defined in: [api/ElementAPIEvents.ts:47](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L47)

Callback invoked after a successful updateInteraction() call, signalling the element
to refresh its local copy of the specified interaction's data.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `interactionId` | `string` | ID of the interaction whose data should be reloaded |

### Returns

`void`

***

## InteractionFocusChangedCallback()

```ts
type InteractionFocusChangedCallback = (interactionId: string | null) => void;
```

Defined in: [api/ElementAPIEvents.ts:54](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L54)

Callback fired when the agent's focused interaction changes.
Receives the interactionId of the newly focused interaction, or null when
the agent navigates away from all interactions (e.g. Home, Analytics).

### Parameters

| Parameter | Type |
| ------ | ------ |
| `interactionId` | `string` \| `null` |

### Returns

`void`

***

## FeedMessageCallback()

```ts
type FeedMessageCallback = (message: Message, interactionId?: string) => void;
```

Defined in: [api/ElementAPIEvents.ts:61](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L61)

Callback for feed message events.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`Message`](#message-2) | The message received |
| `interactionId?` | `string` | Optional interaction ID the message belongs to |

### Returns

`void`

***

## ErrorCallback()

```ts
type ErrorCallback = (error: {
  code: string;
  message: string;
  details?: unknown;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:65](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L65)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | \{ `code`: `string`; `message`: `string`; `details?`: `unknown`; \} |
| `error.code` | `string` |
| `error.message` | `string` |
| `error.details?` | `unknown` |

### Returns

`void`

***

## AgentStateSnapshot

```ts
type AgentStateSnapshot = {
  status: string;
  statusType: string;
};
```

Defined in: [api/ElementAPIEvents.ts:71](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L71)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="status-2"></a> `status` | `string` | [api/ElementAPIEvents.ts:72](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L72) |
| <a id="statustype"></a> `statusType` | `string` | [api/ElementAPIEvents.ts:73](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L73) |

***

## AgentQueueSnapshot

```ts
type AgentQueueSnapshot = {
  queueId: string;
  queueName: string;
  loggedIn: boolean;
};
```

Defined in: [api/ElementAPIEvents.ts:76](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L76)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="queueid-5"></a> `queueId` | `string` | [api/ElementAPIEvents.ts:77](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L77) |
| <a id="queuename"></a> `queueName` | `string` | [api/ElementAPIEvents.ts:78](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L78) |
| <a id="loggedin"></a> `loggedIn` | `boolean` | [api/ElementAPIEvents.ts:79](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L79) |

***

## GetAgentStateResponse

```ts
type GetAgentStateResponse = {
  agentState: string;
  isAID: boolean;
  agentId: string;
  reasonCode: string | null;
  queues: AgentQueueSnapshot[];
  currentState: AgentStateSnapshot;
  timestamp: string;
};
```

Defined in: [api/ElementAPIEvents.ts:86](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L86)

Result of [ElementAPI.getAgentState](#getagentstate): current cached agent desktop state
(no HTTP). Aligns with `agent-state-changed` broadcast fields used for initial snapshot.

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="agentstate"></a> `agentState` | `string` | [api/ElementAPIEvents.ts:87](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L87) |
| <a id="isaid"></a> `isAID` | `boolean` | [api/ElementAPIEvents.ts:88](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L88) |
| <a id="agentid"></a> `agentId` | `string` | [api/ElementAPIEvents.ts:89](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L89) |
| <a id="reasoncode-1"></a> `reasonCode` | `string` \| `null` | [api/ElementAPIEvents.ts:90](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L90) |
| <a id="queues"></a> `queues` | [`AgentQueueSnapshot`](#agentqueuesnapshot)[] | [api/ElementAPIEvents.ts:91](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L91) |
| <a id="currentstate"></a> `currentState` | [`AgentStateSnapshot`](#agentstatesnapshot) | [api/ElementAPIEvents.ts:92](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L92) |
| <a id="timestamp"></a> `timestamp` | `string` | [api/ElementAPIEvents.ts:93](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L93) |

***

## ~~AgentStateChangedCallback()~~

```ts
type AgentStateChangedCallback = (payload: {
  previousState: string;
  currentState: string;
  reason?: string;
}) => void;
```

Defined in: [api/ElementAPIEvents.ts:97](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L97)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | \{ `previousState`: `string`; `currentState`: `string`; `reason?`: `string`; \} |
| `payload.previousState` | `string` |
| `payload.currentState` | `string` |
| `payload.reason?` | `string` |

### Returns

`void`

### Deprecated

Use [AgentStateChangedPayload](#agentstatechangedpayload) via [ElementAPI.onAgentStateChange](#onagentstatechange) instead

***

## AgentStateChangedPayload

```ts
type AgentStateChangedPayload = {
  previousState: AgentStateSnapshot | null;
  currentState: AgentStateSnapshot;
  reason?: string;
  agentState: string;
  isAID?: boolean;
  queues?: AgentQueueSnapshot[];
  timestamp?: string;
  agentId?: string;
  reasonCode?: string | null;
};
```

Defined in: [api/ElementAPIEvents.ts:103](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L103)

### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="previousstate"></a> `previousState` | [`AgentStateSnapshot`](#agentstatesnapshot) \| `null` | [api/ElementAPIEvents.ts:104](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L104) |
| <a id="currentstate-1"></a> `currentState` | [`AgentStateSnapshot`](#agentstatesnapshot) | [api/ElementAPIEvents.ts:105](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L105) |
| <a id="reason-1"></a> `reason?` | `string` | [api/ElementAPIEvents.ts:106](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L106) |
| <a id="agentstate-1"></a> `agentState` | `string` | [api/ElementAPIEvents.ts:107](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L107) |
| <a id="isaid-1"></a> `isAID?` | `boolean` | [api/ElementAPIEvents.ts:108](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L108) |
| <a id="queues-1"></a> `queues?` | [`AgentQueueSnapshot`](#agentqueuesnapshot)[] | [api/ElementAPIEvents.ts:109](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L109) |
| <a id="timestamp-1"></a> `timestamp?` | `string` | [api/ElementAPIEvents.ts:110](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L110) |
| <a id="agentid-1"></a> `agentId?` | `string` | [api/ElementAPIEvents.ts:111](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L111) |
| <a id="reasoncode-2"></a> `reasonCode?` | `string` \| `null` | [api/ElementAPIEvents.ts:112](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L112) |

***

## AgentStateChangeCallback()

```ts
type AgentStateChangeCallback = (payload: AgentStateChangedPayload) => void;
```

Defined in: [api/ElementAPIEvents.ts:115](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L115)

### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | [`AgentStateChangedPayload`](#agentstatechangedpayload) |

### Returns

`void`

***

## InfinityElementConfig

```ts
type InfinityElementConfig = 
  | {
  hostingType: "local";
  file: {
     filename: string;
     mimetype: string;
     size: number;
     storageId: string;
     fileUrl?: string;
  };
}
  | {
  hostingType: "remote";
  remoteUrl: string;
  sameOriginEnabled: boolean;
};
```

Defined in: [types/user.ts:75](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L75)

### Type Declaration

```ts
{
  hostingType: "local";
  file: {
     filename: string;
     mimetype: string;
     size: number;
     storageId: string;
     fileUrl?: string;
  };
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `hostingType` | `"local"` | [types/user.ts:77](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L77) |
| `file` | \{ `filename`: `string`; `mimetype`: `string`; `size`: `number`; `storageId`: `string`; `fileUrl?`: `string`; \} | [types/user.ts:78](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L78) |
| `file.filename` | `string` | [types/user.ts:79](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L79) |
| `file.mimetype` | `string` | [types/user.ts:80](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L80) |
| `file.size` | `number` | [types/user.ts:81](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L81) |
| `file.storageId` | `string` | [types/user.ts:82](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L82) |
| `file.fileUrl?` | `string` | [types/user.ts:83](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L83) |

```ts
{
  hostingType: "remote";
  remoteUrl: string;
  sameOriginEnabled: boolean;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `hostingType` | `"remote"` | - | [types/user.ts:87](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L87) |
| `remoteUrl` | `string` | The external URL where this Infinity Element is hosted | [types/user.ts:89](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L89) |
| `sameOriginEnabled` | `boolean` | When true, allow-same-origin is added to the iframe sandbox, letting the remote widget access its own origin's cookies/storage | [types/user.ts:91](../node_modules/@avaya/infinity-elements-api/src/types/user.ts#L91) |

***

## CHANNEL\_NAMES

```ts
const CHANNEL_NAMES: {
  INTERACTION_STATUS_CHANGED: "interaction-status-changed";
  INTERACTION_ENDED: "on-interaction-ended";
  INTERACTION_ACCEPTED: "on-interaction-accepted";
  INTERACTION_UPDATED: "on-interaction-updated";
  CONSULT_STATUS_CHANGED: "consult-status-changed";
  COMPLETE_AS_CONFERENCE: "on-complete-as-conference";
  FEED_MESSAGE: "feed-message";
  AGENT_STATE_CHANGED: "agent-state-changed";
  INTER_ELEMENT: "inter-element";
  INTERACTION_DATA_RELOAD: "interaction-data-reload";
  INTERACTION_FOCUS_CHANGED: "on-interaction-focus-changed";
};
```

Defined in: [api/ElementAPIEvents.ts:5](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L5)

### Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="interaction_status_changed"></a> `INTERACTION_STATUS_CHANGED` | `"interaction-status-changed"` | `"interaction-status-changed"` | [api/ElementAPIEvents.ts:7](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L7) |
| <a id="interaction_ended"></a> `INTERACTION_ENDED` | `"on-interaction-ended"` | `"on-interaction-ended"` | [api/ElementAPIEvents.ts:8](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L8) |
| <a id="interaction_accepted"></a> `INTERACTION_ACCEPTED` | `"on-interaction-accepted"` | `"on-interaction-accepted"` | [api/ElementAPIEvents.ts:9](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L9) |
| <a id="interaction_updated"></a> `INTERACTION_UPDATED` | `"on-interaction-updated"` | `"on-interaction-updated"` | [api/ElementAPIEvents.ts:10](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L10) |
| <a id="consult_status_changed"></a> `CONSULT_STATUS_CHANGED` | `"consult-status-changed"` | `"consult-status-changed"` | [api/ElementAPIEvents.ts:11](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L11) |
| <a id="complete_as_conference"></a> `COMPLETE_AS_CONFERENCE` | `"on-complete-as-conference"` | `"on-complete-as-conference"` | [api/ElementAPIEvents.ts:12](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L12) |
| <a id="feed_message"></a> `FEED_MESSAGE` | `"feed-message"` | `"feed-message"` | [api/ElementAPIEvents.ts:13](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L13) |
| <a id="agent_state_changed"></a> `AGENT_STATE_CHANGED` | `"agent-state-changed"` | `"agent-state-changed"` | [api/ElementAPIEvents.ts:14](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L14) |
| <a id="inter_element"></a> `INTER_ELEMENT` | `"inter-element"` | `"inter-element"` | [api/ElementAPIEvents.ts:16](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L16) |
| <a id="interaction_data_reload"></a> `INTERACTION_DATA_RELOAD` | `"interaction-data-reload"` | `"interaction-data-reload"` | [api/ElementAPIEvents.ts:18](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L18) |
| <a id="interaction_focus_changed"></a> `INTERACTION_FOCUS_CHANGED` | `"on-interaction-focus-changed"` | `"on-interaction-focus-changed"` | [api/ElementAPIEvents.ts:19](../node_modules/@avaya/infinity-elements-api/src/api/ElementAPIEvents.ts#L19) |

***

## VERSION

```ts
const VERSION: "1.3.0" = "1.3.0";
```

Defined in: [index.ts:114](../node_modules/@avaya/infinity-elements-api/src/index.ts#L114)

***

## setupOAuthCallbackHandler()

```ts
function setupOAuthCallbackHandler(): void;
```

Defined in: [auth/KeycloakAuth.ts:74](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L74)

Setup OAuth callback handler - call once at app initialization

Sets up listener for redirect.html config requests

### Returns

`void`

***

## refreshAccessToken()

```ts
function refreshAccessToken(
   refreshToken: string, 
   tokenEndpoint: string, 
clientId: string): Promise<TokenResponse>;
```

Defined in: [auth/KeycloakAuth.ts:229](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L229)

Refresh an expired access token using the refresh token

Elements run in sandboxed iframes (about:srcdoc) which have origin "null".
Direct fetch to Keycloak fails due to CORS.

This function delegates the refresh request to the host (agent-ui) via
postMessage. The host has a proper origin and can make the request
without CORS issues. This is completely silent - no popups or visible UI.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refreshToken` | `string` | The refresh token to use |
| `tokenEndpoint` | `string` | The token endpoint URL |
| `clientId` | `string` | The OAuth client ID |

### Returns

`Promise`\<[`TokenResponse`](#tokenresponse)\>

***

## getStoredTokenData()

```ts
function getStoredTokenData(jwtStorageKey: string): StoredTokenData | null;
```

Defined in: [auth/KeycloakAuth.ts:359](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L359)

Get stored token data from localStorage

### Parameters

| Parameter | Type |
| ------ | ------ |
| `jwtStorageKey` | `string` |

### Returns

[`StoredTokenData`](#storedtokendata) \| `null`

***

## isTokenExpired()

```ts
function isTokenExpired(tokenData: StoredTokenData): boolean;
```

Defined in: [auth/KeycloakAuth.ts:386](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L386)

Check if a token is expired

### Parameters

| Parameter | Type |
| ------ | ------ |
| `tokenData` | [`StoredTokenData`](#storedtokendata) |

### Returns

`boolean`

***

## isRefreshTokenExpired()

```ts
function isRefreshTokenExpired(tokenData: StoredTokenData): boolean;
```

Defined in: [auth/KeycloakAuth.ts:401](../node_modules/@avaya/infinity-elements-api/src/auth/KeycloakAuth.ts#L401)

Check if refresh token is expired

### Parameters

| Parameter | Type |
| ------ | ------ |
| `tokenData` | [`StoredTokenData`](#storedtokendata) |

### Returns

`boolean`
