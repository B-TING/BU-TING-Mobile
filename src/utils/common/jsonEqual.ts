/** 값 내용이 같은지 JSON 직렬화로 비교한다. 참조만 바뀐 폴링 스냅샷을 걸러낸다. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
