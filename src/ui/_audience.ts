// _audience — 수신자 트리의 *규칙*만 담은 공유 모듈(격리 구역 내부, 부품 아님).
//  데스크탑 BoardWrite와 모바일 MobileBoardWrite가 이 한 벌을 쓴다. 복제하면 같은 데이터가
//  두 화면에서 다르게 담기고(포섭 판정이 갈림) 그건 버그로 읽힌다 — `_calendarLanes.packLanes`와 같은 이유.
//
//  포섭(subsumption): 그룹을 담으면 그 아래는 *이미 포함*이다. 담기는 토큰 하나로 두고(명단 박제 방지 —
//   나중에 팀원이 늘어도 수신 범위가 따라온다), 하위는 '포함됨'으로 표시만 한다.

export type AudienceNode = {
  id: string;
  label: string;
  exclusive?: boolean;                                   // '전체'처럼 단독 선택(다른 선택 해제)
  children?: AudienceNode[];                             // 하위 그룹(팀)
  members?: { id: string; name: string; dept?: string }[]; // 개인
};

/** 행 상태 3종 — covered를 빈 체크로 두면 "안 들어갔다"고 거짓말이 된다(실제론 수신자에 포함). */
export type AudienceRowState = 'added' | 'covered' | 'open';

export type AudienceIndex = {
  labelOf: (id: string) => string;
  /** 이 id가 이미 담긴 조상에 포함되는가 → 그 조상 id(가장 가까운 것부터) */
  coveredBy: (selected: Set<string>, id: string) => string | undefined;
  rowState: (selected: Set<string>, id: string) => AudienceRowState;
  /** 담기 — 배타('전체') 처리 + 하위 토큰 흡수까지. 무동작이면 null. */
  add: (selected: Set<string>, id: string) => string[] | null;
  /** 아직 안 담긴 최상위 제안만(빠른 추가 목록) */
  remaining: (selected: Set<string>) => AudienceNode[];
};

export function buildAudienceIndex(top: AudienceNode[]): AudienceIndex {
  const label = new Map<string, string>();
  const parent = new Map<string, string>();
  const exclusiveIds = new Set(top.filter((n) => n.exclusive).map((n) => n.id));

  const walk = (nodes: AudienceNode[], p?: string) => nodes.forEach((n) => {
    label.set(n.id, n.label);
    if (p) parent.set(n.id, p);
    if (n.children) walk(n.children, n.id);
    n.members?.forEach((m) => {
      label.set(m.id, m.dept ? `${m.name} · ${m.dept}` : m.name);
      parent.set(m.id, n.id);
    });
  });
  walk(top);

  const ancestorsOf = (id: string) => {
    const out: string[] = [];
    for (let p = parent.get(id); p; p = parent.get(p)) out.push(p);
    return out;
  };
  const coveredBy = (sel: Set<string>, id: string) => ancestorsOf(id).find((a) => sel.has(a));

  return {
    labelOf: (id) => label.get(id) ?? id,
    coveredBy,
    rowState: (sel, id) => (sel.has(id) ? 'added' : coveredBy(sel, id) ? 'covered' : 'open'),
    add: (sel, id) => {
      if (sel.has(id) || coveredBy(sel, id)) return null;              // 이미 담겼거나 조상에 포함 → 무동작
      if (exclusiveIds.has(id)) return [id];                            // '전체'는 배타 — 나머지를 비운다
      const next = new Set(sel);
      exclusiveIds.forEach((e) => next.delete(e));
      [...next].forEach((s) => { if (ancestorsOf(s).includes(id)) next.delete(s); });  // 포섭 정리: 하위 흡수
      next.add(id);
      return [...next];
    },
    remaining: (sel) => top.filter((n) => !sel.has(n.id)),
  };
}
