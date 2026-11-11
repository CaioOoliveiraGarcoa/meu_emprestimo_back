import { Problem } from '../../common/problem';
export const MAX_OPEN_LOANS = 3;
export const LOAN_DAYS = 14;
export function checkBorrowingPolicy(open: { dueAt: Date }[], status: string, now: Date) {
  if (open.some(loan => loan.dueAt.getTime() < now.getTime()))
    throw new Problem(409, 'OVERDUE_LOAN', 'Você tem um empréstimo em atraso. Procure Operações.');
  if (open.length >= MAX_OPEN_LOANS)
    throw new Problem(409, 'LOAN_LIMIT', 'Limite de 3 empréstimos em aberto atingido.');
  if (status !== 'disponivel')
    throw new Problem(409, 'UNAVAILABLE', status === 'manutencao' ? 'Equipamento em manutenção.' : 'Equipamento já emprestado.');
}
function offset(date: Date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', timeZoneName: 'longOffset' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')!.value;
  if (name === 'GMT') return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
  if (!match) throw new Error('Fuso horário não suportado.');
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}
export function dueDate(now: Date): Date {
  const nominal = now.getTime() + LOAN_DAYS * 86400000;
  let result = new Date(nominal);
  for (let i = 0; i < 2; i++) result = new Date(nominal - (offset(result) - offset(now)) * 60000);
  return result;
}
