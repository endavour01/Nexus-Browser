/**
 * NEXUS AI Browser Assistant — Action Schema & Validation
 * Strict JSON schema validation for model actions with descriptive error messages.
 */

import { AgentAction, AgentActionType } from '../../shared/types';

export const VALID_ACTION_TYPES: AgentActionType[] = [
  'navigate',
  'click',
  'type',
  'press_key',
  'scroll',
  'wait',
  'ask_user',
  'finish',
];

export interface ValidationResult {
  valid: boolean;
  action?: AgentAction;
  error?: string;
}

export function parseAndValidateAction(rawOutput: string): ValidationResult {
  if (!rawOutput || typeof rawOutput !== 'string' || !rawOutput.trim()) {
    return { valid: false, error: 'Model output is empty or not a string.' };
  }

  // Attempt to isolate JSON block if model included markdown fences
  let jsonStr = rawOutput.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: any) {
    return {
      valid: false,
      error: `Invalid JSON syntax: ${err.message}. Output was: "${jsonStr.slice(0, 120)}..."`,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'Model output must be a JSON object.' };
  }

  const actionType = parsed.action;
  if (!actionType || typeof actionType !== 'string') {
    return {
      valid: false,
      error: `Missing "action" field. Allowed actions are: ${VALID_ACTION_TYPES.join(', ')}.`,
    };
  }

  const normalizedAction = actionType.trim().toLowerCase() as AgentActionType;
  if (!VALID_ACTION_TYPES.includes(normalizedAction)) {
    return {
      valid: false,
      error: `Unknown action "${actionType}". Allowed actions are: ${VALID_ACTION_TYPES.join(', ')}.`,
    };
  }

  const action: AgentAction = {
    action: normalizedAction,
    thought: typeof parsed.thought === 'string' ? parsed.thought.trim() : undefined,
  };

  switch (normalizedAction) {
    case 'navigate': {
      if (!parsed.url || typeof parsed.url !== 'string' || !parsed.url.trim()) {
        return { valid: false, error: 'The "navigate" action requires a valid, non-empty "url" string.' };
      }
      action.url = parsed.url.trim();
      break;
    }

    case 'click': {
      const elId = Number(parsed.elementId);
      if (isNaN(elId) || elId < 1 || !Number.isInteger(elId)) {
        return { valid: false, error: 'The "click" action requires a valid integer "elementId" (e.g., 1, 2, 3).' };
      }
      action.elementId = elId;
      break;
    }

    case 'type': {
      const elId = Number(parsed.elementId);
      if (isNaN(elId) || elId < 1 || !Number.isInteger(elId)) {
        return { valid: false, error: 'The "type" action requires a valid integer "elementId".' };
      }
      if (typeof parsed.text !== 'string') {
        return { valid: false, error: 'The "type" action requires a "text" string to type.' };
      }
      action.elementId = elId;
      action.text = parsed.text;
      break;
    }

    case 'press_key': {
      if (!parsed.key || typeof parsed.key !== 'string' || !parsed.key.trim()) {
        return { valid: false, error: 'The "press_key" action requires a valid "key" string (e.g. "Enter", "Tab", "Escape").' };
      }
      action.key = parsed.key.trim();
      break;
    }

    case 'scroll': {
      const dir = typeof parsed.direction === 'string' ? parsed.direction.trim().toLowerCase() : 'down';
      if (dir !== 'up' && dir !== 'down') {
        return { valid: false, error: 'The "scroll" action "direction" must be "up" or "down".' };
      }
      action.direction = dir;
      action.amount = typeof parsed.amount === 'number' && parsed.amount > 0 ? parsed.amount : 300;
      break;
    }

    case 'wait': {
      const dur = Number(parsed.durationMs);
      action.durationMs = !isNaN(dur) && dur > 0 ? Math.min(dur, 10000) : 1000;
      break;
    }

    case 'ask_user': {
      if (!parsed.question || typeof parsed.question !== 'string' || !parsed.question.trim()) {
        return { valid: false, error: 'The "ask_user" action requires a non-empty "question" string.' };
      }
      action.question = parsed.question.trim();
      break;
    }

    case 'finish': {
      action.result = typeof parsed.result === 'string' ? parsed.result.trim() : 'Task completed successfully.';
      break;
    }
  }

  return { valid: true, action };
}

export const AGENT_SYSTEM_PROMPT = `You are the NEXUS Browser AI Assistant. You execute user tasks inside a real browser tab step-by-step.
At each step, you receive:
1. The user's task
2. The current page URL and title
3. A simplified list of visible, interactive elements on the page with integer IDs, types, labels, and placeholders
4. Available credential placeholders (e.g. {{cred:sitename.password}})

You MUST respond with a single, valid JSON object matching this schema:
{
  "thought": "Short explanation of your reasoning (1 sentence)",
  "action": "navigate" | "click" | "type" | "press_key" | "scroll" | "wait" | "ask_user" | "finish",
  "url": "https://... (required if action is navigate)",
  "elementId": 1 (integer, required if action is click or type),
  "text": "text or {{cred:sitename.password}} (required if action is type)",
  "key": "Enter" | "Tab" | "Escape" (required if action is press_key),
  "direction": "up" | "down" (optional if action is scroll),
  "question": "question to ask user (required if action is ask_user)",
  "result": "summary of completed work (required if action is finish)"
}

RULES:
- Emit ONLY the raw JSON object. Do not enclose in markdown code fences or add explanations outside the JSON.
- Never output raw passwords. If using credentials, specify the exact placeholder name, e.g. text: "{{cred:sitename.password}}".
- When asked to log in, fill username first, then password, then click the login/submit button.
- If you encounter a CAPTCHA or 2FA request, use action "ask_user" to ask the user to solve it or provide the code.
- When the task is accomplished, use action "finish" with a concise result summary.`;
