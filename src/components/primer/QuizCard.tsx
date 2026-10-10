import { useEffect, useRef, useState, type ReactNode } from 'react';
import Brand from '@primer/react-brand';
const { Button, Checkbox, CheckboxGroup, FormControl, Radio, RadioGroup } =
  Brand;
import { Banner } from '@primer/react';
import { ThemeProvider } from '@primer/react/next';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  XCircleIcon,
} from '@primer/octicons-react';
import { isQuizAnswerCorrect, type Quiz } from '../../lib/quiz-helpers';
import type { RichText } from '../../lib/interfaces';
import { snakeToKebab } from '../../lib/style-helpers';

type Result = 'correct' | 'incorrect' | 'revealed' | null;

function ChoiceText({ texts }: { texts: RichText[] }) {
  return (
    <>
      {texts.map((text, index) => {
        const a = text.Annotation;
        const content = (
          <span
            className={`quiz-rich-text ${a?.Code ? 'quiz-inline-code' : ''} ${snakeToKebab(a?.Color || 'default')}`}
            style={{
              fontWeight: a?.Bold
                ? 'var(--base-text-weight-semibold)'
                : undefined,
              fontStyle: a?.Italic ? 'italic' : undefined,
              textDecoration:
                [
                  a?.Underline && 'underline',
                  a?.Strikethrough && 'line-through',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined,
            }}
          >
            {text.PlainText}
          </span>
        );
        return text.Href ? (
          <a key={index} href={text.Href}>
            {content}
          </a>
        ) : (
          <span key={index}>{content}</span>
        );
      })}
    </>
  );
}

export default function QuizCard({
  id,
  title,
  choices,
  multiple,
  children,
}: Quiz & { children?: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [resetCount, setResetCount] = useState(0);
  const firstInput = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLElement>(null);
  const locked = result !== null;
  const resultTitle =
    result === 'correct'
      ? '正解です'
      : result === 'incorrect'
        ? '不正解です'
        : '正解と解説';
  const questionNumber = title.match(/^(Q[\d-]+)[.．]?\s*/i)?.[0] || '';
  const question = title.slice(questionNumber.length);

  useEffect(() => {
    if (result) feedback.current?.focus();
  }, [result]);
  useEffect(() => {
    if (resetCount) firstInput.current?.focus();
  }, [resetCount]);
  const reset = () => {
    setSelected([]);
    setResult(null);
    setResetCount((count) => count + 1);
  };

  const optionControls = choices.map((choice, index) => {
    const state =
      locked && choice.correct
        ? 'correct'
        : locked && selected.includes(choice.id)
          ? 'incorrect'
          : selected.includes(choice.id)
            ? 'selected'
            : 'idle';
    if (locked) {
      return (
        <li key={choice.id} className={`quiz-option is-${state}`}>
          <div className="quiz-reviewed-choice">
            <span className="quiz-option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="quiz-option-text">
              <ChoiceText texts={choice.richTexts} />
            </span>
          </div>
          {choice.correct ? (
            <span className="quiz-option-result">
              <CheckCircleIcon size={16} />
              {selected.includes(choice.id) ? '正解・選んだ回答' : '正解'}
            </span>
          ) : selected.includes(choice.id) ? (
            <span className="quiz-option-result">
              <XCircleIcon size={16} />
              選んだ回答
            </span>
          ) : null}
        </li>
      );
    }
    return (
      <div key={choice.id} className={`quiz-option is-${state}`}>
        <FormControl id={`${id}-${choice.id}`}>
          {multiple ? (
            <Checkbox
              value={choice.id}
              checked={selected.includes(choice.id)}
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? [...selected, choice.id]
                    : selected.filter((value) => value !== choice.id)
                )
              }
              ref={index === 0 ? firstInput : undefined}
            />
          ) : (
            <Radio
              value={choice.id}
              checked={selected.includes(choice.id)}
              name={`quiz-${id}`}
              onChange={() => setSelected([choice.id])}
              ref={index === 0 ? firstInput : undefined}
            />
          )}
          <FormControl.Label>
            <span className="quiz-choice-content">
              <span className="quiz-option-letter" aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="quiz-option-text">
                <ChoiceText texts={choice.richTexts} />
              </span>
            </span>
          </FormControl.Label>
        </FormControl>
      </div>
    );
  });

  return (
    <ThemeProvider contextOnly>
      <details
        // Native details can be opened before this visible island hydrates.
        // Its uncontrolled open attribute belongs to the reader's interaction.
        suppressHydrationWarning
        className="quiz-card"
        id={`quiz-${id}`}
        data-result={result || 'unanswered'}
      >
        <summary className="quiz-summary">
          <span className="quiz-summary-copy">
            <span className="quiz-eyebrow">
              理解チェック {questionNumber.replace(/[.．]\s*$/, '')}
            </span>
            <span className="quiz-question">{question}</span>
          </span>
          <span className="quiz-summary-state">
            {result === 'correct'
              ? '正解'
              : result === 'incorrect'
                ? '不正解'
                : locked
                  ? '確認済み'
                  : '未回答'}
          </span>
          <ChevronDownIcon size={18} />
        </summary>
        <div className="quiz-content">
          {locked ? (
            <ol className="quiz-reviewed-options" aria-label="回答の結果">
              {optionControls}
            </ol>
          ) : multiple ? (
            <CheckboxGroup>
              <CheckboxGroup.Label>回答を選択</CheckboxGroup.Label>
              <CheckboxGroup.Caption>
                正しいものをすべて選んでください。
              </CheckboxGroup.Caption>
              {optionControls}
            </CheckboxGroup>
          ) : (
            <RadioGroup>
              <RadioGroup.Label>回答を選択</RadioGroup.Label>
              <RadioGroup.Caption>
                正しいものを1つ選んでください。
              </RadioGroup.Caption>
              {optionControls}
            </RadioGroup>
          )}
          <div className="quiz-actions">
            {locked ? (
              <Button onClick={reset}>もう一度解く</Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  hasArrow={false}
                  disabled={selected.length === 0}
                  onClick={() =>
                    setResult(
                      isQuizAnswerCorrect(choices, selected)
                        ? 'correct'
                        : 'incorrect'
                    )
                  }
                >
                  回答する
                </Button>
                <Button variant="subtle" onClick={() => setResult('revealed')}>
                  正解を見る
                </Button>
              </>
            )}
          </div>
          {locked && (
            <Banner
              ref={feedback}
              variant={
                result === 'correct'
                  ? 'success'
                  : result === 'incorrect'
                    ? 'warning'
                    : 'info'
              }
              className="quiz-feedback"
            >
              <Banner.Title as="h4" className="quiz-feedback-title">
                {resultTitle}
              </Banner.Title>
              <div className="quiz-explanation">{children}</div>
            </Banner>
          )}
        </div>
      </details>
    </ThemeProvider>
  );
}
