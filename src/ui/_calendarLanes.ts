// 주 단위 스팬 레인 패킹 — CalendarPage(데스크탑)와 MobileCalendar가 *같은 알고리즘*을 쓴다(단일 출처).
//  두 곳에 복제하면 겹침 처리가 갈라져 같은 데이터가 다른 층으로 쌓인다(데스크탑에서 본 순서와 폰에서 본 순서가
//  달라지는 것은 버그로 읽힌다). 그래서 여기 한 벌만 둔다.
//
//  a·b = 그 주 안에서의 시작·끝 열(0~6, inclusive). ai·si = 적층 중요도(anchor·status 정의 순서).
//  정렬 = 중요도 → 시작열. 겹치지 않는 첫 레인에 넣는다(그리디) — 같은 입력이면 항상 같은 배치.
export function packLanes<T extends { a: number; b: number; ai: number; si: number }>(items: T[]) {
  const lanes: T[][] = [];
  const out: (T & { lane: number })[] = [];
  for (const it of [...items].sort((x, y) => (x.ai - y.ai) || (x.si - y.si) || (x.a - y.a))) {
    let i = 0;
    while (lanes[i] && lanes[i].some((r) => !(it.b < r.a || it.a > r.b))) i++;
    (lanes[i] = lanes[i] || []).push(it);
    out.push({ ...it, lane: i });
  }
  return { out, laneCount: lanes.length };
}
