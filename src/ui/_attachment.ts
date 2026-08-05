// ─────────────────────────────────────────────────────────────────────────
// _attachment — 첨부 뷰어의 **공유 계약**. 부품이 아니라 타입이다(런타임 의존 0).
//
//  데스크탑 AttachmentViewer와 MobileAttachmentViewer가 이 한 벌을 쓴다. 두 층이 각자 타입을 들면
//  같은 첨부가 두 화면에서 다르게 취급되고, 그건 데이터 버그로 읽힌다(_audience·CalendarEvent와 같은 규율).
//
//  왜 `layer` prop을 두지 않나: 소비처는 자기가 어느 셸인지 안다. 한 부품이 layer를 받아 분기하면
//  같은 자리를 두 경로가 다투게 된다(경쟁 경로 금지). 부품을 둘로 나누고 계약만 공유한다.
// ─────────────────────────────────────────────────────────────────────────
import type { Action } from './_cells';

/** 첨부의 *종류*. 확장자→종류 판별은 소비처가 한다(도메인·로케일을 부품이 모른다). */
export type AttachmentKind =
  | 'image' | 'pdf' | 'document' | 'sheet' | 'slide' | 'archive' | 'unknown';

/** 못 여는 사유. 단일 "미리보기 불가" 문구를 쓰지 않는 이유는 아래 UNVIEWABLE_REASON 주석 참조. */
export type UnviewableReason = 'unsupported' | 'too-large' | 'protected' | 'failed';

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  name: string;
  src?: string;
  size?: string;              // '24 KB' — 포맷은 소비처(MobileFileRow 선례)
  alt?: string;               // image일 때 대체 텍스트
  /** 있으면 kind와 무관하게 **폴백이 이긴다**. 서버가 "이건 못 연다"고 말할 수 있어야 한다. */
  unviewable?: UnviewableReason;
};

/**
 * 사유별 문구 — 단일 "미리보기 불가"를 금지한다.
 * Dropbox 7종·Box 8종이 원인별로 문구를 가르는 이유: 사용자가 다음에 뭘 할지가 사유마다 다르다
 * (형식 문제면 내려받기, 용량이면 데스크탑, 보호면 권한 요청).
 * 문구 자체는 여기 두되 소비처가 덮을 수 있게 열어둔다(로케일·도메인 어휘).
 */
export const UNVIEWABLE_REASON: Record<UnviewableReason, string> = {
  unsupported: '이 형식은 미리보기를 지원하지 않습니다',
  'too-large': '파일이 너무 커서 미리보기를 만들 수 없습니다',
  protected: '보호된 파일이라 미리보기를 열 수 없습니다',
  failed: '미리보기를 불러오지 못했습니다',
};

/** 데스크탑·모바일 뷰어가 공유하는 prop 계약. 두 부품이 이걸 그대로 받는다. */
export type AttachmentViewerContract = {
  opened: boolean;
  onClose: () => void;
  items: Attachment[];
  /** controlled — 몇 번째를 보고 있는지의 주인은 소비처다(목록 화면과 상태를 공유해야 하므로). */
  index: number;
  onIndexChange: (next: number) => void;
  /** 폴백 카드의 **유일한 탈출구**. 못 여는 파일에 내려받기까지 없으면 막다른 길이 된다. */
  onDownload?: (item: Attachment) => void;
  onPrint?: (item: Attachment) => void;
  /** 모바일만 그린다 — 데스크탑엔 OS 공유 관습이 없다. */
  onShare?: (item: Attachment) => void;
  /** 기존 Action 어휘 재사용(새 액션 타입을 만들지 않는다). */
  actions?: Action[];
  /**
   * pdf.js 자산의 기준 경로. **패키지는 정적 파일을 서빙할 수 없으므로 소비 앱이 놓는다.**
   * 여기에 worker·cmaps·wasm·standard_fonts가 있어야 한다(CDN 0 — 폐쇄망 요건).
   * 안 주면 PDF는 폴백 카드로 떨어진다(조용히 깨지는 것보다 낫다).
   */
  pdfAssetBase?: string;
};

/** counter 문구 — "3 / 12". APG가 인정한 접근 가능한 이름의 대체 수단이라 **옵션이 아니라 필수**다. */
export const counterLabel = (index: number, total: number) => `${index + 1} / ${total}`;

/** 이 첨부를 실제로 렌더할 수 있는가. unviewable이 있으면 kind와 무관하게 false. */
export function isViewable(item: Attachment, hasPdfEngine: boolean): boolean {
  if (item.unviewable) return false;
  if (!item.src) return false;
  if (item.kind === 'image') return true;
  if (item.kind === 'pdf') return hasPdfEngine;
  // 오피스·HWP·압축은 인라인 렌더를 하지 않는다 — 플랫폼·서버에 위임하고 폴백 카드 + 내려받기(06 §5).
  return false;
}

/** 폴백 사유 결정 — 왜 못 여는지를 한 곳에서 정한다(두 부품이 다르게 판정하면 안 된다). */
export function fallbackReason(item: Attachment, hasPdfEngine: boolean): UnviewableReason {
  if (item.unviewable) return item.unviewable;
  if (!item.src) return 'failed';
  if (item.kind === 'pdf' && !hasPdfEngine) return 'unsupported';
  return 'unsupported';
}

/**
 * 확대 단계 — 자유 배율을 안 연다(헌법 5). 맞춤/실제/2배 셋이면 문서 확인에 충분하다.
 * 여기 둔 이유: 첨부 뷰어 둘과 **장표 뷰어**가 같은 어휘를 쓴다. 배율의 *실제 값*은 각 뷰어가 정한다
 * (첨부는 pdf.js 렌더 배율, 장표는 A4 캔버스 배율 — 같은 단어가 다른 수를 가리킨다).
 */
export type ZoomStep = 'fit' | 'actual' | 'double';

/** 단계 순환 — 버튼 하나로 돌린다. 세 뷰어에 그대로 복제돼 있던 것을 여기로 모은다. */
export const ZOOM_NEXT: Record<ZoomStep, ZoomStep> = { fit: 'actual', actual: 'double', double: 'fit' };
