import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  EVENT_ZONES,
  eventZoneName,
} from '../../constants/eventZone/eventZone';
import { isEventGame } from '../../constants/eventZone/eventGame';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useZoneEventStore } from '../../stores';
import type { EventZoneId } from '../../types/eventZone';
import {
  MUKJJIPPA_HANDS,
  randomMukjjippaHand,
  resolveMukjjippaRound,
  type MukjjippaAttacker,
  type MukjjippaHand,
} from '../../utils/eventZone/mukjjippa';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameMukjjippa'>;

type Phase = 'pick' | 'reveal' | 'result';

const HAND_EMOJI: Record<MukjjippaHand, string> = {
  rock: '✊',
  scissors: '✌️',
  paper: '🖐️',
};

function pickMockOpponentZoneId(myZoneId: EventZoneId): EventZoneId {
  const others = EVENT_ZONES.filter(zone => zone.id !== myZoneId);
  const pool = others.length > 0 ? others : EVENT_ZONES;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function EventGameMukjjippaScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const opponentZoneId = useMemo(() => {
    if (!event) {
      return null;
    }
    return pickMockOpponentZoneId(event.zoneId);
    // 매칭 상대는 화면 진입 시 한 번만 고정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const [phase, setPhase] = useState<Phase>('pick');
  const [attacker, setAttacker] = useState<MukjjippaAttacker>(null);
  const [playerHand, setPlayerHand] = useState<MukjjippaHand | null>(null);
  const [opponentHand, setOpponentHand] = useState<MukjjippaHand | null>(null);
  const [success, setSuccess] = useState(false);
  const [roundNote, setRoundNote] = useState<string | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!event || !isEventGame(event) || event.type !== 'MUKJJIPPA') {
      navigation.goBack();
    }
  }, [event, navigation]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  if (!event || !isEventGame(event) || event.type !== 'MUKJJIPPA') {
    return null;
  }

  const opponentZone = opponentZoneId
    ? EVENT_ZONES.find(zone => zone.id === opponentZoneId)
    : undefined;

  const attackLabel =
    attacker === 'player'
      ? copy.mukjjippaYourAttack
      : attacker === 'opponent'
        ? copy.mukjjippaOpponentAttack
        : copy.mukjjippaNoAttack;

  const handLabel = (hand: MukjjippaHand) => {
    if (hand === 'rock') {
      return copy.mukjjippaHandRock;
    }
    if (hand === 'scissors') {
      return copy.mukjjippaHandScissors;
    }
    return copy.mukjjippaHandPaper;
  };

  const resetMatch = () => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setPhase('pick');
    setAttacker(null);
    setPlayerHand(null);
    setOpponentHand(null);
    setSuccess(false);
    setRoundNote(null);
  };

  const handlePick = (hand: MukjjippaHand) => {
    if (phase !== 'pick') {
      return;
    }

    const opp = randomMukjjippaHand();
    setPlayerHand(hand);
    setOpponentHand(opp);
    setPhase('reveal');
    setRoundNote(copy.mukjjippaRevealing);

    const result = resolveMukjjippaRound(hand, opp, attacker);

    revealTimerRef.current = setTimeout(() => {
      if (result.kind === 'end') {
        setSuccess(result.winner === 'player');
        setPhase('result');
        setRoundNote(null);
        return;
      }

      setAttacker(result.attacker);
      setRoundNote(copy.mukjjippaRoundContinue);
      setPhase('pick');
      setPlayerHand(null);
      setOpponentHand(null);
    }, 1100);
  };

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{event.titleKo}</Text>
      </View>

      <View className="flex-1 px-4 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3">
          <Text className="text-xs font-semibold text-pink-700">{attackLabel}</Text>
          {roundNote ? (
            <Text className="mt-1 text-sm font-bold text-pink-900">{roundNote}</Text>
          ) : (
            <Text className="mt-1 text-sm text-pink-900">{copy.mukjjippaPickHint}</Text>
          )}
        </View>

        <View className="mt-5 flex-1 justify-between">
          <View className="items-center rounded-3xl border border-brand-border bg-brand-surface px-4 py-6">
            <Text className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              {copy.mukjjippaOpponent}
            </Text>
            {opponentZone ? (
              <Text className="mt-1 text-sm font-semibold text-brand-text">
                {eventZoneName(opponentZone, language)}
              </Text>
            ) : null}
            <Text className="mt-4 text-6xl">
              {phase === 'reveal' && opponentHand
                ? HAND_EMOJI[opponentHand]
                : '❓'}
            </Text>
            <Text className="mt-2 text-sm text-brand-muted">
              {phase === 'reveal' && opponentHand
                ? handLabel(opponentHand)
                : '···'}
            </Text>
          </View>

          <View className="my-3 items-center">
            <Text className="text-sm font-bold text-brand-muted">VS</Text>
          </View>

          <View className="items-center rounded-3xl border border-brand-border bg-brand-surface px-4 py-6">
            <Text className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              {copy.mukjjippaYou}
            </Text>
            <Text className="mt-4 text-6xl">
              {playerHand ? HAND_EMOJI[playerHand] : '❔'}
            </Text>
            <Text className="mt-2 text-sm text-brand-muted">
              {playerHand ? handLabel(playerHand) : copy.mukjjippaPickHint}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          {MUKJJIPPA_HANDS.map(hand => (
            <Pressable
              key={hand}
              accessibilityRole="button"
              accessibilityLabel={handLabel(hand)}
              disabled={phase !== 'pick'}
              onPress={() => handlePick(hand)}
              className="flex-1 items-center rounded-2xl border border-brand-border bg-white py-4 active:opacity-90 disabled:opacity-40">
              <Text className="text-3xl">{HAND_EMOJI[hand]}</Text>
              <Text className="mt-1 text-sm font-bold text-brand-text">
                {handLabel(hand)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Modal visible={phase === 'result'} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-brand-surface p-6">
            <Text className="text-center text-4xl">{success ? '🎉' : '😅'}</Text>
            <Text className="mt-3 text-center text-xl font-bold text-brand-text">
              {success ? copy.successTitle : copy.failTitle}
            </Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-brand-muted">
              {success ? copy.successMukjjippa : copy.failMukjjippa}
            </Text>
            <View className="mt-6 flex-row gap-2">
              {!success ? (
                <Pressable
                  onPress={resetMatch}
                  className="flex-1 items-center rounded-2xl border border-brand-border py-3 active:opacity-80">
                  <Text className="font-semibold text-brand-text">
                    {copy.retryMukjjippa}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => navigation.navigate('EventZone')}
                className="flex-1 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
                <Text className="font-bold text-white">{copy.done}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
