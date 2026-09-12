/**
 * 포그라운드에서만 서버 데이터를 다시 가져오는 주기.
 * 웹소켓 전까지 실시간 체감용. 백그라운드에서는 돌리지 않는다.
 */
export const ZONE_EVENT_POLL_INTERVAL_MS = 5_000;
export const TRAVEL_PLAN_POLL_INTERVAL_MS = 5_000;
export const SESSION_TRAVELS_POLL_INTERVAL_MS = 15_000;
