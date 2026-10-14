import React, { useEffect, useRef, useState } from "react";
import { ElementAPI } from "@avaya/infinity-elements-api";
import styles from "./Element.module.css";
import aaaLogo from "./assets/aaa-northeast.png";

// ==================================================
// CONFIGURATION
// ==================================================
const api = new ElementAPI({
  elementId: "aaa-aa",
  debug: true,
});

const AI_URL = "https://rollins-agent-assist-gateway-bvxy723t.uc.gateway.dev/agent-assist";
const GATEWAY_API_KEY = import.meta.env.VITE_GATEWAY_API_KEY;
const DEMO_API_KEY = import.meta.env.VITE_DEMO_API_KEY;

// ==================================================
// TYPES & INTERFACES
// ==================================================
interface ElementProps {
  message?: string;
}

interface CallContext {
  policyOwner: string;
  policyState: string;
  reasonForCall: string;
}

interface Procedure {
  selected: boolean;
  name: string;
  completed: boolean;
}

interface Step {
  id: string;
  label: string;
  type?: string;
  status: "pending" | "current" | "complete";
  value?: string;
}

interface AssistState {
  callContext: CallContext;
  procedure: Procedure;
  agentAction: string;
  steps: Step[];
}

const EMPTY_ASSIST: AssistState = {
  callContext: { policyOwner: "", policyState: "", reasonForCall: "" },
  procedure: { selected: false, name: "", completed: false },
  agentAction: "",
  steps: [],
};

// ==================================================
// HELPERS (Types added)
// ==================================================
function getMessageText(msg: any): string {
  if (!msg) return "";
  if (typeof msg.message === "string") return msg.message.trim();
  if (typeof msg.text === "string") return msg.text.trim();
  if (Array.isArray(msg.message)) {
    return msg.message
      .map((part: any) => {
        if (part?.type === "text" && part?.text) return part.text;
        if (part?.type === "email" && part?.plainText) return part.plainText;
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  return "";
}

function getSpeaker(msg: any): "bot" | "caller" | "agent" | "unknown" {
  if (msg?.isBot) return "bot";
  if (msg?.direction === "in") return "caller";
  if (msg?.direction === "out") return "agent";
  return "unknown";
}

function getInteractionIdFromMessage(msg: any): string {
  return msg?.interactionId || msg?.interaction?.id || msg?.interaction?.interactionId || "";
}

function stripCodeFences(value: string): string {
  let text = value.trim();
  if (text.startsWith("```") && text.endsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return text;
}

function tryParseJson(value: string): any {
  const text = stripCodeFences(value);
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn("[AAA Agent Assist] JSON parse failed:", err);
    return null;
  }
}

function normalizeAnswer(payload: any) {
  let answer = payload?.answer;

  if (typeof answer === "string" && answer.trim().toUpperCase() === "NO_ACTION") {
    return { noAction: true };
  }
  if (typeof answer === "string") {
    const parsed = tryParseJson(answer);
    if (parsed) answer = parsed;
  }

  if (answer && typeof answer === "object" && typeof answer.agentAction === "string") {
    const rawAction = answer.agentAction.trim();
    if (rawAction.toUpperCase() === "NO_ACTION") return { noAction: true };
    const nested = tryParseJson(rawAction);
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      answer = nested;
    }
  }

  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    answer = {};
  }

  const procedureObject = answer.procedure && typeof answer.procedure === "object" ? answer.procedure : {};
  const effectiveAgentAction = typeof answer.agentAction === "string" ? answer.agentAction : typeof procedureObject.agentAction === "string" ? procedureObject.agentAction : "";
  const effectiveSteps = Array.isArray(answer.steps) ? answer.steps : Array.isArray(procedureObject.steps) ? procedureObject.steps : [];

  return {
    noAction: false,
    hasCallContext: answer.callContext && typeof answer.callContext === "object",
    hasProcedure: answer.procedure && typeof answer.procedure === "object",
    hasAgentAction: Object.prototype.hasOwnProperty.call(answer, "agentAction") || Object.prototype.hasOwnProperty.call(procedureObject, "agentAction"),
    hasSteps: Array.isArray(answer.steps) || Array.isArray(procedureObject.steps),
    hasCompleted: Object.prototype.hasOwnProperty.call(procedureObject, "completed"),
    callContext: {
      policyOwner: typeof answer?.callContext?.policyOwner === "string" ? answer.callContext.policyOwner : "",
      policyState: typeof answer?.callContext?.policyState === "string" ? answer.callContext.policyState : "",
      reasonForCall: typeof answer?.callContext?.reasonForCall === "string" ? answer.callContext.reasonForCall : "",
    },
    procedure: {
      selected: procedureObject.selected === true,
      name: typeof procedureObject.name === "string" ? procedureObject.name : "",
      completed: procedureObject.completed === true,
    },
    agentAction: effectiveAgentAction,
    steps: effectiveSteps,
  };
}

// ==================================================
// MAIN COMPONENT
// ==================================================
const Element: React.FC<ElementProps> = ({ message }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string>("");
  const [assist, setAssist] = useState<AssistState>(EMPTY_ASSIST);
  const [status, setStatus] = useState<string>("Waiting for interaction");
  
  // Chat feed state for the new two-column layout
  const [chatLog, setChatLog] = useState<{speaker: string, text: string}[]>([]);

  const interactionIdRef = useRef<string>("");
  const requestQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastMessageKeyRef = useRef<string>("");

  function setCurrentInteraction(id: string) {
    const nextId = id || "";
    interactionIdRef.current = nextId;
    setInteractionId(nextId);
  }

  function updateAssist(answer: any) {
    setAssist((previous) => {
      const nextCallContext = answer.hasCallContext
        ? {
            policyOwner: answer.callContext.policyOwner || previous.callContext.policyOwner,
            policyState: answer.callContext.policyState || previous.callContext.policyState,
            reasonForCall: answer.callContext.reasonForCall || previous.callContext.reasonForCall,
          }
        : previous.callContext;

      let nextProcedure = previous.procedure;
      if (answer.hasProcedure) {
        if (answer.procedure.selected === false) {
          nextProcedure = { selected: false, name: "", completed: false };
        } else {
          nextProcedure = {
            selected: true,
            name: answer.procedure.name || previous.procedure.name,
            completed: answer.hasCompleted ? answer.procedure.completed : previous.procedure.completed,
          };
        }
      }

      let nextAction = previous.agentAction;
      if (nextProcedure.completed) {
        nextAction = "";
      } else if (answer.hasAgentAction) {
        nextAction = answer.agentAction.trim() ? answer.agentAction : previous.agentAction;
      }

      const nextSteps = answer.hasSteps ? answer.steps : previous.steps;

      return {
        callContext: nextCallContext,
        procedure: nextProcedure,
        agentAction: nextAction,
        steps: nextSteps,
      };
    });
  }

  async function sendToAI({ text, speaker, sessionId }: { text: string; speaker: string; sessionId: string }) {
    setStatus("Analyzing...");
    
    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": GATEWAY_API_KEY,
          "x-rollins-api-key": DEMO_API_KEY,
        },
        body: JSON.stringify({ message: text, speaker, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const payload = await response.json();
      const answer = normalizeAnswer(payload);

      if (answer.noAction) {
        setStatus("Listening");
        return;
      }

      if (!answer.hasCallContext && !answer.hasProcedure && !answer.hasAgentAction && !answer.hasSteps) {
        setStatus("Listening");
        return;
      }

      updateAssist(answer);
      setStatus(answer.procedure?.completed ? "Procedure complete" : "Guidance updated");
    } catch (err) {
      console.error("[AAA Agent Assist] AI error:", err);
      setStatus("AI request failed");
    }
  }

  function queueAIRequest(args: { text: string; speaker: string; sessionId: string }) {
    requestQueueRef.current = requestQueueRef.current.then(() => sendToAI(args)).catch(() => {});
  }

  useEffect(() => {
    let unsubscribeFeed: () => void;
    let unsubscribeAccepted: () => void;
    let unsubscribeEnded: () => void;
    let unsubscribeError: () => void;

    // Fetch user info from original template
    api.getUserInfo()
      .then((userInfo) => setUserId(userInfo.userId))
      .catch((error) => console.info("May not be in iframe", error));

    async function initialize() {
      try {
        const response: any = await api.getInteraction();
        const interaction = response?.interaction || response;
        const id = interaction?.id || interaction?.interactionId || "";
        if (id) {
          setCurrentInteraction(id);
          setStatus("Listening");
        }
      } catch (err) {
        console.log("[AAA Agent Assist] No active interaction on load");
      }

      unsubscribeFeed = api.onReceivedFeedMessage((msg) => {
        const text = getMessageText(msg);
        if (!text) return;

        const speaker = getSpeaker(msg);
        if (speaker !== "caller" && speaker !== "agent") return;

        const msgInteractionId = getInteractionIdFromMessage(msg);
        const activeId = interactionIdRef.current;
        if (activeId && msgInteractionId && msgInteractionId !== activeId) return;

        const sessionId = activeId || msgInteractionId;
        if (!sessionId) return;

        if (!activeId && msgInteractionId) setCurrentInteraction(msgInteractionId);

        const messageKey = `${sessionId}|${speaker}|${text}`;
        if (messageKey === lastMessageKeyRef.current) return;
        lastMessageKeyRef.current = messageKey;

        // Add to chat log for the UI
        setChatLog((prev) => [...prev, { speaker, text }]);

        queueAIRequest({ text, speaker, sessionId });
      });

      unsubscribeAccepted = api.onInteractionAccepted((event: any) => {
        const id = event?.interactionId || event?.interaction?.id || event?.interaction?.interactionId || "";
        setCurrentInteraction(id);
        setAssist(EMPTY_ASSIST);
        setChatLog([]);
        lastMessageKeyRef.current = "";
        requestQueueRef.current = Promise.resolve();
        setStatus("Listening");
      });

      unsubscribeEnded = api.onInteractionEnded(() => {
        setCurrentInteraction("");
        setAssist(EMPTY_ASSIST);
        setChatLog([]);
        lastMessageKeyRef.current = "";
        requestQueueRef.current = Promise.resolve();
        setStatus("Waiting for interaction");
      });

      unsubscribeError = api.onError((err) => console.error("ElementAPI error:", err));
    }

    initialize();

    return () => {
      if (unsubscribeFeed) unsubscribeFeed();
      if (unsubscribeAccepted) unsubscribeAccepted();
      if (unsubscribeEnded) unsubscribeEnded();
      if (unsubscribeError) unsubscribeError();
      api.destroy();
    };
  }, []);

  const completedCount = assist.steps.filter((s) => s?.status === "complete").length;
  const totalSteps = assist.steps.length;
  const procedureName = assist.procedure.selected ? assist.procedure.name || "Selected procedure" : "Identifying procedure...";

  return (
    <div className={styles.container}>
      {/* 
        This is a Two-Column "Cockpit" Layout. 
        Update your Element.module.css with grid layout properties:
        .container { display: flex; gap: 2rem; height: 100vh; padding: 1rem; }
        .leftColumn { flex: 0 0 60%; display: flex; flex-direction: column; }
        .rightColumn { flex: 0 0 40%; display: flex; flex-direction: column; }
      */}

      {/* LEFT COLUMN: The "Right Now" */}
      <div className={styles.leftColumn}>
        <img src={aaaLogo} alt="AAA Northeast" style={{ height: "40px", marginBottom: "1rem" }} />
        
        {/* Hero Next Best Action */}
        <section className={styles.actionHeroCard}>
          <div className={styles.label}>NEXT BEST ACTION</div>
          <h1 className={styles.actionText}>
            {assist.procedure.completed 
              ? "All required procedure steps are complete."
              : (assist.agentAction || "Listening for customer context...")}
          </h1>
        </section>

        {/* Live Transcript Chat Log */}
        <section className={styles.chatWindow}>
          <div className={styles.label}>LIVE TRANSCRIPT</div>
          <div className={styles.chatFeed}>
            {chatLog.length === 0 ? (
              <div className={styles.emptyText}>Waiting for conversation to begin...</div>
            ) : (
              chatLog.map((log, i) => (
                <div key={i} className={log.speaker === "caller" ? styles.chatCaller : styles.chatAgent}>
                  <strong>{log.speaker === "caller" ? "Caller" : "You"}: </strong> {log.text}
                </div>
              ))
            )}
          </div>
        </section>

        {/* System Footer */}
        <footer className={styles.systemFooter}>
          <span>{userId ? `Agent: ${userId}` : "Loading user info..."}</span> | 
          <span>Status: {status}</span> | 
          <span>Interaction ID: {interactionId ? interactionId.slice(-8) : "None"}</span>
        </footer>
      </div>

      {/* RIGHT COLUMN: The "Journey" */}
      <div className={styles.rightColumn}>
        
        {/* Procedure Tracker Header */}
        <header className={styles.procedureHeader}>
          <div className={styles.label}>ACTIVE PROCEDURE</div>
          <h2>{procedureName}</h2>
          {totalSteps > 0 && <div className={styles.progressBar}>Step {completedCount} of {totalSteps}</div>}
        </header>

        {/* Visual Stepper / Checklist */}
        <section className={styles.stepperContainer}>
          {assist.steps.length > 0 ? (
            assist.steps.map((step, index) => (
              <div key={step.id || index} className={`${styles.stepItem} ${styles[`step_${step.status}`]}`}>
                <div className={styles.stepIndicator}>
                  {step.status === "complete" ? "✓" : step.status === "current" ? "→" : "○"}
                </div>
                <div className={styles.stepDetails}>
                  <div className={styles.stepLabel}>{step.label}</div>
                  {step.value && <div className={styles.stepValue}>{step.value}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyText}>Procedure steps will populate here automatically.</div>
          )}
        </section>
      </div>

    </div>
  );
};

export default Element;