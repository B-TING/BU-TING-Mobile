export type MukjjippaHand = 'rock' | 'scissors' | 'paper';
export type MukjjippaAttacker = 'player' | 'opponent' | null;
export type MukjjippaWinner = 'player' | 'opponent';

export const MUKJJIPPA_HANDS: MukjjippaHand[] = ['rock', 'scissors', 'paper'];

export function randomMukjjippaHand(): MukjjippaHand {
  return MUKJJIPPA_HANDS[Math.floor(Math.random() * MUKJJIPPA_HANDS.length)];
}

/** a가 b를 이기는지 (가위바위보) */
export function mukjjippaBeats(a: MukjjippaHand, b: MukjjippaHand): boolean {
  return (
    (a === 'rock' && b === 'scissors') ||
    (a === 'scissors' && b === 'paper') ||
    (a === 'paper' && b === 'rock')
  );
}

export type MukjjippaRoundResult =
  | { kind: 'continue'; attacker: MukjjippaAttacker }
  | { kind: 'end'; winner: MukjjippaWinner };

/**
 * 묵찌빠 한 라운드 판정
 * - 공격권 없음 + 동일 손 → 무승부(계속)
 * - 공격권 있음 + 동일 손 → 공격권 보유자 승리(종료)
 * - 서로 다른 손 → 가위바위보 승자가 다음 공격권
 */
export function resolveMukjjippaRound(
  player: MukjjippaHand,
  opponent: MukjjippaHand,
  attacker: MukjjippaAttacker,
): MukjjippaRoundResult {
  if (player === opponent) {
    if (attacker == null) {
      return { kind: 'continue', attacker: null };
    }
    return { kind: 'end', winner: attacker };
  }

  return {
    kind: 'continue',
    attacker: mukjjippaBeats(player, opponent) ? 'player' : 'opponent',
  };
}
