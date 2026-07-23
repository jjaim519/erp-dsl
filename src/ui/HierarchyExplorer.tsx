'use client';
// HierarchyExplorer (템플릿) — 계층(디렉토리) 기반 마스터-디테일 표준. 멘탈모델: Unity Hierarchy / Figma Layers / VSCode Explorer.
//  · 페이지 템플릿(ListPage·DetailPage 동급): Container wide + 고정 PageHeader + 단일 elevated 카드(좌/우 구획).
//    "AppShell + PageHeader 모든 화면 고정"을 구조로 보장 — 페이지 파일은 데이터·콜백만 주입. (카드 안은 수직 경계로 좌/우, 카드 2개 아님.)
//  · 좌: Tree(디렉토리 탐색·수정, 고정폭) + **분류 헤더 아래 전역 검색 바**(dev 박물관과 동형 — 검색은 트리 옆에 산다).
//    우: 선택된 디렉토리의 [하위 디렉토리 타일] + [직속 제품 목록]을 함께 표시 / 검색 중이면 결과 리스팅(각 결과에 경로). 가변폭.
//  · **한 디렉토리는 하위 디렉토리(분류)와 직속 제품을 동시에 가질 수 있다** — 잎/폴더 이분법 없음. 디렉토리를 고르면 둘 다 본다.
//  · 추가는 우측 헤더의 ＋ 드롭다운(제품 추가 / 분류 추가) 한 곳 — 좌측 트리 헤더 ＋(최상위 디렉토리)와 같은 글리프. 트리 케밥엔 이름변경·삭제만.
//  · 고정 높이 위젯 + 패널 내부 스크롤 → 펼침/접힘에 카드 크기 불변(jitter 0). scrollbar-gutter로 스크롤바 폭 변동 차단. (페이지네이션 없음 — 목록은 스크롤.)
//  · 순수 표현 — 데이터·렌더는 닫힌 스키마 주입, 모든 쓰기·선택은 콜백 위임. 추가(제품·분류)는 완전 위임(소비처가 모달로 이름/정보 입력).
//  · 불변식: 제품은 정확히 한 디렉토리 / 직속만(하위 끌어올림 없음) / 단일 트리·단일 스코프.
import type { ReactNode } from 'react';
import { Card } from './Card';
import { Page } from './Page';
import { Stack } from './Stack';
import { Group } from './Group';
import { Text } from './Text';
import { EmptyState } from './EmptyState';
import { SectionHeader } from './SectionHeader';
import { PageHeader, type HeaderMeta } from './PageHeader';
import { Breadcrumb } from './Breadcrumb';
import { Tree, type TreeNodeData } from './Tree';
import type { ObjectField } from './ObjectCard';
import { DataTable, type DataTableColumn, type DataTableRow } from './DataTable';
import { InputGroup } from './InputGroup';
import { TextInput } from './TextInput';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import type { Action, BadgeColor } from './_cells';

// 선택 노드의 조상 경로(자신 포함) — 우측 브레드크럼용.
function findPath(nodes: TreeNodeData[], id: string): TreeNodeData[] {
  for (const n of nodes) {
    if (n.id === id) return [n];
    if (n.children) {
      const sub = findPath(n.children, id);
      if (sub.length) return [n, ...sub];
    }
  }
  return [];
}

export type HierarchyObject = {
  id: string;
  title: string;
  subtitle?: string;
  status?: { label: string; tone: BadgeColor };
  thumbnail?: string;
  icon?: IconName;
  headline?: ObjectField;
  attributes?: ObjectField[];
  actions?: Action[];
  onClick?: () => void;
};

// 전역 검색 결과 = 제품 + 그것이 속한 디렉토리 경로(루트→집, 마지막=집 디렉토리).
//  불변식상 제품은 한 디렉토리에만 속하므로 결과 중복은 0 — 동명 결과는 경로(조상)로 구분한다.
export type HierarchySearchResult = HierarchyObject & {
  path: { id: string; label: string }[];
};

type Props = {
  // 페이지 헤더(고정) — PageHeader 현재 구조 그대로. AppShell 아래 모든 화면 공통 정체성 밴드.
  title: string;
  description?: string;
  status?: { label: string; tone: BadgeColor };
  actions?: Action[];
  // 좌: 디렉토리 트리 (controlled)
  nodes: TreeNodeData[];
  selectedId?: string | null;
  expandedIds: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  treeTitle?: string;
  editable?: boolean;
  onAddRoot?: (label: string) => void;   // 최상위(level1) 디렉토리 — 트리 헤더 ＋(제자리 인라인 입력)
  onRename?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  // 우: 선택된 디렉토리의 직속 제품(소비처가 직속만 주입). 디렉토리는 하위 분류 + 직속 제품 공존 가능.
  selectedLabel?: string;
  objects: HierarchyObject[];
  // 추가(우측 헤더 ＋ 드롭다운) — 둘 다 완전 위임(소비처가 모달로 이름/정보 입력). selectedId는 controlled라 parentId로 넘긴다.
  onAddObject?: () => void;                 // 제품 추가
  onAddChild?: (parentId: string) => void;  // 분류(하위 디렉토리) 추가 — level2 이상은 여기로(트리 케밥 아님)
  // 전역 검색 (controlled — 필터의 진실은 소비처). onSearchChange 주면 좌측 분류 헤더 아래 검색 바 노출,
  //  쿼리 있으면 우측이 결과 리스팅 모드로 전환(각 결과에 경로 Breadcrumb).
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchResults?: HierarchySearchResult[];
};

const EXPLORER_HEIGHT = '70vh'; // 잠정 vh — 고정 높이 위젯(펼침/접힘에 카드 크기 불변). Modal 85vh 선례와 동류 명시 예외.
const LEFT_WIDTH = 280;          // Explorer 좌측 고정폭(Unity/VSCode 관습) — 비율이 아니라 고정이라 내용 변동에도 폭 불변.
const PANE = { overflowY: 'auto', scrollbarGutter: 'stable' } as const; // 스크롤바 자리 미리 확보 → 폭 jitter 차단.
// 폴더(하위 분류) 타일 그리드 — 행당 5분할(타일 1칸씩). 제품 목록 위에 깔린다(같은 본문 스크롤).
const FOLDER_GRID = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'var(--mantine-spacing-md)', alignItems: 'start' } as const;

export function HierarchyExplorer(props: Props) {
  const {
    title, description, status, actions,
    nodes, selectedId, expandedIds, onSelect, onToggle, treeTitle, editable,
    onAddRoot, onRename, onDelete,
    selectedLabel, objects, onAddObject, onAddChild,
    searchQuery, onSearchChange, searchResults,
  } = props;

  // 우측 패널 탐색(폴더 타일·브레드크럼·검색결과)에서 노드로 점프 — 좌측 트리에서 그 노드가 보이도록
  //  경로 상 접힌 조상을 자동으로 펼친 뒤 선택. onToggle은 *접힌 것만*(현재 expandedIds 기준) 펼친다
  //  (이미 펼친 노드는 안 건드림 — 토글이라 그냥 부르면 접혀버리므로 가드). 펼침 상태 주인은 소비처(controlled).
  const navigateTo = (id: string) => {
    findPath(nodes, id).forEach((n) => {
      if (n.children && n.children.length > 0 && !expandedIds.includes(n.id)) onToggle(n.id);
    });
    onSelect(id);
  };

  // '목록' 뷰 — 역할 슬롯을 가로 컬럼으로 펼친 DataTable(비교·스캔). **최대한 간결(한 줄/행)**: 이미지·코드 없음,
  //  제품명 · (검색 시)분류 경로 · 핵심값(headline) · 비고(headline.note 배지) · 상태 · 디스클로저(›)만. 행 전체 클릭=onClick(상세).
  //  · 수정·삭제 등 행 액션은 *상세 모달 안*에서 한다 — 목록엔 별도 케밥 메뉴를 두지 않고, 끝의 › 는 "이 행은 상세로 간다"는
  //    시각적 장치일 뿐(자체 동작 없음, 클릭은 행으로 버블). 행/케밥이 각자 따로 동작하던 것을 단일 진입(상세)으로 통일.
  //  paths를 주면(검색 결과) '분류' 컬럼에 "분류 › 하위분류 › …" 경로를 그린다(제품이 어디 사는지). 헤더는 stickyHeader로 고정.
  const listView = (objs: HierarchyObject[], paths?: Record<string, string>) => {
    const withHeadline = objs.find((o) => o.headline)?.headline;
    const badgeColors = objs.reduce<Record<string, BadgeColor>>((m, o) => {
      if (o.status) m[o.status.label] = o.status.tone;
      return m;
    }, {});
    // headline.note(값-국소 상태 배지, 예: '변경요청중') → '비고' 컬럼. 카드 뷰의 '값 옆 배지'를 표에선 별도 배지 컬럼으로.
    const noteColors = objs.reduce<Record<string, BadgeColor>>((m, o) => {
      if (o.headline?.note) m[o.headline.note.label] = o.headline.note.tone;
      return m;
    }, {});
    const clickable = objs.some((o) => o.onClick);
    // 열 폭: 제품명(generic)은 grow(남은 폭 채우고 길면 … 말줄임) → 이름 길이로 열이 재배치되지 않는다.
    //  단가/비고/상태는 *내용 맞춤*(table-layout auto) — 단가는 headline.label로 도메인이 주입하는 값이라 폭을 부품이 박지 않는다.
    //  분류 경로(검색)만 maxWidth 상한(길면 말줄임). 도메인 특화 폭 하드코딩 0.
    const columns: DataTableColumn[] = [
      { key: '_name', label: '제품', type: 'text', grow: true },
    ];
    if (paths) columns.push({ key: '_path', label: '분류', type: 'text', maxWidth: 240 });
    if (withHeadline) columns.push({ key: '_metric', label: withHeadline.label, type: withHeadline.type });
    if (objs.some((o) => o.headline?.note)) columns.push({ key: '_note', label: '비고', type: 'badge', badgeColors: noteColors });
    if (objs.some((o) => o.status)) columns.push({ key: '_status', label: '상태', type: 'badge', badgeColors });
    if (clickable) columns.push({ key: '_more', label: '', type: 'chevron' });
    const rows: DataTableRow[] = objs.map((o) => ({
      id: o.id,
      _name: o.title,
      _path: paths?.[o.id],
      _metric: o.headline?.value,
      _note: o.headline?.note?.label,
      _status: o.status?.label,
      _more: !!o.onClick,
    }));
    return (
      <DataTable columns={columns} rows={rows} stickyHeader
        onRowClick={clickable ? (row) => objs.find((o) => o.id === row.id)?.onClick?.() : undefined} />
    );
  };

  // 하위 분류 타일 — 폴더 아이콘 + 라벨. 클릭=드릴다운. 행당 5분할(1칸). 라벨은 한 줄 말줄임(…)으로 타일 높이 통일
  //  (Text 원자는 truncate 미노출 → 격리 구역에서 typo 토큰으로 직접, Tree 라벨 선례 동형). 전체 텍스트는 title 호버.
  const folderTile = (c: TreeNodeData) => (
    <div key={c.id} onClick={() => navigateTo(c.id)} style={{ cursor: 'pointer', minWidth: 0 }}>
      <Card variant="outlined" padding="sm">
        <Group gap="sm" align="center" wrap={false}>
          <span style={{ display: 'inline-flex', flexShrink: 0 }}><Icon name={c.icon ?? 'folder'} size="lg" color="secondary" /></span>
          <div title={c.label} style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 'var(--typo-body-size)', fontWeight: 'var(--typo-body-strong-weight)', lineHeight: 'var(--typo-body-lh)', color: 'var(--text-primary)' }}>{c.label}</div>
        </Group>
      </Card>
    </div>
  );

  // 분류 헤더 아래 검색 바(좌측 패널) — 트리를 관통하는 행위라 트리 옆이 정합(dev 박물관과 동형). 입력 폭/높이는 트리 행과 통일.
  const searchBar = onSearchChange ? (
    <InputGroup leftAddon={<Icon name="search" size="sm" />}>
      <TextInput size="sm" value={searchQuery ?? ''} onChange={onSearchChange} placeholder="전체 제품 검색" />
    </InputGroup>
  ) : undefined;

  // 우측 패널 = [헤더 바(브레드크럼/제목 + ＋추가 드롭다운, 고정)] / [본문 스크롤(하위 타일 + 제품 목록)].
  //  검색 입력은 좌측 분류 헤더 아래에 산다. 쿼리 있으면 우측이 결과 리스팅으로 전환.
  const right = () => {
    const searching = !!onSearchChange && (searchQuery ?? '').trim() !== '';
    const path = selectedId != null ? findPath(nodes, selectedId) : [];
    const selectedNode = path.length ? path[path.length - 1] : undefined;

    // ＋ 추가 드롭다운(제품/분류) — editable + 디렉토리 선택 시 헤더 우측에 항상. 빈/채움 무관(EmptyState CTA와 배타: 추가는 헤더 한 곳).
    const addItems: Action[] = [];
    if (editable && onAddObject) addItems.push({ label: '제품 추가', icon: 'box', onClick: onAddObject });
    if (editable && onAddChild && selectedId != null) addItems.push({ label: '분류 추가', icon: 'folder', onClick: () => onAddChild(selectedId) });
    const addMenu = addItems.length > 0
      ? <Menu trigger={<IconButton icon="plus" label="제품·분류 추가" variant="primary" size="sm" />} items={addItems} />
      : undefined;

    let headerTitleNode: ReactNode;
    let headerTitle: string | undefined;
    let headerControls: ReactNode;   // 헤더 우측 고정 슬롯(＋추가 / 검색 건수) — 폭이 변해도 좌측 제목·구분선이 안 밀린다.
    let bodyNode: ReactNode;

    if (searching) {
      // 검색 모드: 결과를 목록으로(분류 경로 컬럼 = "분류 › 하위분류 › …"). 행 클릭=onClick(상세). 중복은 불변식상 0.
      const results = searchResults ?? [];
      headerTitle = '검색 결과';
      headerControls = <Text variant="caption" color="secondary">{`${results.length}건`}</Text>;
      bodyNode = results.length === 0
        ? <EmptyState icon="search" title="검색 결과가 없습니다" description={`‘${searchQuery}’와(과) 일치하는 제품이 없습니다.`} />
        : listView(results, Object.fromEntries(results.map((r) => [r.id, r.path.map((p) => p.label).join(' › ')])));
    } else if (selectedId == null) {
      // 미선택: 헤더 비고, 본문은 가운데 안내.
      bodyNode = <div style={{ margin: 'auto' }}><EmptyState icon="folder" title="디렉토리를 선택하세요" description="왼쪽 트리에서 디렉토리를 고르면 분류와 제품이 표시됩니다." /></div>;
    } else {
      // 디렉토리 선택: 헤더 = 브레드크럼 + ＋추가. 본문 = [하위 분류 타일] + [직속 제품 목록](둘 다 가능). 모두 없으면 빈상태.
      const crumbs = path.length
        ? path.map((n) => ({ label: n.label, onClick: () => navigateTo(n.id) }))
        : [{ label: selectedLabel ?? '제품' }];
      headerTitleNode = <Breadcrumb items={crumbs} />;
      headerControls = addMenu;
      const children = selectedNode?.children ?? [];
      const hasChildren = children.length > 0;
      const hasProducts = objects.length > 0;
      bodyNode = hasChildren || hasProducts
        ? (
          <Stack gap="md">
            {hasChildren && <div style={{ ...FOLDER_GRID, paddingTop: 'var(--mantine-spacing-md)' }}>{children.map((c) => folderTile(c))}</div>}
            {hasProducts && listView(objects)}
          </Stack>
        )
        : editable
          ? <EmptyState icon="box" title="비어 있습니다" description="오른쪽 위 ＋에서 제품 또는 분류를 추가하세요." />
          : <EmptyState icon="box" title="등록된 항목이 없습니다" />;
    }

    return (
      <>
        {/* 헤더 바(고정) — 좌: 브레드크럼/제목 / 우: ＋추가 드롭다운(제품/분류) 또는 검색 건수. */}
        <div style={{ flexShrink: 0, padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0' }}>
          <SectionHeader titleNode={headerTitleNode} title={headerTitle} controls={headerControls} divider />
        </div>
        {/* 본문(스크롤) — 헤더 아래 하위 타일 + 제품 목록(또는 빈상태)이 한 영역에서 스크롤(목록 헤더는 sticky).
            상단 패딩 0 → 목록 sticky 헤더가 본문 맨 위에 *유격 없이* 핀(패딩이 있으면 그 틈으로 스크롤 행이 비친다). 좌우·하단만 패딩. */}
        <div style={{ flex: 1, minHeight: 0, padding: '0 var(--mantine-spacing-md) var(--mantine-spacing-md)', ...PANE }}>
          {bodyNode}
        </div>
      </>
    );
  };

  const headerMeta: HeaderMeta[] = [];
  if (status) headerMeta.push({ kind: 'badge', label: status.label, tone: status.tone });
  if (description) headerMeta.push({ kind: 'text', label: description });

  return (
    // 페이지 템플릿: Page(1200 캡) + 고정 PageHeader + 단일 elevated 카드(좌/우 구획).
    <Page>
      <Stack gap="lg">
        <PageHeader title={title} meta={headerMeta} actions={actions} />
        <Card variant="elevated" padding="none">
          <div style={{ display: 'flex', alignItems: 'stretch', height: EXPLORER_HEIGHT }}>
            {/* 좌: 고정폭 트리 패널, 내부 스크롤. 검색 바는 Tree의 '분류' 헤더 아래(toolbar 슬롯)에 들어간다.
                트리 케밥은 이름변경·삭제만 — 최상위 추가는 헤더 ＋, 하위(분류) 추가는 우측 ＋ 드롭다운. */}
            <div style={{ width: LEFT_WIDTH, flexShrink: 0, padding: 'var(--mantine-spacing-md)', ...PANE }}>
              <Tree
                nodes={nodes} selectedId={selectedId} expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle}
                title={treeTitle ?? '디렉토리'} editable={editable}
                onAddRoot={onAddRoot} onRename={onRename} onDelete={onDelete}
                toolbar={searchBar}
              />
            </div>
            {/* 우: 가변폭 제품 영역. 스크롤은 내부 "본문"이 소유(헤더는 고정).
                패딩도 각 구간이 직접 가져 좌측 패널 헤더와 세로 시작점을 맞춘다. */}
            <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {right()}
            </div>
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
