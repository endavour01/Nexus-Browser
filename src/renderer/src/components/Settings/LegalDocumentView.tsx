import React from 'react';
import { ArrowLeft } from 'lucide-react';
import privacyPolicy from '../../../../../docs/privacy-policy.md?raw';
import termsOfUse from '../../../../../docs/terms-of-use.md?raw';

type LegalDocument = 'privacy' | 'terms';

const documents: Record<LegalDocument, string> = {
  privacy: privacyPolicy,
  terms: termsOfUse,
};

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(' '), `p-${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length || !listType) return;
    const List = listType;
    blocks.push(
      <List key={`list-${blocks.length}`}>
        {listItems.map((item, index) => <li key={index}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>)}
      </List>
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);

    if (heading || /^---+$/.test(trimmed) || unordered || ordered || !trimmed) flushParagraph();
    if (heading || /^---+$/.test(trimmed) || !trimmed || (unordered && listType === 'ol') || (ordered && listType === 'ul')) flushList();

    if (heading) {
      const content = renderInline(heading[2], `h-${blocks.length}`);
      const key = `h-${blocks.length}`;
      if (heading[1].length === 1) blocks.push(<h1 key={key}>{content}</h1>);
      else if (heading[1].length === 2) blocks.push(<h2 key={key}>{content}</h2>);
      else blocks.push(<h3 key={key}>{content}</h3>);
    } else if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${blocks.length}`} />);
    } else if (unordered || ordered) {
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)![1]);
    } else if (trimmed) {
      paragraph.push(trimmed);
    }
  });

  flushParagraph();
  flushList();
  return blocks;
}

interface LegalDocumentViewProps {
  document: LegalDocument;
  onBack: () => void;
}

export const LegalDocumentView: React.FC<LegalDocumentViewProps> = ({ document, onBack }) => (
  <div className="settings-section-block legal-document-view">
    <button type="button" className="nexus-btn nexus-btn-secondary nexus-btn-sm legal-document-back" onClick={onBack}>
      <ArrowLeft size={14} />
      <span>Back to About NEXUS</span>
    </button>
    <aside className="legal-document-draft-note">
      Draft document: replace bracketed placeholders and verify the statements against the released product before publication.
    </aside>
    <article className="settings-group-card legal-document-content">
      {renderMarkdown(documents[document])}
    </article>
  </div>
);
