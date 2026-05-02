/**
 * Chat poll types for in-chat message polls.
 *
 * Mirrors Telegram's TL_poll structure: question with up to 10 options,
 * anonymous/public voting, multiple choice, quiz mode with correct answer.
 */

/** Single poll option with an integer ID and display text. */
export interface ChatPollOption {
  readonly id: number;
  readonly text: string;
}

/** Aggregated vote count for a single poll option. */
export interface ChatPollOptionCount {
  readonly optionId: number;
  readonly count: number;
}

/** Voter record returned for non-anonymous polls. */
export interface ChatPollVoter {
  readonly userId: string;
  readonly optionIds: ReadonlyArray<number>;
}

/** Full chat poll data returned from the API. */
export interface ChatPoll {
  readonly id: string;
  readonly question: string;
  readonly options: ReadonlyArray<ChatPollOption>;
  readonly isAnonymous: boolean;
  readonly isMultipleChoice: boolean;
  readonly isQuiz: boolean;
  readonly closeDate: string | null;
  readonly totalVoterCount: number;
  readonly isClosed: boolean;
  readonly creatorId: string;
  readonly createdAt: string;
  readonly optionCounts?: ReadonlyArray<ChatPollOptionCount>;
  readonly myVote?: ReadonlyArray<number> | null;
  readonly voters?: ReadonlyArray<ChatPollVoter>;
  readonly correctOptionId?: number | null;
  readonly explanation?: string | null;
}

/** Parameters for creating a new poll. */
export interface CreatePollParams {
  readonly question: string;
  readonly options: ReadonlyArray<{ id: number; text: string }>;
  readonly isAnonymous?: boolean;
  readonly isMultipleChoice?: boolean;
  readonly isQuiz?: boolean;
  readonly correctOptionId?: number;
  readonly explanation?: string;
  readonly closeDate?: string;
}

/** Parameters for voting on a poll. */
export interface VotePollParams {
  readonly optionIds: ReadonlyArray<number>;
}
