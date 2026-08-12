// 숫자·통화 포맷의 단일 진실 공급원 — **순수 모듈**(React 없음).
//  왜 `_cells.tsx`에서 뽑아냈나: 인쇄 엔진(`paperLayout.ts`)이 같은 `fmtCurrency`를 자기 파일에
//  한 벌 더 갖고 있었다. `_cells`는 JSX를 그리는 파일이라 순수 엔진이 못 당겨 쓰고, 그래서 복사가 생겼다.
//  값만 있는 이 모듈을 아래에 깔면 둘 다 여기를 본다(`_cells`는 그대로 재수출 — 기존 import 경로 유지).
//  한국 소비자 기준(잠정 — 다국어화 시 locale은 토큰/설정으로 분리).
const NUM = new Intl.NumberFormat('ko-KR');
const KRW = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });

export function fmtNumber(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  return v == null || v === '' || Number.isNaN(n) ? '' : NUM.format(n); // 천 단위 ,
}
export function fmtCurrency(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  return v == null || v === '' || Number.isNaN(n) ? '' : KRW.format(n); // ₩ + 천 단위 ,
}
