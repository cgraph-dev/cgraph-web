/**
 * Poll creation modal for in-chat polls.
 *
 * Mirrors Telegram's PollCreateActivity: up to 10 options,
 * toggles for anonymous voting, multiple choice, and quiz mode
 * with correct answer selection and explanation field.
 */
import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { CreatePollParams } from '@cgraph-dev/shared-types';
import { cn } from '@/lib/utils';

interface PollCreateModalProps {
  readonly conversationId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (params: CreatePollParams) => void;
}

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;

/** Renders a modal for creating in-chat polls with up to 10 options. */
function PollCreateModal(props: PollCreateModalProps): ReactNode {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Array<{ id: number; text: string }>>([
    { id: 0, text: '' },
    { id: 1, text: '' },
  ]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isQuiz, setIsQuiz] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');

  function addOption(): void {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { id: prev.length, text: '' }]);
  }

  function removeOption(id: number): void {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  function updateOption(id: number, text: string): void {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function handleSubmit(): void {
    const validOptions = options.filter((o) => o.text.trim().length > 0);
    if (question.trim().length === 0 || validOptions.length < MIN_OPTIONS) return;

    props.onSubmit({
      question: question.trim(),
      options: validOptions,
      isAnonymous,
      isMultipleChoice,
      isQuiz,
      correctOptionId: isQuiz ? (correctOptionId ?? undefined) : undefined,
      explanation: isQuiz && explanation.trim() ? explanation.trim() : undefined,
    });
    props.onClose();
  }

  if (!props.isOpen) return null;

  const canSubmit =
    question.trim().length > 0 &&
    options.filter((o) => o.text.trim().length > 0).length >= MIN_OPTIONS &&
    (!isQuiz || correctOptionId !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface-primary max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl p-6"
      >
        <h2 className="mb-4 text-lg font-semibold">Create Poll</h2>

        <input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          className="bg-surface-secondary mb-4 w-full rounded-lg p-3"
        />

        <div className="mb-4 space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              {isQuiz && (
                <button
                  type="button"
                  onClick={() => setCorrectOptionId(opt.id)}
                  className={cn(
                    'h-5 w-5 flex-shrink-0 rounded-full border-2',
                    correctOptionId === opt.id ? 'border-green-500 bg-green-500' : 'border-gray-400'
                  )}
                />
              )}
              <input
                type="text"
                placeholder={`Option ${opt.id + 1}`}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                maxLength={100}
                className="bg-surface-secondary flex-1 rounded-lg p-2"
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  {'\u00d7'}
                </button>
              )}
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <button type="button" onClick={addOption} className="text-sm text-primary">
              + Add Option
            </button>
          )}
        </div>

        <div className="border-surface-secondary mb-4 space-y-3 border-t pt-4">
          <label className="flex items-center justify-between">
            <span>Anonymous Voting</span>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Multiple Answers</span>
            <input
              type="checkbox"
              checked={isMultipleChoice}
              onChange={(e) => {
                setIsMultipleChoice(e.target.checked);
                if (e.target.checked && isQuiz) {
                  setIsQuiz(false);
                }
              }}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Quiz Mode</span>
            <input
              type="checkbox"
              checked={isQuiz}
              onChange={(e) => {
                setIsQuiz(e.target.checked);
                if (e.target.checked && isMultipleChoice) {
                  setIsMultipleChoice(false);
                }
              }}
            />
          </label>
          {isQuiz && (
            <input
              type="text"
              placeholder="Explanation (shown after answer)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={200}
              className="bg-surface-secondary w-full rounded-lg p-2"
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={props.onClose}
            className="bg-surface-secondary flex-1 rounded-lg p-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-primary p-3 text-white disabled:opacity-50"
          >
            Create Poll
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { PollCreateModal };
