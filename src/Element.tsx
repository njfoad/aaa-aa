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
interface ElementProps {}

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
  persistentCallReason: string;
}

interface DebugLog {
  id: string;
  timestamp: string;
  type: "API_REQ" | "API_RES" | "EVENT" | "STATE";
  title: string;
  durationMs?: number;
  data?: any;
}

const EMPTY_ASSIST: AssistState = {
  callContext: { policyOwner: "", policyState: "", reasonForCall: "" },
  procedure: { selected: false, name: "", completed: false },
  agentAction: "",
  steps: [],
  persistentCallReason: "",
};

// ==================================================
// HELPERS
// ==================================================
function getMessageText(msg: any): string {
  if (!msg) return "";
  if (typeof msg.message === "string") return msg.message.trim();
  if (typeof msg.text === "string") return msg.text.trim();
  if (Array.isArray(msg.message)) {
    return msg.message.map((part: any) => (part?.type === "text" && part?.text ? part.text : "")).filter(Boolean).join(" ").trim();
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

function tryParseJson(value: string): any {
  let text = value.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function normalizeAnswer(payload: any) {
  let answer = payload?.answer;
  if (typeof answer === "string" && answer.trim().toUpperCase() === "NO_ACTION") return { noAction: true };
  if (typeof answer === "string") {
    const parsed = tryParseJson(answer);
    if (parsed) answer = parsed;
  }
  if (answer && typeof answer === "object" && typeof answer.agentAction === "string") {
    const rawAction = answer.agentAction.trim();
    if (rawAction.toUpperCase() === "NO_ACTION") return { noAction: true };
    const nested = tryParseJson(rawAction);
    if (nested && typeof nested === "object" && !Array.isArray(nested)) answer = nested;
  }
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) answer = {};

  const procedureObject = answer.procedure && typeof answer.procedure === "object" ? answer.procedure : {};
  const effectiveAgentAction = typeof answer.agentAction === "string" ? answer.agentAction : typeof procedureObject.agentAction === "string" ? procedureObject.agentAction : "";
  const effectiveSteps = Array.isArray(answer.steps) ? answer.steps : Array.isArray(procedureObject.steps) ? procedureObject.steps : [];

  const hasProcedure = !!(answer.procedureName || (answer.procedure && typeof answer.procedure === "object"));
  const procName = answer.procedureName || procedureObject.name || "";
  const procCompleted = answer.procedureCompleted === true || procedureObject.completed === true;

  return {
    noAction: false,
    hasCallContext: answer.callContext && typeof answer.callContext === "object",
    hasProcedure: hasProcedure,
    hasAgentAction: Object.prototype.hasOwnProperty.call(answer, "agentAction") || Object.prototype.hasOwnProperty.call(procedureObject, "agentAction"),
    hasSteps: Array.isArray(answer.steps) || Array.isArray(procedureObject.steps),
    hasCompleted: Object.prototype.hasOwnProperty.call(answer, "procedureCompleted") || Object.prototype.hasOwnProperty.call(procedureObject, "completed"),
    callContext: {
      policyOwner: typeof answer?.callContext?.policyOwner === "string" ? answer.callContext.policyOwner : "",
      policyState: typeof answer?.callContext?.policyState === "string" ? answer.callContext.policyState : "",
      reasonForCall: typeof answer?.callContext?.reasonForCall === "string" ? answer.callContext.reasonForCall : "",
    },
    procedure: { selected: !!procName, name: typeof procName === "string" ? procName : "", completed: procCompleted },
    agentAction: effectiveAgentAction,
    steps: effectiveSteps,
  };
}

// ==================================================
// MAIN COMPONENT
// ==================================================
const Element: React.FC<ElementProps> = () => {
  const [interactionId, setInteractionId] = useState<string>("");
  const [assist, setAssist] = useState<AssistState>(EMPTY_ASSIST);
  const [status, setStatus] = useState<string>("Waiting for interaction");
  
  // Debug State
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const interactionIdRef = useRef<string>("");
  const requestQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastMessageKeyRef = useRef<string>("");
  const [showRawLogs, setShowRawLogs] = useState<boolean>(false);

  function addLog(type: DebugLog["type"], title: string, data?: any, durationMs?: number) {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), timestamp, type, title, data, durationMs }])
  }

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  function setCurrentInteraction(id: string) {
    const nextId = id || "";
    interactionIdRef.current = nextId;
    setInteractionId(nextId);
  }

  function updateAssist(answer: any) {
    setAssist((previous) => {
      const nextCallContext = answer.hasCallContext ? { ...previous.callContext, ...answer.callContext } : previous.callContext;
      let nextProcedure = previous.procedure;
      
      if (answer.hasProcedure) {
        if (answer.procedure.selected === false) nextProcedure = { selected: false, name: "", completed: false };
        else nextProcedure = { selected: true, name: answer.procedure.name || previous.procedure.name, completed: answer.hasCompleted ? answer.procedure.completed : previous.procedure.completed };
      }

      let nextSteps = [...previous.steps];
      if (answer.hasSteps) {
        // 1. Get a list of all IDs the backend is currently sending
        const incomingIds = new Set(answer.steps.map((s: Step) => s.id));

        // 2. Force any existing step NOT in the new payload to "complete"
        nextSteps = nextSteps.map((step) => {
          if (!incomingIds.has(step.id) && step.status !== "complete") {
            return { ...step, status: "complete" };
          }
          return step;
        });

        // 3. Merge or append the incoming steps
        answer.steps.forEach((incomingStep: Step) => {
          if (!incomingStep.id) return;
          const existingIndex = nextSteps.findIndex((s) => s.id === incomingStep.id);
          if (existingIndex >= 0) {
            nextSteps[existingIndex] = { ...nextSteps[existingIndex], ...incomingStep };
          } else {
            nextSteps.push(incomingStep);
          }
        });
      }
      const reasonStep = nextSteps.find((s: Step) => s.id === "reason_for_call");
      const newReasonValue = reasonStep?.value?.trim();
      const nextCallReason = newReasonValue ? newReasonValue : previous.persistentCallReason;

      let nextAction = previous.agentAction;
      if (nextProcedure.completed) nextAction = "";
      else if (answer.hasAgentAction) nextAction = answer.agentAction.trim() ? answer.agentAction : previous.agentAction;

      const newState = { callContext: nextCallContext, procedure: nextProcedure, agentAction: nextAction, steps: nextSteps, persistentCallReason: nextCallReason };
//      addLog("STATE", "Assist State Updated", newState);
      return newState;
    });
  }

  async function sendToAI({ text, speaker, sessionId }: { text: string; speaker: string; sessionId: string }) {
    setStatus("Analyzing...");
    const reqBody = { message: text, speaker, sessionId };
    addLog("API_REQ", "Sent to AI Gateway", reqBody);
    
    const startTime = performance.now();
    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": GATEWAY_API_KEY, "x-rollins-api-key": DEMO_API_KEY },
        body: JSON.stringify(reqBody),
      });

      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      if (!response.ok) {
        addLog("API_RES", `HTTP Error ${response.status}`, { statusText: response.statusText }, durationMs);
        throw new Error(`AI request failed: ${response.status}`);
      }

      const payload = await response.json();
      addLog("API_RES", "Received AI Payload", payload, durationMs);
      
      const answer = normalizeAnswer(payload);

      if (answer.noAction || (!answer.hasCallContext && !answer.hasProcedure && !answer.hasAgentAction && !answer.hasSteps)) {
        setStatus("Listening");
        return;
      }

      updateAssist(answer);
      setStatus(answer.procedure?.completed ? "Procedure complete" : "Guidance updated");
    } catch (err: any) {
      const endTime = performance.now();
      addLog("API_RES", "Fetch Exception", { error: err.message }, Math.round(endTime - startTime));
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

    async function initialize() {
      api.getInteraction().then((res: any) => {
        const id = res?.interaction?.id || res?.interaction?.interactionId || res?.id || "";
        if (id) {
          setCurrentInteraction(id);
          setStatus("Listening");
          addLog("EVENT", "Existing Interaction Found", { id });
        }
      }).catch(() => {});

      unsubscribeFeed = api.onReceivedFeedMessage((msg) => {
        const text = getMessageText(msg);
        const isAnswerTrigger = msg.isPrivate && text.includes("answered interaction");
        if ((msg.isPrivate && !isAnswerTrigger) || msg.isBot) {
          return;
        }
        const speaker = getSpeaker(msg);
        if (!text || (speaker !== "caller" && speaker !== "agent")) return;

        const msgId = getInteractionIdFromMessage(msg);
        const activeId = interactionIdRef.current;
        if (activeId && msgId && msgId !== activeId) return;

        const sessionId = activeId || msgId;
        if (!sessionId) return;
        if (!activeId && msgId) setCurrentInteraction(msgId);

        const messageKey = `${sessionId}|${speaker}|${text}`;
        if (messageKey === lastMessageKeyRef.current) return;
        lastMessageKeyRef.current = messageKey;

        queueAIRequest({ text, speaker, sessionId });
      });

      unsubscribeAccepted = api.onInteractionAccepted((event: any) => {
        const id = event?.interactionId || event?.interaction?.id || event?.interaction?.interactionId || "";
        setCurrentInteraction(id);
        setAssist(EMPTY_ASSIST);
        lastMessageKeyRef.current = "";
        requestQueueRef.current = Promise.resolve();
        setStatus("Listening");
        addLog("EVENT", "Interaction Accepted", { id });
      });

      unsubscribeEnded = api.onInteractionEnded((event: any) => {
        setCurrentInteraction("");
        setAssist(EMPTY_ASSIST);
        lastMessageKeyRef.current = "";
        requestQueueRef.current = Promise.resolve();
        setStatus("Waiting for interaction");
        addLog("EVENT", "Interaction Ended", { event });
      });
    }

    initialize();
    return () => {
      if (unsubscribeFeed) unsubscribeFeed();
      if (unsubscribeAccepted) unsubscribeAccepted();
      if (unsubscribeEnded) unsubscribeEnded();
      api.destroy();
    };
  }, []);

  const completedCount = assist.steps.filter((s) => s?.status === "complete").length;
  const totalSteps = assist.steps.length;
  const procedureName = assist.procedure.selected ? assist.procedure.name || "Selected procedure" : "Identifying procedure...";

  const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular Reference]';
        cache.add(value);
      }
      return value;
    }, 2);
  };

  return (
    <div className={styles.container}>
      
      {/* Top Branding Banner */}
      <header className={styles.banner}>
        <div className={styles.bannerLeft}>
          <img src={aaaLogo} alt="AAA Northeast" className={styles.bannerLogo} />
          <h1 className={styles.bannerTitle}>AI Agent Assist</h1>
        </div>
        <button 
          className={isDebugMode ? styles.debugBtnActive : styles.debugBtn} 
          onClick={() => setIsDebugMode(!isDebugMode)}
        >
          {isDebugMode ? "Close Debug" : "Debug"}
        </button>
      </header>

      {isDebugMode ? (
        <section className={styles.debugPanel}>
          <div className={styles.debugPanelHeader}>
            <h3>Diagnostics & Logs</h3>
            <button onClick={() => setShowRawLogs(!showRawLogs)} className={styles.copyBtn}>
              {showRawLogs ? "View UI Logs" : "View Raw JSON"}
            </button>
          </div>
          
          {showRawLogs ? (
            <textarea 
              className={styles.rawTextArea} 
              readOnly 
              value={safeStringify(logs)} 
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          ) : (
            <div className={styles.logContainer}>
              {logs.length === 0 ? <div className={styles.emptyText}>No logs yet...</div> : null}
              {logs.map(log => (
                <div key={log.id} className={styles.logEntry}>
                  <div className={styles.logHeader}>
                    <span className={styles.logTime}>{log.timestamp}</span>
                    <span className={`${styles.logBadge} ${styles[`badge_${log.type}`]}`}>{log.type}</span>
                    <span className={styles.logTitle}>{log.title}</span>
                    {log.durationMs && <span className={styles.logDuration}>{log.durationMs}ms</span>}
                  </div>
                  {log.data && (
                    <pre className={styles.logData}>{JSON.stringify(log.data, null, 2)}</pre>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </section>
      ) : (
        <>
          <section className={styles.callReasonCard}>
            <div className={styles.label}>CALL REASON</div>
            <h2 className={styles.reasonText}>
              {assist.persistentCallReason || "Listening for reason..."}
            </h2>
          </section>
          {/* Hero Next Best Action */}
          <section className={styles.actionHeroCard}>
            <div className={styles.label}>NEXT BEST ACTION</div>
            <h2 className={styles.actionText}>
              {assist.procedure.completed 
                ? "All required procedure steps are complete."
                : (!assist.persistentCallReason 
                    ? "Determine call reason." // <-- Overrides backend if reason is missing
                    : (assist.agentAction || "Listening for customer context..."))}
            </h2>
          </section>

          {/* Procedure Tracker & Checklist */}
          <section className={styles.stepperContainer}>
            <div className={styles.procedureHeader}>
              <div className={styles.label}>ACTIVE PROCEDURE</div>
              <h3 className={styles.procedureTitle}>{procedureName}</h3>
              {totalSteps > 0 && <div className={styles.progressBar}>Step {completedCount} of {totalSteps}</div>}
            </div>

            <div className={styles.stepList}>
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
            </div>
          </section>
        </>
      )}

      {/* System Footer */}
      <footer className={styles.systemFooter}>
        <span>Status: {status}</span> | 
        <span>ID: {interactionId ? interactionId.slice(-8) : "None"}</span>
      </footer>

    </div>
  );
};

export default Element;