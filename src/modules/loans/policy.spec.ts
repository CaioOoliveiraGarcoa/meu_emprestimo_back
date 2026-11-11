import { Problem } from '../../common/problem';
import { checkBorrowingPolicy, dueDate } from './policy';

function problemCode(operation: () => void) {
  try {
    operation();
  } catch (error) {
    if (error instanceof Problem) return (error.getResponse() as { code: string }).code;
    throw error;
  }
  return null;
}

describe('solicitar empréstimo', () => {
  const now = new Date('2026-11-11T15:00:00Z');
  const open = { dueAt: new Date('2026-11-25T15:00:00Z') };

  it('CA-E03 rejeita a quarta solicitação', () => {
    expect(() => checkBorrowingPolicy([open, open], 'disponivel', now)).not.toThrow();
    expect(problemCode(() => checkBorrowingPolicy([open, open, open], 'disponivel', now))).toBe('LOAN_LIMIT');
  });
  it('CA-E04 e CA-E09 bloqueia após o instante, sem bloquear na igualdade', () => {
    expect(() => checkBorrowingPolicy([{ dueAt: now }], 'disponivel', now)).not.toThrow();
    expect(problemCode(() => checkBorrowingPolicy([{ dueAt: new Date(now.getTime() - 1) }], 'disponivel', now)))
      .toBe('OVERDUE_LOAN');
    expect(dueDate(now).toISOString()).toBe('2026-11-25T15:00:00.000Z');
  });
  it('CA-E05 recusa manutenção e item emprestado', () => {
    expect(problemCode(() => checkBorrowingPolicy([], 'manutencao', now))).toBe('UNAVAILABLE');
    expect(problemCode(() => checkBorrowingPolicy([], 'emprestado', now))).toBe('UNAVAILABLE');
  });
});
