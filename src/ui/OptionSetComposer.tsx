'use client';
// OptionSetComposer — 구성 위젯(부착 상위 면): 좌=구성 트리 저작, 우=부착·순서 + 조립 미리보기(Picker 내장).
//  · OptionSetEditor와 동형 골격(optionset-shared 공용) — "좌측에서 구조, 우측에서 내용"을 한 번 배우면 둘 다 쓴다.
//  · 모델(업계 검증 — Square 동형): 옵션 정의는 라이브러리(참조), 부착·순서는 노드의 속성. 정의 수정은 여기서 못 한다 —
//    행 클릭/편집 ↗ = onEditOption(소비처가 편집기 화면으로 라우팅). 편집기를 빌더 안에 중복 내장하지 않는다(확정).
//  · 트리: kind 'branch'=묶기 전용(쉐브론·클릭=펼침/접힘·부착 불가) / 'leaf'=부착 단위(▪마크·클릭=우측 열기·루트 직결 가능).
//    깊이 제한 없음. 타이포 균일 — 종류=글리프, 깊이=들여쓰기(위계 표현 채널 규칙).
//  · 저작: 루트 추가=하단 아웃라인 버튼 2개, 자식 추가=branch 행 hover ＋(기본=대상)·⋯(그룹/대상 선택), 이름=⋯ 인라인,
//    ⠿=형제 간 순서(소속 이동 드래그는 백로그). 삭제=확인 팝오버(하위 대상·부착 수 고지).
//  · 노드 종류 문구는 소비처 교체 가능(labels prop — 부품 기본값 '그룹'/'대상', 도메인 무지).
//  · 미리보기 소계: 부품의 표시 산술 예외(§6 — 저장 경로 없는 미리보기 한정 합산). 실계산은 소비처 파이프라인.
import { useEffect, useRef, useState } from 'react';
import type { OptionGroup, OptionNode, OptionSelection } from './optionset';
import { OptionSetPicker } from './OptionSetPicker';
import { DotsGlyph, MarkGlyph, PlusGlyph, TreeRow, TypeIcon, usePopDismiss, useRowDrag } from './optionset-shared';
import './optionset.css';

type Props = {
  nodes: OptionNode[];                          // 구성 트리(controlled — 부착·순서 포함 전부 이 데이터)
  onNodesChange: (nodes: OptionNode[]) => void;
  library: OptionGroup[];                       // 옵션 정의 전체(부착 후보·렌더 소스) — 여기선 읽기만
  /** 부착 행 클릭·편집 ↗ — 소비처가 편집기 화면으로 라우팅(해당 옵션이 선택된 상태로) */
  onEditOption?: (groupId: string) => void;
  /** 부착 팝오버의 "새 옵션 만들기" — 소비처가 정의 생성+부착+라우팅을 배선. 미지정 시 항목 미노출 */
  onCreateOption?: (nodeId: string) => void;
  selectedId?: string;                          // controlled 선택(leaf) — 미지정 시 내부 상태
  onSelect?: (nodeId: string) => void;
  labels?: { branch?: string; leaf?: string };  // 노드 종류 표시 문구(기본 '그룹'/'대상')
  title?: string;                               // 좌측 pane 제목(기본 '구성')
  readOnly?: boolean;
};

const uid = () => 'on' + Math.random().toString(36).slice(2, 9);
const fmtWon = (n: number) => '₩' + n.toLocaleString('ko-KR');

/* 트리 유틸 — 불변 변형(controlled) */
type Found = { node: OptionNode; parent: OptionNode | null; sibs: OptionNode[]; path: string[] };
function findNode(nodes: OptionNode[], id: string): Found | null {
  const walk = (list: OptionNode[], parent: OptionNode | null, path: string[]): Found | null => {
    for (const n of list) {
      const p = [...path, n.label || '이름 없음'];
      if (n.id === id) return { node: n, parent, sibs: list, path: p };
      if (n.children?.length) {
        const r = walk(n.children, n, p);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(nodes, null, []);
}
function mapTree(nodes: OptionNode[], fn: (n: OptionNode) => OptionNode | null): OptionNode[] {
  const out: OptionNode[] = [];
  for (const n of nodes) {
    const m = fn(n);
    if (m == null) continue;
    out.push(m.children?.length || n.children?.length
      ? { ...m, children: mapTree(m.children ?? [], fn) }
      : m);
  }
  return out;
}
function allNodes(nodes: OptionNode[]): OptionNode[] {
  const out: OptionNode[] = [];
  const w = (l: OptionNode[]) => l.forEach((n) => { out.push(n); if (n.children?.length) w(n.children); });
  w(nodes);
  return out;
}
function firstLeaf(nodes: OptionNode[]): OptionNode | null {
  for (const n of allNodes(nodes)) if (n.kind === 'leaf') return n;
  return null;
}
function descLeafCount(n: OptionNode): number {
  return allNodes(n.children ?? []).filter((x) => x.kind === 'leaf').length;
}

const EMPTY_SEL: OptionSelection = { picked: {}, qty: {}, nums: {} };

export function OptionSetComposer({
  nodes, onNodesChange, library, onEditOption, onCreateOption,
  selectedId, onSelect, labels, title, readOnly,
}: Props) {
  const L = { branch: labels?.branch ?? '그룹', leaf: labels?.leaf ?? '대상' };
  const [innerSel, setInnerSel] = useState<string | null>(firstLeaf(nodes)?.id ?? null);
  const selId = selectedId !== undefined ? selectedId : innerSel;
  const select = (id: string) => { if (onSelect) onSelect(id); if (selectedId === undefined) setInnerSel(id); };
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [pop, setPop] = useState<null | { kind: 'menu'; id: string; confirm?: boolean } | { kind: 'attach' }>(null);
  const [pvSel, setPvSel] = useState<Record<string, OptionSelection>>({});   // 미리보기 임시 선택(노드별)
  const dnd = useRowDrag();
  const rootRef = useRef<HTMLDivElement>(null);
  usePopDismiss(!!pop, () => setPop(null));

  const found = selId ? findNode(nodes, selId) : null;
  const cur = found?.node.kind === 'leaf' ? found.node : null;
  useEffect(() => {
    if (!cur && selectedId === undefined) {
      const f = firstLeaf(nodes);
      if (f && f.id !== innerSel) setInnerSel(f.id);
    }
  }, [nodes, cur, innerSel, selectedId]);

  const G = (id: string) => library.find((g) => g.id === id) ?? null;
  const usedIn = (gid: string) => allNodes(nodes).filter((n) => n.attach.includes(gid)).map((n) => n.label || '이름 없음');

  const patchNode = (id: string, patch: Partial<OptionNode>) =>
    onNodesChange(mapTree(nodes, (n) => (n.id === id ? { ...n, ...patch } : n)));
  const addChild = (parentId: string | null, kind: OptionNode['kind']) => {
    const nn: OptionNode = { id: uid(), label: '', kind, attach: [], children: [] };
    if (parentId == null) onNodesChange([...nodes, nn]);
    else {
      onNodesChange(mapTree(nodes, (n) => (n.id === parentId ? { ...n, children: [...(n.children ?? []), nn] } : n)));
      setClosed((s) => ({ ...s, [parentId]: false }));
    }
    if (kind === 'leaf') select(nn.id);
    setRenaming(nn.id);
    setPop(null);
  };
  const removeNode = (id: string) => onNodesChange(mapTree(nodes, (n) => (n.id === id ? null : n)));

  /* ═══ 좌: 구성 트리 ═══ */
  const nodeMenu = (n: OptionNode) => {
    if (pop?.kind !== 'menu' || pop.id !== n.id) return null;
    const att = n.kind === 'leaf' ? n.attach.length : 0;
    const kids = n.kind === 'branch' ? descLeafCount(n) : 0;
    return (
      <div className="erpOS-pop erpOS-npop" data-os-pop>
        {!pop.confirm ? (
          <>
            <button type="button" className="erpOS-popIt plain" onClick={() => { setPop(null); setRenaming(n.id); }}>이름 변경</button>
            {n.kind === 'branch' && (
              <>
                <button type="button" className="erpOS-popIt plain" onClick={() => addChild(n.id, 'branch')}>하위 {L.branch} 추가</button>
                <button type="button" className="erpOS-popIt plain" onClick={() => addChild(n.id, 'leaf')}>하위 {L.leaf} 추가</button>
              </>
            )}
            <button type="button" className="erpOS-popIt plain danger" onClick={() => setPop({ kind: 'menu', id: n.id, confirm: true })}>삭제</button>
          </>
        ) : (
          <div className="erpOS-confirm">
            <div className="q">정말 삭제할까요?</div>
            <div className="d">
              {n.kind === 'branch'
                ? (kids ? `하위 ${L.leaf} ${kids}개가 함께 사라집니다.` : '되돌릴 수 없습니다.')
                : (att ? `부착 ${att}건이 해제됩니다(옵션 정의는 남습니다).` : '되돌릴 수 없습니다.')}
            </div>
            <div className="btns">
              <button type="button" onClick={() => setPop({ kind: 'menu', id: n.id })}>취소</button>
              <button type="button" className="danger" onClick={() => { removeNode(n.id); setPop(null); }}>삭제</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  const dropOnNode = (target: OptionNode) => dnd.drop((d) => {
    if (d.t !== 'n') return;
    const a = findNode(nodes, d.id);
    const b = findNode(nodes, target.id);
    if (!a || !b || a.sibs !== b.sibs || a.node === b.node) return;   // 형제 간 순서만(소속 이동은 백로그)
    const from = a.sibs.indexOf(a.node), to = a.sibs.indexOf(b.node);
    const next = [...a.sibs];
    const [mv] = next.splice(from, 1);
    next.splice(to, 0, mv);
    if (a.parent) onNodesChange(mapTree(nodes, (n) => (n.id === a.parent!.id ? { ...n, children: next } : n)));
    else onNodesChange(next);
  });
  const treeRows = (list: OptionNode[], depth: number): React.ReactNode[] =>
    list.flatMap((n) => {
      const isBranch = n.kind === 'branch';
      const open = !closed[n.id];
      const row = (
        <TreeRow key={n.id} id={n.id} depth={depth} selected={!isBranch && selId === n.id}
          chevron={isBranch ? (open ? 'open' : 'closed') : null}
          onChevron={() => setClosed((s) => ({ ...s, [n.id]: !s[n.id] }))}
          glyph={isBranch ? undefined : <MarkGlyph />}
          label={n.label} placeholder="이름 없음"
          renaming={renaming === n.id}
          onRenameInput={(v) => patchNode(n.id, { label: v })}
          onRenameDone={() => setRenaming(null)}
          onSelect={() => { if (isBranch) setClosed((s) => ({ ...s, [n.id]: !s[n.id] })); else select(n.id); }}
          onPlus={isBranch && !readOnly ? () => addChild(n.id, 'leaf') : undefined} plusTitle={`하위 ${L.leaf} 추가`}
          onMenu={readOnly ? undefined : () => setPop(pop?.kind === 'menu' && pop.id === n.id ? null : { kind: 'menu', id: n.id })}
          menuOpen={pop?.kind === 'menu' && pop.id === n.id}
          menu={nodeMenu(n)}
          dragProps={{ draggable: true, onDragStart: dnd.start('n', n.id), onDragEnd: dnd.end }}
          rowDragOver={dnd.over((d) => d.t === 'n', n.id)} rowDrop={dropOnNode(n)} />
      );
      return isBranch && open ? [row, ...treeRows(n.children ?? [], depth + 1)] : [row];
    });

  /* ═══ 우: 부착 행 + 부착 팝오버 ═══ */
  const attachedDefs = cur ? cur.attach.map(G).filter((g): g is OptionGroup => !!g) : [];
  const dropOnAttach = (targetGid: string) => dnd.drop((d) => {
    if (d.t !== 'g' || !cur) return;
    const att = [...cur.attach];
    const from = att.indexOf(d.id), to = att.indexOf(targetGid);
    if (from < 0 || to < 0 || from === to) return;
    const [mv] = att.splice(from, 1);
    att.splice(to, 0, mv);
    patchNode(cur.id, { attach: att });
  });
  const attachPop = cur && pop?.kind === 'attach' && (
    <div className="erpOS-pop erpOSC-attpop" data-os-pop>
      {library.map((g) => {
        const on = cur.attach.includes(g.id);
        const use = usedIn(g.id);
        return (
          <button key={g.id} type="button" className="erpOS-popIt plain" disabled={on}
            onClick={() => { patchNode(cur.id, { attach: [...cur.attach, g.id] }); setPop(null); }}>
            <TypeIcon sel={g.selection} />
            <span className={g.label ? '' : 'erpOSC-ph'}>{g.label || '이름 없는 옵션'}</span>
            <span className="erpOSC-end">{on ? <span className="erpOSC-atton">부착됨</span>
              : use.length ? <span className="erpOSC-usechip">공용 {use.length}</span> : null}</span>
          </button>
        );
      })}
      {onCreateOption && (
        <>
          <div className="erpOSC-popsep" />
          <button type="button" className="erpOS-popIt plain" onClick={() => { setPop(null); onCreateOption(cur.id); }}>
            ＋ 새 옵션 만들기
          </button>
        </>
      )}
    </div>
  );
  const attachSurface = cur && (
    <div className="erpOSC-body">
      {attachedDefs.length === 0 && <div className="erpOSE-pvnone">아직 부착된 옵션이 없습니다.</div>}
      {attachedDefs.map((g) => {
        const use = usedIn(g.id);
        return (
          <div key={g.id} className="erpOSC-arow" role="button" tabIndex={0} data-ind={dnd.overId === g.id || undefined}
            onClick={(e) => { if ((e.target as HTMLElement).closest('.erpOSE-grip,button')) return; onEditOption?.(g.id); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditOption?.(g.id); } }}
            onDragOver={dnd.over((d) => d.t === 'g', g.id)} onDrop={dropOnAttach(g.id)}>
            <span className="erpOSE-grip" draggable onDragStart={dnd.start('g', g.id)} onDragEnd={dnd.end} title="끌어서 노출 순서 변경">⠿</span>
            <TypeIcon sel={g.selection} />
            <span className={'erpOSC-aname' + (g.label ? '' : ' ph')}>{g.label || '이름 없는 옵션'}</span>
            {g.required && <span className="erpOSC-req">필수</span>}
            {use.length > 1 && <span className="erpOSC-usechip">공용 {use.length}</span>}
            <span className="grow" />
            <span className="erpOSC-aacts">
              {onEditOption && <button type="button" onClick={() => onEditOption(g.id)}>편집 ↗</button>}
              {!readOnly && (
                <button type="button" title="부착 해제"
                  onClick={() => patchNode(cur.id, { attach: cur.attach.filter((x) => x !== g.id) })}>✕</button>
              )}
            </span>
          </div>
        );
      })}
      {!readOnly && (
        <div className="erpOSC-attwrap">
          <button type="button" className="erpOSC-attbtn" data-os-popbtn
            onClick={() => setPop(pop?.kind === 'attach' ? null : { kind: 'attach' })}>＋ 옵션 부착</button>
          {attachPop}
        </div>
      )}
    </div>
  );

  /* ═══ 미리보기 — Picker 통째 내장(조립 결과가 실물 그대로. 소계=미리보기 한정 표시 산술) ═══ */
  const pv = cur ? pvSel[cur.id] ?? EMPTY_SEL : EMPTY_SEL;
  const setPv = (patch: Partial<OptionSelection>) =>
    cur && setPvSel((s) => ({ ...s, [cur.id]: { ...(s[cur.id] ?? EMPTY_SEL), ...patch } }));
  const pvSubtotal = attachedDefs.reduce((sum, g) => {
    if (g.selection === 'single') {
      const c = (g.choices ?? []).find((x) => x.code === pv.picked[g.id]);
      return sum + (c?.amount ?? 0);
    }
    if (g.selection === 'multi') {
      const codes = pv.pickedMany?.[g.id] ?? [];
      return sum + (g.choices ?? []).filter((c) => codes.includes(c.code)).reduce((a, c) => a + (c.amount ?? 0), 0);
    }
    if (g.selection === 'quantity') {
      return sum + (g.choices ?? []).reduce((a, c) => a + (pv.qty[c.id] ?? 0) * (c.amount ?? 0), 0);
    }
    return sum;
  }, 0);
  const previewSurface = cur && (
    <div className="erpOSC-pv">
      <OptionSetPicker mode="configure"
        title={cur.label || '이름 없음'}
        groups={attachedDefs}
        selection={pv}
        defaultCollapsed="none"
        onPick={(gid, code) => setPv({ picked: { ...pv.picked, [gid]: code } })}
        onPickMany={(gid, codes) => setPv({ pickedMany: { ...(pv.pickedMany ?? {}), [gid]: codes } })}
        onQty={(cid, q) => setPv({ qty: { ...pv.qty, [cid]: q } })}
        onNum={(key, v) => setPv({ nums: { ...pv.nums, [key]: v } })}
        subtotal={pvSubtotal}
        primary={{ label: '담기', onClick: () => { /* 미리보기 — 저장 경로 없음 */ } }} />
    </div>
  );

  const path = found?.path ?? [];
  return (
    <div ref={rootRef} className="erpOSC erpOS-2p" data-readonly={readOnly || undefined}>
      <div className="erpOS-tpane">
        <div className="erpOS-phd"><div className="erpOS-title">{title ?? '구성'}</div></div>
        <div className="erpOS-tbody">
          {treeRows(nodes, 0)}
          {!readOnly && (
            <div className="erpOS-taddrow">
              <button type="button" className="erpOS-tadd" onClick={() => addChild(null, 'branch')}><PlusGlyph /> {L.branch}</button>
              <button type="button" className="erpOS-tadd" onClick={() => addChild(null, 'leaf')}><PlusGlyph /> {L.leaf}</button>
            </div>
          )}
        </div>
      </div>
      <div className="erpOS-mpane">
        <div className="erpOS-phd">
          {cur ? (
            <div className="erpOS-title erpOSC-path">
              {path.length > 1 && <span className="pth">{path.slice(0, -1).join(' › ')} › </span>}
              {path[path.length - 1]}
            </div>
          ) : <div className="erpOS-title">{L.leaf} 없음</div>}
          <span className="grow" />
          {cur && (
            <div className="erpOS-seg">
              <button type="button" data-on={view === 'edit' || undefined} onClick={() => setView('edit')}>편집</button>
              <button type="button" data-on={view === 'preview' || undefined} onClick={() => setView('preview')}>미리보기</button>
            </div>
          )}
        </div>
        {cur
          ? (view === 'edit' ? attachSurface : previewSurface)
          : <div className="erpOSC-body"><div className="erpOSE-pvnone">좌측에서 {L.leaf}을 추가하거나 선택하세요.</div></div>}
      </div>
    </div>
  );
}
