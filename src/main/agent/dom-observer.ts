/**
 * NEXUS AI Browser Assistant — DOM Observer
 * Extracts a simplified, token-efficient representation of visible interactive elements
 * from the target WebContentsView with precise viewport coordinates.
 */

import { WebContents } from 'electron';

export interface ObservedElement {
  id: number;
  tag: string;
  type?: string;
  label: string;
  placeholder?: string;
  value?: string;
  isClickable: boolean;
  isTextInput: boolean;
  isSubmit: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageObservation {
  title: string;
  url: string;
  elements: ObservedElement[];
  formattedSummary: string;
}

export class DOMObserver {
  /**
   * Evaluates inside the WebContentsView to extract all visible interactive elements.
   */
  public static async observe(wc: WebContents): Promise<PageObservation> {
    if (wc.isDestroyed()) {
      throw new Error('WebContents is destroyed');
    }

    const title = wc.getTitle() || 'Untitled';
    const url = wc.getURL() || 'about:blank';

    // Inject extraction script into the page
    const elements = await wc.executeJavaScript(`
      (() => {
        try {
          const interactiveSelector = [
            'button',
            'input',
            'select',
            'textarea',
            'a[href]',
            '[role="button"]',
            '[role="link"]',
            '[role="checkbox"]',
            '[role="menuitem"]',
            '[role="tab"]',
            '[contenteditable="true"]',
            '[tabindex]:not([tabindex="-1"])',
          ].join(', ');

          const rawElements = Array.from(document.querySelectorAll(interactiveSelector));
          const results = [];
          let currentId = 1;

          for (const el of rawElements) {
            // Check visibility
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            
            const style = window.getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) {
              continue;
            }

            // Must be within reasonably reachable viewport
            if (rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight * 2 || rect.left > window.innerWidth * 2) {
              continue;
            }

            // Mark element for direct DOM fallback if coordinate click is intercepted
            el.setAttribute('data-nexus-agent-id', String(currentId));

            const tag = el.tagName.toLowerCase();
            const type = (el.getAttribute('type') || '').toLowerCase();
            const isTextInput =
              tag === 'textarea' ||
              el.getAttribute('contenteditable') === 'true' ||
              (tag === 'input' && !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image'].includes(type));
            
            const isSubmit =
              type === 'submit' ||
              (tag === 'button' && (!type || type === 'submit')) ||
              /submit|sign in|log in|pay|continue|proceed/i.test(el.textContent || '');

            // Derive accessible label
            let label = el.getAttribute('aria-label') || '';
            if (!label && el.id) {
              const labelEl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
              if (labelEl) label = labelEl.textContent?.trim() || '';
            }
            if (!label && (tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button')) {
              label = (el.textContent || '').trim().replace(/\\s+/g, ' ');
            }
            if (!label) {
              label = el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('name') || '';
            }

            const placeholder = el.getAttribute('placeholder') || undefined;
            let value = undefined;
            if (isTextInput && 'value' in el) {
              value = type === 'password' ? (el.value ? '••••••••' : '') : String(el.value || '');
            }

            results.push({
              id: currentId,
              tag,
              type: type || undefined,
              label: label.slice(0, 100),
              placeholder: placeholder ? placeholder.slice(0, 80) : undefined,
              value: value ? value.slice(0, 80) : undefined,
              isClickable: tag === 'button' || tag === 'a' || ['button', 'submit'].includes(type) || el.getAttribute('role') === 'button',
              isTextInput,
              isSubmit,
              x: Math.round(rect.left + rect.width / 2),
              y: Math.round(rect.top + rect.height / 2),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });

            currentId++;
            if (currentId > 60) break; // Limit elements per step for model prompt efficiency
          }

          return results;
        } catch (e) {
          return [];
        }
      })()
    `).catch(() => []);

    const formattedSummary = this.formatElementsForPrompt(title, url, elements);

    return {
      title,
      url,
      elements: elements || [],
      formattedSummary,
    };
  }

  private static formatElementsForPrompt(title: string, url: string, elements: ObservedElement[]): string {
    const lines: string[] = [
      `Page Title: "${title}"`,
      `Current URL: ${url}`,
      'Interactive Elements on Page:',
    ];

    if (!elements || elements.length === 0) {
      lines.push('  (No visible interactive elements detected)');
      return lines.join('\n');
    }

    for (const el of elements) {
      let desc = `[${el.id}] <${el.tag}`;
      if (el.type) desc += ` type="${el.type}"`;
      desc += '>';
      if (el.label) desc += ` label="${el.label}"`;
      if (el.placeholder) desc += ` placeholder="${el.placeholder}"`;
      if (el.value) desc += ` current_value="${el.value}"`;
      if (el.isSubmit) desc += ' (SUBMIT)';
      lines.push(`  ${desc}`);
    }

    return lines.join('\n');
  }
}
