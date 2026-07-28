'use client';
// Tree (유기체) — 재귀 계층 표시. 펼침/접힘 + 선택 강조 + 노드 ⋯메뉴(이름변경·삭제) + 제자리 편집.
//  · controlled: 선택(selectedId)·펼침(expandedIds)·쓰기(onAdd*/onRename/onDelete) 전부 콜백 위임(순수 표현).
//  · 편집 UI(어느 노드를 제자리 입력 중인가)만 Tree 내부 ephemeral 상태. 확정/취소로 콜백 호출.
//  · 깊이 = VS Code식 들여쓰기 가이드 직선(꺽쇠 앞 세로선). 선택 강조는 full-width지만 가이드선으로 깊이가 항상 보임.
//  · DnD 없음 / 더블·우클릭 편집 없음(⋯ 메뉴로만) / 보기 전용 모드(editable=false → ⋯·추가 숨김).
import { Fragment, useState, type ReactNode } from 'react';
import { Stack } from './Stack';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import { SectionHeader } from './SectionHeader';

// icon은 옵션 — 기본 아이콘 없음(라벨만). 필요 시 노드별로 지정(rule of three).
export type TreeNodeData = { id: string; label: string; icon?: IconName; children?: TreeNodeData[] };

type Props = {
  nodes: TreeNodeData[];
  selectedId?: string | null;
  expandedIds: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  title?: string;
  /** false = 헤더 미렌더(title·onAddRoot 무시) — 소비처가 자체 sticky 헤더를 소유할 때(R2 §6-4). 기본 true. */
  header?: boolean;
  /** true = 위젯 자체 내부 패딩(md) — 라운드+overflow:hidden 컨테이너에 단독으로 넣을 때(R2 §6-2). 기본 false(행동 보존). */
  padded?: boolean;
  editable?: boolean;
  onAddRoot?: (label: string) => void;   // 최상위(level1) 디렉토리만 — 헤더 ＋. 하위(분류) 추가는 Tree 밖(예: HierarchyExplorer 우측 ＋ 드롭다운).
  onRename?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  toolbar?: ReactNode;   // 헤더 바로 아래 슬롯(예: HierarchyExplorer 검색 바). 미지정이면 없음.
};

const INDENT = 16;
// 행 높이 고정 — ⋮ 메뉴(IconButton sm) 유무로 행 높이가 달라지면 이름변경 시 상하 이동이 생긴다.
// 두 모드(노드/인라인 입력) 모두 동일 고정 높이라 모드 전환에 레이아웃 시프트 0.
const ROW_H = 36;

export function Tree({
  nodes, selectedId, expandedIds, onSelect, onToggle,
  title, header = true, padded = false, editable = false, onAddRoot, onRename, onDelete, toolbar,
}: Props) {
  const expanded = new Set(expandedIds);
  const [editing, setEditing] = useState<{ mode: 'rename' | 'addRoot'; id?: string } | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (n: TreeNodeData) => { setEditing({ mode: 'rename', id: n.id }); setDraft(n.label); };
  const startAddRoot = () => { setEditing({ mode: 'addRoot' }); setDraft(''); };
  const cancel = () => setEditing(null);
  const confirm = () => {
    if (!editing) return;            // Enter→unmount→blur 중복 호출 가드(Esc 취소 후 blur도 무효화)
    const v = draft.trim();
    if (v) {
      if (editing.mode === 'rename' && editing.id) onRename?.(editing.id, v);
      else if (editing.mode === 'addRoot') onAddRoot?.(v);
    }
    setEditing(null);
  };

  // 깊이별 세로 가이드선(VS Code식). 행이 붙어 있어(컨테이너 gap 0) 세그먼트가 연속선으로 이어진다.
  const guides = (depth: number) =>
    Array.from({ length: depth }).map((_, i) => (
      <span key={i} style={{ width: INDENT, flexShrink: 0, alignSelf: 'stretch', borderLeft: '1px solid var(--border-default)' }} />
    ));

  // VS Code식 제자리 인라인 편집 — 그 자리에 노드 모양(가이드선+꺽쇠칸)으로 입력. Enter=확정 / Esc=취소 / blur=확정.
  //  · **컴포넌트(<InlineRow/>)가 아니라 함수 호출**로 둔다 — 컴포넌트로 두면 매 렌더 타입이 새로 생겨 input이
  //    글자마다 remount(포커스·크기 흔들림). 함수면 같은 위치에서 재사용돼 remount 0.
  //  · 폭은 가용 영역을 채우는 고정폭(flex) — size(글자 수) 기반은 타이핑 중 폭이 변해 제외. 패널(닫힌 280)엔 영향 0.
  // 버튼 클릭 시 input의 blur(=confirm)가 먼저 터져 취소가 확정으로 둔갑하는 것을 막는다 —
  //  mousedown에서 preventDefault하면 포커스가 input에 남아 blur가 안 일어나고, 이어서 onClick의 실제 동작만 돈다.
  const holdFocus = (e: React.MouseEvent) => e.preventDefault();
  // 컴팩트 버튼(20px, controls.css .erpTreeEditBtn) — sm IconButton(36px)은 행(ROW_H 36)을 꽉 채워 링이 넘쳐
  //  편집 행이 아래 행보다 미세하게 높아진다. 작은 커스텀 버튼이라야 행 높이가 아래 행과 픽셀 동일.
  const editBtn = (icon: IconName, label: string, onClick: () => void) => (
    <button type="button" aria-label={label} className="erpTreeEditBtn" onMouseDown={holdFocus} onClick={onClick}>
      <Icon name={icon} size="sm" color="secondary" />
    </button>
  );
  // 스타일은 controls.css(.erpTreeEdit) — 입력칸 모양 래퍼 안에 [입력 | 취소 ✕ | 확인 ✓]. 행 높이 ROW_H로 아래 행과 픽셀 동일.
  const renderInline = (depth: number) => (
    <div style={{ display: 'flex', alignItems: 'center', height: ROW_H, paddingLeft: 8, paddingRight: 8 }}>
      {guides(depth)}
      <span style={{ width: 16, flexShrink: 0 }} />
      <div className="erpTreeEdit">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onFocus={(e) => e.currentTarget.select()}    /* 이름 변경 시 기존 값 전체 선택(바로 덮어쓰기) */
          onKeyDown={(e) => { if (e.key === 'Enter') confirm(); else if (e.key === 'Escape') cancel(); }}
          onBlur={confirm}
        />
        {/* 취소 → 확인 순(우측). flexShrink:0이라 텍스트가 길어도 버튼은 안 밀리고 input이 내부 스크롤. */}
        {editBtn('x', '취소', cancel)}
        {editBtn('check', '확인', confirm)}
      </div>
    </div>
  );

  const renderNodes = (list: TreeNodeData[], depth: number): React.ReactNode =>
    list.map((node) => {
      const hasChildren = !!node.children && node.children.length > 0;
      const isOpen = expanded.has(node.id);
      const isSel = selectedId === node.id;
      const isRenaming = editing?.mode === 'rename' && editing.id === node.id;
      return (
        <Fragment key={node.id}>
          {isRenaming ? (
            renderInline(depth)
          ) : (
            <div
              onClick={() => onSelect(node.id)}
              style={{
                display: 'flex', alignItems: 'center', height: ROW_H,
                paddingLeft: 8, paddingRight: 8, cursor: 'pointer',
                background: isSel ? 'var(--mantine-color-primary-0)' : 'transparent',
              }}
            >
              {guides(depth)}
              {hasChildren ? (
                <span onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} style={{ display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }}>
                  <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size="sm" color="secondary" />
                </span>
              ) : (
                <span style={{ width: 16, flexShrink: 0 }} />
              )}
              {node.icon && <span style={{ display: 'inline-flex', flexShrink: 0, marginLeft: 4 }}><Icon name={node.icon} size="sm" color="secondary" /></span>}
              {/* 라벨 = 한 줄 말줄임(…) — 길면 ROW_H(고정) 안에서 잘리고 줄바꿈 안 함(겹침 차단, VS Code식·Breadcrumb 선례).
                  Text 원자는 truncate를 안 노출 → 격리 구역에서 role 변수로 직접(타이포 통로 동일). 전체 텍스트는 title 호버. */}
              <div
                title={node.label}
                style={{
                  flex: 1, minWidth: 0, marginLeft: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontSize: 'var(--typo-body-size)',
                  fontWeight: `var(${isSel ? '--typo-body-strong-weight' : '--typo-body-weight'})`,
                  lineHeight: 'var(--typo-body-lh)',
                  color: 'var(--text-primary)',
                }}
              >
                {node.label}
              </div>
              {editable && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <Menu
                    trigger={<IconButton icon="dots-vertical" label="메뉴" variant="ghost" size="sm" />}
                    items={[
                      { label: '이름 변경', icon: 'edit', onClick: () => startRename(node) },
                      { label: '삭제', icon: 'trash', variant: 'danger', onClick: () => onDelete?.(node.id) },
                    ]}
                  />
                </span>
              )}
            </div>
          )}
          {isOpen && hasChildren && renderNodes(node.children!, depth + 1)}
        </Fragment>
      );
    });

  const body = (
    <Stack gap="xs">
      {header && (title || editable) && (
        // 헤더 제목을 노드 라벨 x축(행 패딩 8 + 꺽쇠칸 16 + 여백 4 = 28)에 정렬 — 소비처 NBSP 땜질 제거(R2 §6-3)
        <div style={{ paddingLeft: 28 }}>
          <SectionHeader
            title={title ?? '디렉토리'}
            divider
            actions={editable ? [{ label: '최상위 디렉토리 추가', icon: 'plus', iconOnly: true, onClick: startAddRoot }] : undefined}
          />
        </div>
      )}
      {/* 헤더 바로 아래 슬롯(검색 바 등) — 헤더와 노드 사이. */}
      {toolbar}
      {/* 노드 컨테이너 gap 0 → 가이드선 세그먼트가 행 사이 끊김 없이 연속. */}
      <div>
        {/* 최상위 추가 입력은 헤더 바로 밑(상단, + 버튼 근처) — 아래 누적 아님. */}
        {editing?.mode === 'addRoot' && renderInline(0)}
        {renderNodes(nodes, 0)}
      </div>
    </Stack>
  );
  // padded — 라운드+overflow:hidden 컨테이너 단독 배치용 내부 여백(R2 §6-2: 모서리 클리핑 방지). 기본 off(행동 보존).
  return padded ? <div style={{ padding: 'var(--mantine-spacing-md)' }}>{body}</div> : body;
}
