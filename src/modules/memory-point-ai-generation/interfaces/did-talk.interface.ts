export interface IDidTalk {
  id: string;
  status: string; // created | started | done | error | rejected
  resultUrl?: string;
  error?: unknown;
  durationSeconds?: number;
}
