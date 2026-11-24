import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Copy, Locale } from '../i18n';
import type { Fact } from '../lib/ask/facts';

/** What the question is about: nothing in particular, a product card, or a car card. */
export interface AskContext {
  productId?: string;
  carId?: string;
  title?: string;
}

interface Answer {
  answer: string;
  facts: Fact[];
  cited: string[];
  withheld: boolean;
}

interface Props {
  context: AskContext | null;
  onClose: () => void;
  copy: Copy;
  locale: Locale;
}

/** Splits "text [F1] more" so citations render as small markers. */
function withCitations(text: string) {
  return text.split(/(\[F\d{1,2}\])/g).map((part, i) =>
    /^\[F\d{1,2}\]$/.test(part) ? (
      <sup key={i} className="ask-cite">
        {part.slice(1, -1)}
      </sup>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AskDialog({ context, onClose, copy, locale }: Props) {
  const t = copy.ask;
  const ref = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; answer?: Answer; error?: string }>({ status: 'idle' });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (context && !dialog.open) {
      setQuestion('');
      setState({ status: 'idle' });
      dialog.showModal();
    } else if (!context && dialog.open) {
      dialog.close();
    }
  }, [context]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || state.status === 'loading') return;
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, locale, productId: context?.productId, carId: context?.carId }),
      });
      if (!res.ok) {
        const error = res.status === 503 ? t.errors.off : res.status === 429 ? t.errors.busy : res.status === 400 && q.length > 300 ? t.errors.tooLong : t.errors.failed;
        setState({ status: 'error', error });
        return;
      }
      setState({ status: 'done', answer: (await res.json()) as Answer });
    } catch {
      setState({ status: 'error', error: t.errors.failed });
    }
  }

  const a = state.answer;
  const shown = a ? (a.withheld || a.cited.length === 0 ? a.facts : a.facts.filter((f) => a.cited.includes(f.id))) : [];

  return (
    <dialog ref={ref} className="ask-dialog" aria-labelledby={`${inputId}-title`} onClose={onClose}>
      <div className="ask-dialog-head">
        <h2 id={`${inputId}-title`} className="ask-dialog-title">
          {context?.title ? t.titleAbout(context.title) : t.title}
        </h2>
        <button type="button" className="ask-close" onClick={() => ref.current?.close()} aria-label={t.close}>
          ×
        </button>
      </div>
      <p className="ask-lede">{t.lede}</p>

      <form className="ask-form" onSubmit={submit}>
        <label className="visually-hidden" htmlFor={inputId}>
          {t.label}
        </label>
        <textarea
          id={inputId}
          className="ask-question"
          rows={2}
          maxLength={300}
          placeholder={t.placeholder}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          autoFocus
        />
        <button type="submit" className="ask-submit" disabled={state.status === 'loading' || !question.trim()}>
          {t.submit}
        </button>
      </form>

      <div className="ask-result" aria-live="polite">
        {state.status === 'loading' ? <p className="ask-status">{t.asking}</p> : null}
        {state.status === 'error' ? <p className="ask-status ask-error">{state.error}</p> : null}
        {a ? (
          <>
            <p className="ask-answer">{withCitations(a.answer)}</p>
            {shown.length > 0 ? (
              <div className="ask-facts">
                <p className="ask-facts-title">{a.withheld || a.cited.length === 0 ? t.factsFound : t.factsUsed}</p>
                <ol>
                  {shown.map((f) => (
                    <li key={f.id}>
                      <span className="ask-cite">{f.id}</span> {f.text.split('; our note:')[0]}
                      {f.url ? (
                        <>
                          {' '}
                          <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">
                            {t.open_listing}
                            <span className="visually-hidden">{copy.a11y.newWindow}</span>
                          </a>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </dialog>
  );
}
