import { useCallback, useMemo, useState } from 'react';

import type { BudgetEntryDraft } from '../../components/plan/modals/BudgetEntryModal';
import { useAppAlert } from '../../components/shared/modals';
import { useCopy } from '../../i18n';
import {
  budgetEntryToCreateRequest,
  expenseCreateResponseToBudgetEntry,
} from '../../services/travel/travelExpenseMapper';
import { createTravelExpense } from '../../services/travel/travelExpenseService';
import { usePlanStore } from '../../stores';
import type {
  TravelExpenseSummaryResponse,
  TravelSettlementResponse,
} from '../../types/travelApi';
import type { BudgetEntry, TravelPlan } from '../../types/travelPlan';
import {
  buildMemberSummariesFromBudgetEntries,
  buildTransfersFromMemberSummaries,
  pickCurrencyMemberSummaries,
} from '../../utils/plan/budgetSettlementPreview';

const EMPTY_BUDGET: BudgetEntry[] = [];

type UsePlanDetailBudgetParams = {
  plan: TravelPlan | null;
  planId: string;
  travelId: string | undefined;
  accessToken: string | null | undefined;
  isApiPlan: boolean;
  viewOnly: boolean;
  scheduleReadOnly: boolean;
  canInvite: boolean;
  notifyScheduleReadOnly: () => void;
  settlement: TravelSettlementResponse | null;
  summary: TravelExpenseSummaryResponse | null;
  confirmSettlement: () => Promise<unknown>;
  refreshSettlementPreview: () => Promise<unknown>;
  syncExpenses: () => void;
};

/** 가계부 입력 · 정산 확정 */
export function usePlanDetailBudget({
  plan,
  planId,
  travelId,
  accessToken,
  isApiPlan,
  viewOnly,
  scheduleReadOnly,
  canInvite,
  notifyScheduleReadOnly,
  settlement,
  summary,
  confirmSettlement,
  refreshSettlementPreview,
  syncExpenses,
}: UsePlanDetailBudgetParams) {
  const copy = useCopy('planDetail');
  const { alert } = useAppAlert();
  const budgetEntries = usePlanStore(s => s.budgetByPlan?.[planId] ?? EMPTY_BUDGET);
  const addBudgetEntry = usePlanStore(s => s.addBudgetEntry);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount, 0);

  const settlementConfirmed = settlement?.confirmed === true;
  const canConfirmSettlement = canInvite && !settlementConfirmed && !viewOnly;

  const settlementMemberSummaries = useMemo(() => {
    const fromApi = pickCurrencyMemberSummaries(summary?.currencySummaries);
    if (fromApi.length > 0) {
      return fromApi;
    }
    if (!plan || budgetEntries.length === 0) {
      return [];
    }
    return buildMemberSummariesFromBudgetEntries(budgetEntries, plan.members);
  }, [budgetEntries, plan, summary]);

  const settlementForDisplay = useMemo(() => {
    if (!settlement && settlementMemberSummaries.length === 0) {
      return null;
    }

    const apiTransfers = settlement?.transfers ?? [];
    if (apiTransfers.length > 0 || settlementConfirmed) {
      return (
        settlement ?? {
          travelId: travelId ?? '',
          confirmed: false,
          transfers: [],
        }
      );
    }

    const localTransfers = buildTransfersFromMemberSummaries(settlementMemberSummaries);
    return {
      travelId: settlement?.travelId ?? travelId ?? '',
      confirmed: settlement?.confirmed ?? false,
      confirmedById: settlement?.confirmedById,
      confirmedAt: settlement?.confirmedAt,
      transfers: localTransfers,
    };
  }, [settlement, settlementConfirmed, settlementMemberSummaries, travelId]);

  const handleSaveBudgetEntry = useCallback(
    async (entry: BudgetEntryDraft) => {
      if (viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }

      if (!isApiPlan || !accessToken || !travelId) {
        addBudgetEntry(entry);
        return;
      }

      if (settlementConfirmed) {
        alert({
          title: copy.budgetAdd,
          message: copy.budgetSettlementLocked,
        });
        return;
      }

      try {
        const request = budgetEntryToCreateRequest(entry);
        const created = await createTravelExpense(accessToken, travelId, request);
        addBudgetEntry(
          expenseCreateResponseToBudgetEntry(created, planId, request.participantIds),
        );
        await refreshSettlementPreview();
        void syncExpenses();
      } catch (error) {
        alert({
          title: copy.budgetAdd,
          message: error instanceof Error ? error.message : copy.budgetAdd,
        });
      }
    },
    [
      accessToken,
      addBudgetEntry,
      alert,
      copy.budgetAdd,
      copy.budgetSettlementLocked,
      isApiPlan,
      notifyScheduleReadOnly,
      planId,
      refreshSettlementPreview,
      scheduleReadOnly,
      settlementConfirmed,
      syncExpenses,
      travelId,
      viewOnly,
    ],
  );

  const handleConfirmSettlement = useCallback(() => {
    if (!canConfirmSettlement) {
      alert({
        title: copy.budgetSettlementConfirm,
        message: copy.budgetSettlementLeaderOnly,
      });
      return;
    }

    alert({
      title: copy.budgetSettlementConfirmTitle,
      message: copy.budgetSettlementConfirmMessage,
      buttons: [
        { label: copy.budgetCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.budgetSettlementConfirmAction,
          variant: 'primary',
          onPress: () => {
            void (async () => {
              try {
                await confirmSettlement();
              } catch (error) {
                alert({
                  title: copy.budgetSettlementConfirm,
                  message:
                    error instanceof Error ? error.message : copy.budgetSettlementError,
                });
              }
            })();
          },
        },
      ],
    });
  }, [
    alert,
    canConfirmSettlement,
    confirmSettlement,
    copy.budgetCancel,
    copy.budgetSettlementConfirm,
    copy.budgetSettlementConfirmAction,
    copy.budgetSettlementConfirmMessage,
    copy.budgetSettlementConfirmTitle,
    copy.budgetSettlementError,
    copy.budgetSettlementLeaderOnly,
  ]);

  const resetBudgetUiOnPlanChange = useCallback(() => {
    setBudgetModalOpen(false);
  }, []);

  return {
    budgetModalOpen,
    setBudgetModalOpen,
    budgetEntries,
    budgetTotal,
    settlementConfirmed,
    canConfirmSettlement,
    settlementMemberSummaries,
    settlementForDisplay,
    handleSaveBudgetEntry,
    handleConfirmSettlement,
    resetBudgetUiOnPlanChange,
  };
}
