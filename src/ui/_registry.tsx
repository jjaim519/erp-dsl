'use client';
// ─────────────────────────────────────────────────────────────────────────
// _registry — 부품별 라이브 예시 단일 출처. <Demo name="Button"/>로 어디서든 렌더.
//  · 손으로 짠 갤러리(_DevAtomGallery 등)를 흡수 — 부품 추가 시 여기 한 곳만 늘린다.
//  · 박물관 부품 상세(/dev/part/[name])가 이걸 쓴다. (JSX는 직렬화 불가라 데이터(_catalog)와 분리.)
//  · dev 전용(publish 제외).
// ─────────────────────────────────────────────────────────────────────────
import { useState, type ReactNode } from 'react';
import { Stack } from './Stack';
import { Group } from './Group';
import { Grid } from './Grid';
import { Card } from './Card';
import { Divider } from './Divider';
import { Title } from './Title';
import { Text } from './Text';
import { Badge } from './Badge';
import { StatusLabel } from './StatusLabel';
import { CountBadge } from './CountBadge';
import { Button } from './Button';
import { Chip } from './Chip';
import { Label } from './Label';
import { Anchor } from './Anchor';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { Image } from './Image';
import { Tooltip } from './Tooltip';
import { Popover } from './Popover';
import { Spinner } from './Spinner';
import { SegmentedControl } from './SegmentedControl';
import { TabBar } from './TabBar';
import { TextInput } from './TextInput';
import { PasswordInput } from './PasswordInput';
import { NumberInput } from './NumberInput';
import { CurrencyInput } from './CurrencyInput';
import { NumberStepper } from './NumberStepper';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { DatePicker } from './DatePicker';
import { MultiDatePicker } from './MultiDatePicker';
import { DateRangePicker } from './DateRangePicker';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';
import { Radio } from './Radio';
import { FormField } from './FormField';
import { MultiSelect } from './MultiSelect';
import { DateRangeField } from './DateRangeField';
import { InputGroup } from './InputGroup';
import { FileUploader, type FileItem } from './FileUploader';
import { fmtCurrency, type BadgeColor } from './_cells';
import { Pagination } from './Pagination';
import { IconButton } from './IconButton';
import { Callout } from './Callout';
import { StatusRow } from './StatusRow';
import { SummaryCard } from './SummaryCard';
import { TotalRow } from './TotalRow';
import { Collapsible } from './Collapsible';
import { Modal } from './Modal';
import { DataTable, type DataTableSort } from './DataTable';
import { DataSheet, type SheetRow } from './DataSheet';
import { LineItemList, type LineItem } from './LineItemList';
import { QueueList, type QueueItem } from './QueueList';
import { Money } from './Money';
import { RegisterWidget, type RegisterEntry } from './RegisterWidget';
import { AgingReportWidget, type AgingBucket, type AgingRow } from './AgingReportWidget';
import { PaymentApplyWidget, type ApplyLine } from './PaymentApplyWidget';
import { OpenItemListWidget, type OpenItem } from './OpenItemListWidget';
import { DecisionPanel } from './DecisionPanel';
import { NoteThread, type ThreadNote } from './NoteThread';
import type { Attachment, AttachmentKind } from './_attachment';
import { ListDetail } from './ListDetail';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';
import { DescriptionList } from './DescriptionList';
import { Timeline } from './Timeline';
import { Calendar } from './Calendar';
import { FormSection } from './FormSection';
import { Menu } from './Menu';
import { ObjectCard } from './ObjectCard';
import { Tree, type TreeNodeData } from './Tree';
import { FieldGrid } from './FieldGrid';
import { HierarchyExplorer, type HierarchyObject } from './HierarchyExplorer';
import { HierarchyCollector, type CollectorCartItem } from './HierarchyCollector';
import { PeriodNavigator } from './PeriodNavigator';
import { LedgerPage } from './LedgerPage';
import { CalendarPage, type CalendarEncoding, type CalendarEvent, type CalendarAnnotation, type CalendarColorRole } from './CalendarPage';
import { BoardList, type BoardPost } from './BoardList';
import { BoardView, type BoardComment } from './BoardView';
import { BoardWrite, type AudienceNode } from './BoardWrite';
import { Editor } from './Editor';
import { RichText } from './RichText';
import { SectionHeader } from './SectionHeader';
import { Breadcrumb } from './Breadcrumb';
import { Bento } from './Bento';
import { PageShell } from './PageShell';
import { Accordion } from './Accordion';
import { Drawer } from './Drawer';
import { PaperModal } from './PaperModal';
import { PaperDoc } from './PaperDoc';
import { PaperSheet } from './PaperSheet';
import { PaperFlow, PaperKeep } from './PaperFlow';
import { DocModal } from './DocModal';
import type { PaperSpec } from '../schema/paper';
import { Skeleton } from './Skeleton';
import { Combobox } from './Combobox';
import { Progress } from './Progress';
import { TimePicker } from './TimePicker';
import { Stat } from './Stat';
import { Stepper } from './Stepper';
import { ListWidget, type ListColumn, type ListRow } from './ListWidget';
import { NotificationPanel, type NotifItem } from './NotificationPanel';
import { Repeater } from './Repeater';
import { InheritedValueField } from './InheritedValueField';
import { ExpressionField, type ExprVariable } from './ExpressionField';
import { KeyValueField } from './KeyValueField';
import { OptionSetEditor } from './OptionSetEditor';
import { OptionSetComposer } from './OptionSetComposer';
import { OptionSetPicker } from './OptionSetPicker';
import { CompositionOutline } from './CompositionOutline';
import type { OptionGroup, OptionSelection, OptionNode } from './optionset';
import { AssignPicker } from './AssignPicker';
import { Transfer } from './Transfer';
import { TreeSelect } from './TreeSelect';
import { Cascader } from './Cascader';
import { MillerColumns } from './MillerColumns';
import { SearchToolbar } from './SearchToolbar';
import { notify } from './notify';

// 큐·결정 계열 데모 데이터 — 도메인은 문자열로만 들어온다(부품은 'B2C'가 뭔지 모른다).
const QUEUE_ITEMS: QueueItem[] = [
  { id: 'q1', mark: { label: 'B2C', weight: 'quiet' }, title: '아크로 서울포레스트 D동 2201호',
    meta: [{ text: '9일째', tone: 'danger', icon: 'alert-triangle' }] },
  { id: 'q2', mark: { label: '중점', weight: 'solid' }, title: '롯데캐슬 시그니처 중앙 205동',
    meta: [{ text: '₩18,420,000', tone: 'strong' }, { text: '4일째', tone: 'warning' }] },
  { id: 'q3', mark: { label: 'B2B', weight: 'outline' }, title: '반포 래미안 원베일리 302동',
    meta: [{ text: '—' }, { text: '2일째' }] },
  { id: 'q4', mark: { label: 'B2C', weight: 'quiet' }, title: '윤소라', titleMuted: '· 현장 미정',
    meta: [{ text: '오늘' }] },
];
const BRANCH_ITEMS: QueueItem[] = [
  { id: 'a', title: 'A안', meta: [{ text: '도면 3' }, { text: '₩18,420,000', tone: 'strong' }] },
  { id: 'b', title: 'B안', meta: [{ text: '도면 1' }, { text: '견적 없음' }] },
  { id: 'c', title: 'C안', meta: [{ text: '도면 4' }, { text: '₩24,100,000', tone: 'strong' }],
    badge: { label: '계약', color: 'success' }, disabled: true },
];

const opts = [
  { label: '합판', value: 'plywood' },
  { label: 'MDF', value: 'mdf' },
  { label: '집성목', value: 'glulam' },
];

// HierarchyCollector 데모 데이터(kk 철물) — 6 카탈로그(칩 넘침 디버그) · 2~3층 트리(depth 디버그) · 다수 제품(스크롤 디버그).
const COLLECTOR_CATALOGS = [
  { id: 'sub', label: '부자재', tree: [
    { id: 'hinge', label: '경첩', children: [{ id: 'spring', label: '스프링' }, { id: 'slide', label: '슬라이드' }, { id: 'damper', label: '댐퍼' }] },
    { id: 'handle', label: '손잡이', children: [{ id: 'lever', label: '레버' }, { id: 'bar', label: '바' }, { id: 'knob', label: '노브' }] },
    { id: 'rail', label: '레일', children: [{ id: 'ball', label: '볼레일' }, { id: 'under', label: '언더레일' }] },
  ] },
  { id: 'raw', label: '원자재', tree: [{ id: 'ply', label: '합판' }, { id: 'mdf', label: 'MDF' }, { id: 'glulam', label: '집성목' }] },
  { id: 'tool', label: '공구', tree: [{ id: 'power', label: '전동공구' }, { id: 'hand', label: '수공구' }] },
  { id: 'fin', label: '완제품', tree: [{ id: 'door', label: '도어' }, { id: 'drawer', label: '서랍장' }] },
  { id: 'cons', label: '소모품', tree: [{ id: 'sand', label: '사포' }, { id: 'bond', label: '본드' }] },
  { id: 'pack', label: '포장재', tree: [{ id: 'box', label: '박스' }, { id: 'cushion', label: '완충재' }] },
];
const COLLECTOR_PRODUCTS = [
  // 부자재 › 경첩 (p1~p4 = depth-2 path, p5~p9 = 경첩 직속) — 9개로 목록 스크롤 디버그
  { id: 'p1', catalog: 'sub', path: ['hinge', 'spring'], group: '경첩', label: '스프링경첩 35mm', sublabel: '경첩 › 스프링 · 105°', amount: 800 },
  { id: 'p2', catalog: 'sub', path: ['hinge', 'spring'], group: '경첩', label: '스프링경첩 40mm', sublabel: '경첩 › 스프링 · 90°', amount: 900 },
  { id: 'p3', catalog: 'sub', path: ['hinge', 'slide'], group: '경첩', label: '슬라이드경첩 35mm', sublabel: '경첩 › 슬라이드 · 풀오버레이', amount: 1500 },
  { id: 'p4', catalog: 'sub', path: ['hinge', 'damper'], group: '경첩', label: '댐퍼경첩', sublabel: '경첩 › 댐퍼 · 소프트클로즈', amount: 3200 },
  { id: 'p5', catalog: 'sub', path: ['hinge'], group: '경첩', label: '헤비듀티경첩 50mm', sublabel: '경첩 · 내하중 STS', amount: 2400 },
  { id: 'p6', catalog: 'sub', path: ['hinge'], group: '경첩', label: '평경첩 소', sublabel: '경첩 · 64mm 황동', amount: 600 },
  { id: 'p7', catalog: 'sub', path: ['hinge'], group: '경첩', label: '평경첩 대', sublabel: '경첩 · 89mm 황동', amount: 900 },
  { id: 'p8', catalog: 'sub', path: ['hinge'], group: '경첩', label: '유리경첩', sublabel: '경첩 · 무타공', amount: 2800 },
  { id: 'p9', catalog: 'sub', path: ['hinge'], group: '경첩', label: '피아노경첩', sublabel: '경첩 · 1.8m', amount: 5400 },
  // 부자재 › 손잡이 / 레일 (다중 그룹 — 카트 그룹 헤더 디버그)
  { id: 'p10', catalog: 'sub', path: ['handle', 'lever'], group: '손잡이', label: '레버 손잡이', sublabel: '손잡이 › 레버 · 알루미늄', amount: 4500 },
  { id: 'p11', catalog: 'sub', path: ['handle', 'bar'], group: '손잡이', label: '바 손잡이 320', sublabel: '손잡이 › 바 · 320mm STS', amount: 3800 },
  { id: 'p12', catalog: 'sub', path: ['handle', 'knob'], group: '손잡이', label: '노브 손잡이', sublabel: '손잡이 › 노브', amount: 1200 },
  { id: 'p13', catalog: 'sub', path: ['rail', 'ball'], group: '레일', label: '볼레일 450', sublabel: '레일 › 볼 · 풀확장', amount: 6200 },
  { id: 'p14', catalog: 'sub', path: ['rail', 'under'], group: '레일', label: '언더레일 400', sublabel: '레일 › 언더 · 소프트', amount: 7400 },
  // 다른 카탈로그(카트 카탈로그 토글 디버그)
  { id: 'p15', catalog: 'raw', path: ['ply'], group: '합판', label: '합판 18T', sublabel: '합판 · 1220×2440', amount: 28000 },
  { id: 'p16', catalog: 'raw', path: ['ply'], group: '합판', label: '합판 15T', sublabel: '합판 · 1220×2440', amount: 24000 },
  { id: 'p17', catalog: 'raw', path: ['mdf'], group: 'MDF', label: 'MDF 15T', sublabel: 'MDF · 1220×2440', amount: 13000 },
  { id: 'p18', catalog: 'tool', path: ['power'], group: '전동공구', label: '충전 드릴 18V', sublabel: '전동공구 · 브러시리스', amount: 89000 },
  { id: 'p19', catalog: 'tool', path: ['hand'], group: '수공구', label: '고무망치', sublabel: '수공구', amount: 7000 },
  { id: 'p20', catalog: 'cons', path: ['sand'], group: '사포', label: '사포 #220', sublabel: '소모품 · 10매', amount: 3000 },
];

const CASC_OPTS = [
  { value: 'seoul', label: '서울', children: [
    { value: 'gangnam', label: '강남구', children: [{ value: 'samsung', label: '삼성동' }, { value: 'yeoksam', label: '역삼동' }] },
    { value: 'mapo', label: '마포구', children: [{ value: 'hapjeong', label: '합정동' }] },
  ] },
  { value: 'gyeonggi', label: '경기', children: [{ value: 'seongnam', label: '성남시', children: [{ value: 'pangyo', label: '판교' }] }] },
];
// 깊은 경로(완료 브레드크럼 말줄임 검증용) — kk 철물 도메인 6단 체인. 좁은 셀에 넣어 잘림 처리를 본다.
const MCOL_DEEP = [
  { value: 'furn', label: '가구철물', children: [
    { value: 'handle', label: '손잡이', children: [
      { value: 'bar', label: '바형 손잡이', children: [
        { value: 'sus', label: '스테인리스', children: [
          { value: 'nickel', label: '니켈무광', children: [
            { value: 'spec1', label: '349 * 2150' },
            { value: 'spec2', label: '288 * 1800' },
          ] },
        ] },
      ] },
    ] },
  ] },
];
const XFER_ITEMS = [
  { value: 'plywood', label: '합판' }, { value: 'mdf', label: 'MDF' }, { value: 'glulam', label: '집성목' },
  { value: 'veneer', label: '베니어' }, { value: 'osb', label: 'OSB' },
];

function Box({ children }: { children?: ReactNode }) {
  return (
    <div style={{ background: 'var(--mantine-color-primary-1)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--mantine-radius-xs)', textAlign: 'center', fontSize: 13 }}>
      {children ?? '·'}
    </div>
  );
}

// 비포/애프터 — 부품 정형화 시 '기존 ↔ 수정안'을 같은 탭에서 나란히 본다(삭제 전 검증용).
//  좌: 현행(땜빵/직접 조립) · 우: 신규 부품 적용. dev 전용 비교 슬롯.
function BeforeAfter({ before, after }: { before: ReactNode; after: ReactNode }) {
  const col = (tag: string, tone: 'neutral' | 'success', node: ReactNode) => (
    <div style={{ flex: 1, minWidth: 280 }}>
      <Stack gap="xs">
        <Group gap="xs" align="center"><Badge color={tone}>{tag}</Badge></Group>
        <Card variant="outlined" padding="md">{node}</Card>
      </Stack>
    </div>
  );
  return (
    <Group gap="lg" align="start" wrap>
      {col('기존', 'neutral', before)}
      {col('수정안', 'success', after)}
    </Group>
  );
}

// kk ERP 도메인(철물/부자재) — 캡쳐의 '경첩'처럼 최하위 분류에 제품을 등록한다. 더미 양 늘려 폴더 타일(4분할)·목록 스크롤 확인용.
const SAMPLE_TREE: TreeNodeData[] = [
  { id: 'd1', label: '부자재', children: [
    { id: 'd1-1', label: '경첩' },
    { id: 'd1-2', label: '손잡이' },
    { id: 'd1-3', label: '레일' },
    { id: 'd1-4', label: '브라켓' },
    { id: 'd1-5', label: '댐퍼' },
    { id: 'd1-6', label: '자석·캐치' },
    { id: 'd1-7', label: '볼트·너트' },
    { id: 'd1-8', label: '타카·핀' },
    { id: 'd1-9', label: '경첩 액세서리' },
  ] },
  { id: 'd2', label: '거래처', children: [
    { id: 'd2-1', label: '동양철물' },
    { id: 'd2-2', label: '세양하드웨어' },
    { id: 'd2-3', label: '대한철물' },
    { id: 'd2-4', label: '광성특수' },
  ] },
  { id: 'd3', label: '공구', children: [
    { id: 'd3-1', label: '전동공구' },
    { id: 'd3-2', label: '수공구' },
    { id: 'd3-3', label: '측정공구' },
  ] },
  { id: 'd4', label: '소모품', children: [
    { id: 'd4-1', label: '접착·실란트' },
    { id: 'd4-2', label: '연마재' },
  ] },
];

// viewBox 필수 — 없으면 컨테이너 비율로 SVG가 늘어나(반응형 스케일 불가) 미디어 밴드에서 찌그러진다.
const IMG_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" width="120" height="90"><rect width="120" height="90" fill="#3b5ba5"/><text x="60" y="50" fill="#fff" font-size="14" text-anchor="middle">IMG</text></svg>');

// HierarchyExplorer 데모 데이터(kk ERP 철물/부자재) — 잎별 오브젝트 + 경로(검색 결과용).
//  역할 슬롯: 썸네일 없으면 폴백 아이콘 / status=상태 배지 / headline=핵심값 1개 / attributes=보조(상세 뷰만).
//  ※ 단위는 *데이터 층*에서 단가 뒤에 합성("₩3,200 / 개") — 한 칸 차지할 값이 아니다. ObjectCard(DSL)는 단위를
//    모른다(완성된 텍스트만 받음). 그래서 type:'text'. 단가 합성은 fmtCurrency로 통화 포맷 단일출처 유지.
const won = (n: number, unit: string) => `${fmtCurrency(n)} / ${unit}`;

// ListWidget 데모 데이터 — 제네릭(도메인 무관). 정렬·검색·facet(상태)·페이징·선택·행버튼(actions)·align override(코드=center) 검증.
const LW_STATUS: Record<string, BadgeColor> = { 진행중: 'info', 대기: 'warning', 완료: 'success', 보류: 'neutral' };
const LW_COLUMNS: ListColumn[] = [
  { key: 'name', label: '항목명', type: 'text', sortable: true },
  { key: 'status', label: '상태', type: 'badge', filter: 'facet', badgeColors: LW_STATUS },
  { key: 'owner', label: '담당자', type: 'user' },
  { key: 'code', label: '코드', type: 'text', align: 'center' },
  { key: 'amount', label: '금액', type: 'currency', sortable: true },
  { key: 'progress', label: '진행률', type: 'percent' },
  { key: 'updatedAt', label: '갱신일', type: 'date', sortable: true },
  { key: 'tags', label: '태그', type: 'tags' },
  { key: 'act', label: '', type: 'actions' },
];
const LW_OWNERS = ['정민수', '한지영', '오세라', '김도현', '이보람'];
const LW_STATES = ['진행중', '대기', '완료', '보류'];
const LW_TAGSETS = [['우선'], ['재검토'], ['우선', '방문'], [], ['보류중']];
const LW_ROWS: ListRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(1000 + i),
  name: `레코드 A-${1042 - i}`,
  status: LW_STATES[i % LW_STATES.length],
  owner: { name: LW_OWNERS[i % LW_OWNERS.length] },
  code: `C${String((i * 7) % 100).padStart(2, '0')}`,
  amount: 1_000_000 + (i * 731_000) % 14_000_000,
  progress: (i * 17) % 101,
  updatedAt: `2026-07-${String(28 - (i % 20)).padStart(2, '0')}`,
  tags: LW_TAGSETS[i % LW_TAGSETS.length],
  act: [
    { label: '보기', variant: 'ghost', icon: 'external-link', iconOnly: true, onClick: () => notify.info('보기') },
    { label: '삭제', variant: 'ghost', icon: 'trash', iconOnly: true, onClick: () => notify.danger('삭제 요청') },
  ],
}));
// 알림 패널 데모 — 도메인-제네릭 ERP 알림. tone·title·actor·time·group만(패키지 도메인 무지).
const NOTIF_ITEMS: NotifItem[] = [
  { id: '1', tone: 'success', title: '발주 #1024 승인 요청이 도착했습니다', actor: '이수연', time: '5분 전', group: '오늘' },
  { id: '2', tone: 'warning', title: '경첩 35mm 재고가 안전재고 이하로 떨어졌습니다', actor: '시스템', time: '22분 전', group: '오늘' },
  { id: '3', tone: 'info', title: '6월 정산 마감이 내일입니다', actor: '시스템', time: '1시간 전', group: '오늘' },
  { id: '4', tone: 'success', title: 'A현장 납품이 완료 처리되었습니다', actor: '김병준', time: '3시간 전', read: true, group: '이번 주' },
  { id: '5', tone: 'danger', title: '발주 #1019가 반려되었습니다', actor: '박준호', time: '어제', read: true, group: '이번 주' },
];
// Repeater 데모 — 도메인-제네릭 레코드(부품은 '옵션'을 모름 · 소비처 주입 예시).
const REP_DEMO: { variable: string; label: string; kind: string; tone: BadgeColor }[] = [
  { variable: 'hinge', label: '경첩', kind: 'appliance', tone: 'info' },
  { variable: 'door_spec', label: '도어', kind: 'required · 특수', tone: 'warning' },
  { variable: 'handle', label: '손잡이', kind: 'optional', tone: 'neutral' },
];
// InheritedValueField 데모 — SSOT 아이템(도메인-제네릭 부자재 단가).
const IVF_REFS = [
  { id: 'i1', label: '일반 힌지 3인치', price: 1800, unit: 'EA' },
  { id: 'i2', label: '소프트힌지 3인치', price: 3200, unit: 'EA' },
  { id: 'i3', label: '수납형 힌지', price: 5400, unit: 'EA' },
];
// ExpressionField 데모 — 변수(소비처 주입) + 코드 리터럴 대조용 values. 상태 있어 타이핑·팔레트 삽입·검증 라이브.
const EXPR_VARS: ExprVariable[] = [
  { path: 'dimensions.width_mm', group: '치수' },
  { path: 'dimensions.height_mm', group: '치수' },
  { path: 'options.hinge', group: '옵션', values: [{ code: 'soft', label: '소프트클로징' }, { code: 'std', label: '일반' }] },
];
function ExprFieldDemo() {
  const [v, setV] = useState("CEIL(dimensions.width_mm / 600) * IF(options.hinge == 'soft', 2, 1)");
  return <div style={{ maxWidth: 520 }}><ExpressionField value={v} onChange={setV} variables={EXPR_VARS} /></div>;
}
// KeyValueField 데모 — 품목 dimensions 변수집합에서 키 주입. 값은 부호 있는 델타.
const KV_KEYS = [{ key: 'width_mm' }, { key: 'height_mm' }, { key: 'depth_mm' }];

// ── 문서 계열 데모 — 실전 서식은 엑셀에서 변환하지만(`npx erp-paper-import`), 박물관은 배포되는
//  파일이라 바깥 JSON을 물 수 없어 여기 손으로 적는다. 그래서 «손으로 적는 서식»의 본보기도 겸한다.
//  선 소유권을 지킨 채(각 칸은 자기 위·왼쪽) 표 바깥만 굵게 — 격자·선·반복·묶음 걸침이 다 들어 있다.
//  로고는 data URI다 — 박물관은 배포되는 파일이라 바깥 자산을 물 수 없고, 인쇄에서 원격 이미지는
//  로드를 안 기다려 종이에서 빠질 수 있다(소비처에도 같은 이유로 data URI·동일 출처를 권한다).
const PAPER_DEMO_LOGO = '';
const PAPER_DEMO_SPEC: PaperSpec = {
  id: 'demo-order', name: '발주서', columns: 24, orientation: 'portrait', pageRows: 31,
  images: ['발행처로고'],
  fields: [
    { name: '거래처', label: '거래처', type: 'text' },
    { name: '납기', label: '납기', type: 'date' },
  ],
  arrays: [{ name: '품목', label: '품목', of: [
    { name: '분류', label: '분류', type: 'text' },
    { name: '이름', label: '품목', type: 'text' },
    { name: '수량', label: '수량', type: 'number' },
  ] }],
  bands: [
    { kind: 'columnHeader', r1: 3, r2: 3 },
    { kind: 'repeat', r1: 4, r2: 4, source: '품목' },
  ],
  cells: [
    { r: 0, c: 0, cs: 5, image: '발행처로고' },
    { r: 0, c: 5, cs: 14, text: '발 주 서', align: 'center', typo: 'display' },
    { r: 1, c: 0, cs: 4, text: '거래처', align: 'center', fill: 'shade', border: ['r'], borderStrong: ['t', 'l', 'b'] },
    { r: 1, c: 4, cs: 8, field: '거래처', border: ['r', 'l'], borderStrong: ['t', 'b'] },
    { r: 1, c: 12, cs: 4, text: '납기', align: 'center', fill: 'shade', border: ['r', 'l'], borderStrong: ['t', 'b'] },
    { r: 1, c: 16, cs: 8, field: '납기', format: 'date', border: ['l'], borderStrong: ['t', 'r', 'b'] },
    // 열 머리 — 쪽이 넘어가면 다시 그려진다(band: columnHeader).
    { r: 3, c: 0, cs: 5, text: '분류', align: 'center', fill: 'shade', border: ['r', 'b'], borderStrong: ['t', 'l'] },
    { r: 3, c: 5, cs: 14, text: '품목', align: 'center', fill: 'shade', border: ['r', 'b', 'l'], borderStrong: ['t'] },
    { r: 3, c: 19, cs: 5, text: '수량', align: 'center', fill: 'shade', border: ['b', 'l'], borderStrong: ['t', 'r'] },
    // 반복 한 줄 — 「분류」는 `scope: 'group'`이라 값이 같은 줄끼리 **세로로 걸친다**.
    //  아래 굵은 선은 «표 전체의 바닥»으로 읽혀 마지막 줄에만 찍힌다(줄마다 복제되지 않는다).
    { r: 4, c: 0, cs: 5, field: '품목.분류', scope: 'group', align: 'center', border: ['t', 'r'], borderStrong: ['l', 'b'] },
    { r: 4, c: 5, cs: 14, field: '품목.이름', border: ['t', 'r', 'l'], borderStrong: ['b'] },
    { r: 4, c: 19, cs: 5, field: '품목.수량', align: 'end', border: ['t', 'l'], borderStrong: ['r', 'b'] },
  ],
};
const PAPER_DEMO_VALUES: Record<string, unknown> = {
  발행처로고: PAPER_DEMO_LOGO,
  거래처: '대성건설 ㈜', 납기: '2026-09-04',
  품목: [
    { 분류: '경첩', 이름: '15T 댐퍼', 수량: 12 },
    { 분류: '경첩', 이름: '18T 댐퍼', 수량: 8 },
    { 분류: '경첩', 이름: '15T 무댐퍼', 수량: 4 },
    { 분류: '레일', 이름: '3단 언더레일 450', 수량: 6 },
    { 분류: '손잡이', 이름: '알루미늄 바 320', 수량: 10 },
  ],
};
function KVFieldDemo() {
  const [v, setV] = useState<Record<string, number>>({ width_mm: 30, height_mm: -12 });
  return <div style={{ maxWidth: 420 }}><KeyValueField keys={KV_KEYS} value={v} onChange={setV} valueType="number" addLabel="보정 추가" /></div>;
}
// ── OptionSet 계열 데모 — §5 제2 도메인 시험(피자 주문). 이 데이터로 서면 도메인 무지 통과가 상시 증명된다.
const PIZZA_SET: OptionGroup[] = [
  { id: 'g1', label: '크기', section: '기본', selection: 'number',
    fields: [{ key: 'inch', label: '지름', value: 12, unit: 'in', min: 9, max: 18 }] },
  // 도우 = single 4개 + 값묶음 → cards 기하가 묶음 블록으로 반복된다(F′ — 옛 밴드×2열 상호배타 폐기의 시각 증거)
  { id: 'g2', label: '도우', section: '기본', selection: 'single', required: true,
    choices: [
      { id: 'c1', code: 'thin', label: '씬', group: '클래식', amount: 0 },
      { id: 'c2', code: 'pan', label: '팬', group: '클래식', amount: 2000 },
      { id: 'c7', code: 'cheese', label: '치즈 크러스트', group: '프리미엄', amount: 4000 },
      { id: 'c8', code: 'gold', label: '골드 엣지', group: '프리미엄', amount: 5000 },
    ] },
  // 토핑 = 묶음이 *흩어진* 순서로 온다(실데이터가 그렇다 — 소비처의 정렬 축은 값 순서 하나뿐).
  //  부품이 렌더 직전에 모은다: 밴드는 묶음당 한 번, 첫 등장 순서·묶음 안 순서 유지(bundleBlocks 계약).
  { id: 'g3', label: '토핑', section: '추가', selection: 'quantity',
    choices: [
      { id: 'c3', code: 'pep', label: '페퍼로니', group: '육류', amount: 1500 },
      { id: 'c4', code: 'olive', label: '올리브', group: '채소', amount: 800 },
      { id: 'c5', code: 'bacon', label: '베이컨', group: '육류', amount: 1800 },
      { id: 'c6', code: 'mush', label: '양송이', group: '채소', amount: 700 },
    ] },
];
// 음료 = §5의 "quantity 그룹 하나"(2단 — 개체 층 없음). 값 13개(>AUTO_GRID_MAX) + 값묶음 → 묶음 레이어가 필터 칩으로 전환.
//  마지막 값은 *무묶음*이다 — 그 값에 닿는 통로인 '전체' 칩이 열린다(칩만 있으면 무묶음 값이 화면에서 사라졌던 결함).
const DRINK_SET: OptionGroup[] = [
  { id: 'gd', label: '음료', selection: 'quantity',
    choices: [
      { id: 'dc1', code: 'cola', label: '콜라 1.25L', group: '탄산', amount: 3000, unit: '병' },
      { id: 'dc2', code: 'cider', label: '사이다 1.25L', group: '탄산', amount: 3000, unit: '병' },
      { id: 'dc3', code: 'zero', label: '제로콜라 1.25L', group: '탄산', amount: 3200, unit: '병' },
      { id: 'dc4', code: 'sparkw', label: '탄산수 500ml', group: '탄산', amount: 1800, unit: '병' },
      { id: 'dc5', code: 'lemon', label: '레몬에이드', group: '에이드', amount: 4000, unit: '잔' },
      { id: 'dc6', code: 'grape', label: '청포도에이드', group: '에이드', amount: 4200, unit: '잔' },
      { id: 'dc7', code: 'mojito', label: '무알콜 모히토', group: '에이드', amount: 4800, unit: '잔' },
      { id: 'dc8', code: 'orange', label: '오렌지주스', group: '주스', amount: 3500, unit: '잔' },
      { id: 'dc9', code: 'apple', label: '사과주스', group: '주스', amount: 3500, unit: '잔' },
      { id: 'dc10', code: 'tomato', label: '토마토주스', group: '주스', amount: 3800, unit: '잔' },
      { id: 'dc11', code: 'milkis', label: '밀키스 500ml', group: '탄산', amount: 2200, unit: '병' },
      { id: 'dc12', code: 'water', label: '생수 500ml', group: '주스', amount: 1000, unit: '병' },
      { id: 'dc13', code: 'icetea', label: '아이스티', amount: 2500, unit: '잔' },
    ] },
];
const PIZZA_PRODUCTS = [
  { id: 'p1', label: '마르게리타', sublabel: '토마토 소스 · 바질', base: 12000 },
  { id: 'p2', label: '페퍼로니', sublabel: '더블 페퍼로니', base: 14000 },
];
const EMPTY_SEL: OptionSelection = { picked: {}, qty: {}, nums: {} };
// 데모 금액 파이프라인 — 부품은 계산하지 않으므로 *여기(소비처 역할)*가 계산해 주입한다(§6).
function optAmount(groups: OptionGroup[], sel: OptionSelection): number {
  let sum = 0;
  for (const g of groups) {
    if (g.selection === 'single') sum += g.choices?.find((c) => c.code === sel.picked[g.id])?.amount ?? 0;
    if (g.selection === 'quantity') for (const c of g.choices ?? []) sum += (c.amount ?? 0) * (sel.qty[c.id] ?? 0);
  }
  return sum;
}
// 라인 요약(SpecChip[]→sublabel 접힘과 동형) — 선택값들을 ' · '로 결합.
function optSummary(groups: OptionGroup[], sel: OptionSelection): string | undefined {
  const parts: string[] = [];
  for (const g of groups) {
    if (g.selection === 'single') { const c = g.choices?.find((x) => x.code === sel.picked[g.id]); if (c) parts.push(c.label); }
    if (g.selection === 'quantity') for (const c of g.choices ?? []) { const n = sel.qty[c.id] ?? 0; if (n > 0) parts.push(`${c.label} ${n}`); }
    if (g.selection === 'number') for (const f of g.fields ?? []) { const v = sel.nums[f.key]; if (v != null) parts.push(`${f.label} ${v}${f.unit ?? ''}`); }
  }
  return parts.length ? parts.join(' · ') : undefined;
}
const togglePick = (s: OptionSelection, gid: string, code: string): OptionSelection => {
  const picked = { ...s.picked };
  if (picked[gid] === code) delete picked[gid]; else picked[gid] = code;
  return { ...s, picked };
};

// Editor v2 데모 — §5 도메인 무지 재증명: 피자 데이터에 문구(text)·복수 입력칸(number)·값묶음·hidden까지 전 케이스.
//  usage는 소비처가 부착 데이터에서 계산해 주입하는 사용처 라벨(공용 편집 사고 방지 — 카드에 상시 표시).
const EDITOR_SET: OptionGroup[] = [
  // §2: 저작 면의 직접 단가는 override. amount는 소비처가 계산해 주입하는 표시 유효가(여기선 시늉).
  ...PIZZA_SET.map((g) => ({
    ...g,
    choices: g.choices?.map((c, i) =>
      g.id === 'g3' && i === 0
        ? { ...c, override: undefined, refId: 'r2', amount: 600 }   // 참조 걸린 값 — 금액 칸=흐린 상속가
        : { ...c, override: c.amount }),
  })),
  {
    id: 'eg-size', label: '화덕 굽기', selection: 'number',
    fields: [
      { key: 'ek-temp', label: '온도', value: 420, unit: '°C', min: 380, max: 480, step: 10 },
      { key: 'ek-min', label: '시간', value: 90, unit: '초', min: 60, max: 180, step: 10 },
    ],
  },
  {
    id: 'eg-note', label: '박스 문구', selection: 'text',
    texts: [
      { key: 'et-front', label: '앞면 문구', placeholder: '예: HAPPY BIRTHDAY' },
      { key: 'et-side', label: '옆면 문구', placeholder: '비우면 생략' },
    ],
  },
];
function OptionSetEditorDemo() {
  const [groups, setGroups] = useState<OptionGroup[]>(EDITOR_SET);
  const usage: Record<string, string[]> = {};
  for (const g of EDITOR_SET) usage[g.id] = g.id === 'eg-note' ? [] : g.id.startsWith('eg') ? ['포장 주문'] : ['클래식 피자', '씬 피자'];
  return (
    <div style={{ maxWidth: 760, height: 640 }}>
      <OptionSetEditor groups={groups} onChange={setGroups} usage={usage} title="옵션"
        refOptions={[
          { id: 'r1', label: '수제 도우 원가', price: 1200, unit: '판' },
          { id: 'r2', label: '토핑 원가 A', price: 600 },
          { id: 'r3', label: '토핑 원가 B', price: 900 },
        ]}
        exprVariables={[{ path: 'nums.g1w', group: '수치' }]}
        adjustKeys={[{ key: 'g1w', label: '크기' }]} />
    </div>
  );
}
// Composer 데모 — 동형 2-pane 검증: 트리 저작(그룹/대상)+부착·순서+Picker 내장 조립 미리보기.
//  '클래식/씬'이 '화덕 굽기'를 공용 부착 — 공용 배지·부착 팝오버 표시 확인. 편집 ↗은 소비처 라우팅 몫(데모=무동작).
const COMPOSER_NODES: OptionNode[] = [
  { id: 'nd-pz', label: '피자', kind: 'branch', attach: [], children: [
    { id: 'nd-classic', label: '클래식', kind: 'leaf', attach: ['g2', 'g3', 'eg-size'], children: [] },
    { id: 'nd-thin', label: '씬', kind: 'leaf', attach: ['g2', 'eg-size'], children: [] },
  ] },
  { id: 'nd-drink', label: '음료', kind: 'leaf', attach: ['gd'], children: [] },
];
function OptionSetComposerDemo() {
  const [nodes, setNodes] = useState<OptionNode[]>(COMPOSER_NODES);
  return (
    <div style={{ maxWidth: 980, height: 640 }}>
      <OptionSetComposer nodes={nodes} onNodesChange={setNodes} library={EDITOR_SET}
        onEditOption={() => { /* 소비처 라우팅 몫 — 데모 무동작 */ }} title="구성"
        labels={{ branch: '분류', leaf: '대상' }} />
    </div>
  );
}

function OptionSetPickerDemo() {
  const [sel, setSel] = useState<OptionSelection>({ picked: {}, qty: { c3: 2, c4: 1 }, nums: { inch: 14 } });
  const [qty, setQty] = useState(1);
  return (
    <div style={{ maxWidth: 420, height: 540 }}>
      <OptionSetPicker
        defaultCollapsed="none"   /* 박물관=시각 디버그 — 전부 펼침(실전 기본은 sequential) */
        mode="configure"
        title="마르게리타"
        meta="토마토 소스 · 바질"
        quantity={{ value: qty, onChange: setQty }}
        groups={PIZZA_SET}
        selection={sel}
        display={{ g1: 'input' }}  // 표현 override 예시 — 크기(number)를 스테퍼 대신 타이핑으로. 도우(2개)는 자동 chips.
        onPick={(gid, code) => setSel((s) => togglePick(s, gid, code))}
        onQty={(cid, n) => setSel((s) => ({ ...s, qty: { ...s.qty, [cid]: n } }))}
        onNum={(k, v) => setSel((s) => ({ ...s, nums: { ...s.nums, [k]: v } }))}
        subtotal={(12000 + optAmount(PIZZA_SET, sel)) * qty}
        primary={{ label: '담기', onClick: () => notify.info('담기') }}
        secondary={{ label: '초기화', onClick: () => setSel(EMPTY_SEL) }}
        blockedHint="도우를 선택해야 담을 수 있습니다"
      />
    </div>
  );
}

// 2-pane 조작면 데모 — kk 합의 검증 기준: 지속 2-pane + 양방향 활성 동기화(우측 라인 클릭→좌측 진입 /
// 좌측 편집→우측 실시간). 피자=계층 추가 메뉴에서 하위(개체)까지 선택→곧장 구성 면 / 음료=골라 담는 면(collect 자동).
type ComposeLine = { id: string; section: 'pizza' | 'drink'; label: string; base: number; sel: OptionSelection; qty: number };
type ComposeLeft =
  | { stage: 'idle' }
  | { stage: 'config'; section: 'pizza' | 'drink'; label: string; sublabel?: string; base: number; lineId?: string };

function CompositionDemo() {
  const [lines, setLines] = useState<ComposeLine[]>([]);
  const [left, setLeft] = useState<ComposeLeft>({ stage: 'idle' });
  const [draft, setDraft] = useState<OptionSelection>(EMPTY_SEL);
  const [draftQty, setDraftQty] = useState(1);
  const [seq, setSeq] = useState(1);

  const groupsOf = (sec: 'pizza' | 'drink') => (sec === 'pizza' ? PIZZA_SET : DRINK_SET);
  const lineAmount = (l: ComposeLine) => (l.base + optAmount(groupsOf(l.section), l.sel)) * l.qty;

  const openConfig = (cfg: ComposeLeft, sel: OptionSelection, qty: number) => { setLeft(cfg); setDraft(sel); setDraftQty(qty); };
  // 계층 추가 메뉴 — items 있는 섹션(피자)은 itemId까지 받아 곧장 구성 면, 없는 섹션(음료)은 골라 담는 면.
  const addTo = (sectionId: string, itemId?: string) => {
    if (sectionId === 'pizza') {
      const p = PIZZA_PRODUCTS.find((x) => x.id === itemId) ?? PIZZA_PRODUCTS[0];
      openConfig({ stage: 'config', section: 'pizza', label: p.label, sublabel: p.sublabel, base: p.base }, { picked: {}, qty: {}, nums: { inch: 12 } }, 1);
    } else {
      openConfig({ stage: 'config', section: 'drink', label: '음료', base: 0 }, EMPTY_SEL, 1);
    }
  };
  const selectLine = (lineId: string) => {
    const l = lines.find((x) => x.id === lineId);
    if (l) openConfig({ stage: 'config', section: l.section, label: l.label, base: l.base, lineId }, l.sel, l.qty);
  };
  const commit = () => {
    if (left.stage !== 'config') return;
    if (left.lineId) {
      const id = left.lineId;
      setLines((ls) => ls.map((l) => (l.id === id ? { ...l, sel: draft, qty: draftQty } : l)));
    } else {
      setLines((ls) => [...ls, { id: `L${seq}`, section: left.section, label: left.label, base: left.base, sel: draft, qty: draftQty }]);
      setSeq((n) => n + 1);
    }
    setLeft({ stage: 'idle' });
  };

  const toLine = (l: ComposeLine) => ({
    id: l.id, label: l.label, sublabel: optSummary(groupsOf(l.section), l.sel),
    quantity: l.qty, amount: lineAmount(l),
    active: left.stage === 'config' && left.lineId === l.id,
  });
  const total = lines.reduce((s, l) => s + lineAmount(l), 0);
  const tip = lines.length ? 3000 : 0;

  const picker = left.stage === 'idle' ? (
    <OptionSetPicker mode="idle" placeholder="오른쪽 추가 버튼으로 시작하세요" />
  ) : (
    <OptionSetPicker
      mode="configure"
      title={left.label}
      path={left.section === 'pizza' ? ['피자', left.label] : undefined}
      meta={left.sublabel}
      quantity={left.section === 'pizza' ? { value: draftQty, onChange: setDraftQty } : undefined}  // 담기 면은 헤더 스테퍼 미노출(소비처 선택)
      groups={groupsOf(left.section)}
      selection={draft}
      onPick={(gid, code) => setDraft((s) => togglePick(s, gid, code))}
      onQty={(cid, n) => setDraft((s) => ({ ...s, qty: { ...s.qty, [cid]: n } }))}
      onNum={(k, v) => setDraft((s) => ({ ...s, nums: { ...s.nums, [k]: v } }))}
      subtotal={(left.base + optAmount(groupsOf(left.section), draft)) * draftQty}
      primary={{ label: left.lineId ? '수정 반영' : '담기', onClick: commit }}
      secondary={{ label: '취소', onClick: () => setLeft({ stage: 'idle' }) }}
      blockedHint="필수 그룹을 채워야 담을 수 있습니다"
    />
  );

  return (
    <div style={{ display: 'flex', gap: 16, height: 560, alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 58%', minWidth: 0 }}>{picker}</div>
      <div style={{ flex: '1 1 42%', minWidth: 0 }}>
        <CompositionOutline
          addLabel="구성 추가"
          sections={[
            { id: 'pizza', label: '피자', badge: '구성형',
              items: PIZZA_PRODUCTS.map((p) => ({ id: p.id, label: p.label, sublabel: p.sublabel })),  // 계층 추가 메뉴 드릴
              active: left.stage === 'config' && left.section === 'pizza',
              lines: lines.filter((l) => l.section === 'pizza').map(toLine) },
            { id: 'drink', label: '음료', badge: '담기형',
              active: left.stage === 'config' && left.section === 'drink',
              lines: lines.filter((l) => l.section === 'drink').map(toLine) },
          ]}
          summary={[
            { label: '소계', value: fmtCurrency(total), tone: 'muted' },
            { label: '배달팁', value: fmtCurrency(tip), tone: 'muted', action: { label: '변경', onClick: () => notify.info('배달팁 변경') } },
            { label: '합계', value: fmtCurrency(total + tip), tone: 'grand' },
          ]}
          footer={<Button variant="primary" size="sm" fullWidth onClick={() => notify.info('주문서 저장')}>주문서 저장</Button>}
          onAddToSection={addTo}
          onSelectLine={selectLine}
          onDeleteLine={(id) => setLines((ls) => ls.filter((l) => l.id !== id))}
        />
      </div>
    </div>
  );
}

// 중첩 트리에 자식 노드 추가 / id로 경로(브레드크럼) 찾기 — 데모의 분류 추가·검색 결과 경로용(순수 헬퍼).
function addChildNode(nodes: TreeNodeData[], parentId: string, child: TreeNodeData): TreeNodeData[] {
  return nodes.map((n) =>
    n.id === parentId ? { ...n, children: [...(n.children ?? []), child] }
      : n.children ? { ...n, children: addChildNode(n.children, parentId, child) } : n);
}
function pathOf(nodes: TreeNodeData[], id: string, trail: { id: string; label: string }[] = []): { id: string; label: string }[] | null {
  for (const n of nodes) {
    const t = [...trail, { id: n.id, label: n.label }];
    if (n.id === id) return t;
    if (n.children) { const r = pathOf(n.children, id, t); if (r) return r; }
  }
  return null;
}
// 더미 제품 생성기 — 디렉토리별로 N개를 양산(목록 스크롤 확인용). 상태·비고 배지·단가를 i로 변주해 컬럼이 다 차게.
const HX_STATUSES: HierarchyObject['status'][] = [
  { label: '판매중', tone: 'success' }, { label: '견적대기', tone: 'warning' },
  { label: '신규', tone: 'info' }, { label: '단종', tone: 'danger' }, { label: '판매중', tone: 'success' },
];
const HX_MATERIALS = ['STS304', '아연도금', '알루미늄', '황동', '냉간압연', '고무나무'];
function genProducts(idBase: string, code: string, titlePrefix: string, n: number): HierarchyObject[] {
  return Array.from({ length: n }, (_, i): HierarchyObject => ({
    id: `${idBase}#${i}`,
    title: `${titlePrefix} ${String.fromCharCode(65 + (i % 26))}형 ${i + 1}호`,
    subtitle: `${code}-${String(i + 1).padStart(3, '0')}`,
    icon: 'package',
    status: HX_STATUSES[i % HX_STATUSES.length],
    headline: {
      label: '단가', type: 'text',
      value: i % 7 === 3 ? '견적 필요' : won(1000 + ((i * 437) % 90) * 100, '개'),
      note: i % 6 === 0 ? { label: '변경요청중', tone: 'warning' } : undefined,
    },
    attributes: [
      { label: '규격', value: `${20 + (i % 12) * 5}mm`, type: 'text' },
      { label: '재질', value: HX_MATERIALS[i % HX_MATERIALS.length], type: 'text' },
    ],
    // 행 액션(수정·삭제)은 목록 케밥이 아니라 *상세 모달 안*에서 — 목록 끝은 디스클로저(›)만(상세로 인도하는 시각 장치).
  }));
}
// 디렉토리 id → 직속 제품. 부자재(d1)는 하위 분류 + 직속 제품 공존(잎/폴더 이분법 없음 시연). d2-2 등 일부는 비워 빈상태 확인.
const HX_OBJECTS: Record<string, HierarchyObject[]> = {
  d1: genProducts('d1', 'HW-GEN', '범용 부자재', 7),
  'd1-1': genProducts('d1-1', 'HG', '경첩', 24),
  'd1-2': genProducts('d1-2', 'HD', '손잡이', 16),
  'd1-3': genProducts('d1-3', 'RL', '레일', 13),
  'd1-4': genProducts('d1-4', 'BK', '브라켓', 9),
  'd1-5': genProducts('d1-5', 'DP', '댐퍼', 7),
  'd1-6': genProducts('d1-6', 'MC', '자석캐치', 5),
  'd1-7': genProducts('d1-7', 'BN', '볼트너트', 31),
  'd1-8': genProducts('d1-8', 'TP', '타카핀', 11),
  'd2-1': genProducts('d2-1', 'OY', '동양철물 납품', 8),
  'd2-3': genProducts('d2-3', 'DH', '대한철물 납품', 6),
  'd3-1': genProducts('d3-1', 'PT', '전동공구', 14),
  'd3-2': genProducts('d3-2', 'HT', '수공구', 19),
  'd3-3': genProducts('d3-3', 'MT', '측정공구', 6),
  'd4-1': genProducts('d4-1', 'SL', '실란트', 5),
};

// BoardList 데모 — 게시판 도메인은 dev에만 산다(부품은 0 지식). posts/categories만 주입.
const BOARD_CATEGORIES = [
  { value: 'all', label: '전체' }, { value: 'notice', label: '공지' },
  { value: 'work', label: '업무 안내' }, { value: 'docs', label: '자료실' }, { value: 'free', label: '자유' },
];
const BOARD_POSTS: BoardPost[] = [
  { id: '1', pinned: true, mustRead: true, category: '공지', title: '2026년 하계 휴가 신청 및 근태 처리 안내 — 7/15까지 제출', author: { name: '김서연', dept: '인사' }, date: '06.24', views: 412, attachments: 2, unread: true },
  { id: '2', pinned: true, category: '공지', title: '사내 보안 정책 개정 — VPN 2차 인증 의무화 (8/1 시행)', author: { name: '박지훈', dept: 'IT' }, date: '06.20', views: 388, comments: 7 },
  { id: '3', category: '자료실', title: '2026년 거래처 단가표 v3 배포 (엑셀 첨부)', author: { name: '박상우', dept: '구매' }, date: '06.25', views: 96, attachments: 1, unread: true, isNew: true },
  { id: '4', category: '업무 안내', title: '7월 발주 마감 일정 조정 건 — 각 팀 확인 요망', author: { name: '이지은', dept: '생산' }, date: '06.25', views: 73, comments: 4, unread: true },
  { id: '5', category: '업무 안내', title: '신규 입고 검수 절차 변경 안내', author: { name: '정민호', dept: '물류' }, date: '06.23', views: 154, comments: 2 },
  { id: '6', category: '자료실', title: '제품 카탈로그 PDF 2026 상반기판', author: { name: '한소희', dept: '마케' }, date: '06.22', views: 201, attachments: 3 },
  { id: '7', category: '자유', title: '탕비실 커피머신 교체 관련 의견 받습니다', author: { name: '최유진', dept: '총무' }, date: '06.21', views: 267, comments: 18 },
  { id: '8', category: '업무 안내', title: '월말 재고 실사 일정 공유 (창고 A/B동)', author: { name: '정민호', dept: '물류' }, date: '06.19', views: 88 },
];
function BoardListDemo() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const catLabel: Record<string, string> = { work: '업무 안내', docs: '자료실', free: '자유' };
  const filtered = BOARD_POSTS.filter((p) => {
    const okCat = cat === 'all' || (cat === 'notice' ? !!p.pinned : p.category === catLabel[cat]);
    const okQ = !q || p.title.includes(q) || p.author.name.includes(q);
    return okCat && okQ;
  });
  return (
    <BoardList
      title="공지사항"
      description="사내 공지·업무 안내를 확인하고, 필독 항목은 읽음 확인이 필요합니다."
      posts={filtered}
      categories={BOARD_CATEGORIES}
      category={cat}
      onCategoryChange={(v) => { setCat(v); setPage(1); }}
      searchQuery={q}
      onSearchChange={(v) => { setQ(v); setPage(1); }}
      createLabel="글쓰기"
      onCreate={() => {}}
      onSelectPost={() => {}}
      page={page}
      onPageChange={setPage}
      totalPages={4}
      totalCount={147}
    />
  );
}

// BoardView 데모 — 본문(content)은 소비처가 DSL 부품으로 조립(도그푸드). 댓글·읽음확인은 상태.
const BOARD_COMMENTS: BoardComment[] = [
  { id: 'c1', author: { name: '박상우', dept: '구매' }, date: '06.24 15:02', body: '반차도 이 기간에 같이 신청해야 하나요? 아니면 평소처럼 수시 신청이 가능한가요?' },
  { id: 'c2', author: { name: '김서연', dept: '인사' }, date: '06.24 15:20', body: '반차는 본 하계 휴가와 무관하게 평소처럼 수시 신청 가능합니다. 본 공지는 연차(종일) 일정 취합용입니다.', isAuthor: true, parentId: 'c1' },
  { id: 'c3', author: { name: '정민호', dept: '물류' }, date: '06.24 16:40', body: '확인했습니다. 창고 인원 일정 조율해서 팀 취합 후 제출하겠습니다.' },
];
// 작성물(HTML) — 작성(Editor)→저장→보기(RichText) 한 짝의 산출물 예시.
const POST_HTML = `
<h2>1. 신청 기간 및 방법</h2>
<p>신청 기간: <strong>2026년 7월 1일 ~ 7월 15일 18:00</strong>까지. 신청 방법: 전자결재 &gt; 휴가신청서.</p>
<ul><li>승인: 팀장 1차 → 인사팀 최종</li><li>반차·반반차는 휴가신청서에서 선택</li></ul>
<blockquote>기한 내 미신청 시 부서별 기본 휴가 일정으로 자동 배정됩니다.</blockquote>
<p>문의: 인사팀(내선 1234).</p>
`;
// 답글 저작 데모 — 부품이 대상·초안을 인라인 수집해 (parentId, body)로 넘기고, *소비처(여기)*가 목록을 관리(도메인 무지).
function BoardViewDemo() {
  const [ack, setAck] = useState(false);
  const [comment, setComment] = useState('');
  const [cmts, setCmts] = useState<BoardComment[]>(BOARD_COMMENTS);
  return (
    <BoardView
      notice
      mustRead
      category="공지"
      title="2026년 하계 휴가 신청 및 근태 처리 안내"
      author={{ name: '김서연', dept: '인사팀', role: '책임' }}
      date="2026.06.24 14:20"
      views={412}
      content={<RichText html={POST_HTML} />}
      attachments={[
        { id: 'a1', name: '2026_하계휴가_신청서.xlsx', size: '24 KB' },
        { id: 'a2', name: '휴가규정_개정본.pdf', size: '180 KB' },
      ]}
      readState={{ read: ack ? 33 : 32, total: 48, acknowledged: ack, onAcknowledge: () => setAck(true) }}
      actions={[
        { label: '인쇄', variant: 'ghost', icon: 'print', onClick: () => {} },
        { label: '수정', variant: 'secondary', icon: 'edit', onClick: () => {} },
        { label: '삭제', variant: 'danger', icon: 'trash', onClick: () => {} },
      ]}
      onBack={() => {}}
      prev={{ title: '사내 보안 정책 개정 — VPN 2차 인증 의무화 (8/1 시행)', date: '06.20', onClick: () => {} }}
      next={{ title: '2026년 거래처 단가표 v3 배포 (엑셀 첨부)', date: '06.25', onClick: () => {} }}
      comments={cmts}
      commentValue={comment}
      onCommentChange={setComment}
      onCommentSubmit={() => {
        const body = comment.trim();
        if (!body) return;
        setCmts((p) => [...p, { id: 'n' + p.length, author: { name: '옥성훈', dept: '대표' }, date: '방금', body }]);
        setComment('');
      }}
      onReplySubmit={(parentId, body) =>
        setCmts((p) => [...p, { id: 'r' + p.length, author: { name: '옥성훈', dept: '대표' }, date: '방금', body, parentId }])
      }
    />
  );
}

// BoardWrite 데모 — 분류·수신자·옵션 값은 상태. 수신자(안 C) audiences는 조직 데이터(소비처).
const BOARD_AUDIENCES: AudienceNode[] = [
  { id: 'all', label: '전체', exclusive: true },
  { id: 'design', label: '디자이너', children: [
    { id: 'design.ui', label: 'UI팀', members: [{ id: 'u.kim', name: '김민지', dept: 'UI' }, { id: 'u.lee', name: '이서준', dept: 'UI' }] },
    { id: 'design.gfx', label: '그래픽팀', members: [{ id: 'g.han', name: '한지후', dept: 'GFX' }] },
  ] },
  { id: 'dev', label: '개발' },
  { id: 'sales', label: '영업' },
  { id: 'mgmt', label: '경영지원' },
];
function BoardWriteDemo() {
  const [cat, setCat] = useState<string | null>('work');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('<p>안녕하세요, 인사팀입니다. 아래 내용을 안내드립니다.</p>');
  const [aud, setAud] = useState<string[]>(['design']);   // 'design.ui'는 design에 포섭 — 중복 토큰 금지
  const [files, setFiles] = useState<FileItem[]>([]);
  const [notice, setNotice] = useState(false);
  const [must, setMust] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  return (
    <BoardWrite
      categories={BOARD_CATEGORIES.filter((c) => c.value !== 'all')}
      category={cat}
      onCategoryChange={setCat}
      postTitle={title}
      onPostTitleChange={setTitle}
      body={body}
      onBodyChange={setBody}
      audiences={BOARD_AUDIENCES}
      selectedAudiences={aud}
      onAudiencesChange={setAud}
      files={files}
      onFilesChange={setFiles}
      notice={notice}
      onNoticeChange={setNotice}
      mustRead={must}
      onMustReadChange={setMust}
      commentsAllowed={allowComments}
      onCommentsAllowedChange={setAllowComments}
      onCancel={() => {}}
      onSaveDraft={() => {}}
      onSubmit={() => {}}
    />
  );
}

function EditorDemo() {
  const [html, setHtml] = useState('<h2>리치 텍스트</h2><p>굵게·<em>기울임</em>·목록·인용·링크·표·이미지·구분선을 지원합니다. 출력은 <strong>HTML</strong>.</p><ul><li>TipTap(헤드리스) 엔진 흡수</li><li>스킨은 우리 토큰(무테)</li></ul>');
  return <Editor value={html} onChange={setHtml} />;
}
function RichTextDemo() { return <RichText html={POST_HTML} />; }

// 부품명 → 라이브 예시. 박물관 상세가 <Demo name/>로 렌더.
// CalendarPage 데모 — 시공 도메인은 *여기(dev)에만* 산다(부품은 0 지식). attrs+encoding만 주입.
const CAL_ENCODING: CalendarEncoding = {
  anchor: { attr: 'type', values: {
    general: { color: 'primary', label: '일반' },
    urgent:  { color: 'warning', icon: 'alert-triangle', label: '긴급' },
    as:      { color: 'info', icon: 'tool', label: 'AS' },
    redo:    { color: 'success', icon: 'refresh', label: '재마감' },
  } },
  status: { attr: 'status', values: {
    confirmed: { emphasis: 'solid', label: '확정' },
    requested: { emphasis: 'dashed', label: '요청' },
  } },
  mark: { attr: 'designer', label: '담당', values: {
    kim:  { glyph: '김', label: '김지수', color: 'primary' },
    lee:  { glyph: '이', label: '이도윤', color: 'success' },
    park: { glyph: '박', label: '박서연', color: 'danger' },
    choi: { glyph: '최', label: '최민준', color: 'warning' },
    jung: { glyph: '정', label: '정유진', color: 'info' },
  } },
  rowAxes: [{ attr: 'designer', label: '담당자' }, { attr: 'type', label: '타입' }, { attr: 'status', label: '상태' }],
};
// 2026 대한민국 공휴일(데모 주입 — 부품은 달력 모름). 근로자의날(5/1) 포함.
const CAL_HOLIDAYS = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날' }, { date: '2026-02-17', name: '설날' }, { date: '2026-02-18', name: '설날' },
  { date: '2026-03-01', name: '삼일절' }, { date: '2026-03-02', name: '대체공휴일' },
  { date: '2026-05-01', name: '근로자의날' }, { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '부처님오신날' }, { date: '2026-05-25', name: '대체공휴일' },
  { date: '2026-06-03', name: '지방선거일' }, { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' }, { date: '2026-08-17', name: '대체공휴일' },
  { date: '2026-09-24', name: '추석' }, { date: '2026-09-25', name: '추석' }, { date: '2026-09-26', name: '추석' },
  { date: '2026-10-03', name: '개천절' }, { date: '2026-10-05', name: '대체공휴일' }, { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '성탄절' },
];
const CAL_EVENTS: CalendarEvent[] = (() => {
  const T = ['강남 래미안 아파트', '판교 알파돔 오피스', '역삼 센터필드 카페', '분당 정자동 단독주택', '마포 메세나폴리스 상가', '성수 갤러리아 쇼룸', '잠실 롯데캐슬 보수', '한남 더힐 빌라 201', '위례 자이 단독주택', '서초 삼성타운 오피스', '논현 헤리티지 빌라', '대치 은마 아파트', '방배 래미안 주택', '이태원 경리단 카페', '청담 네이처 쇼룸'];
  const DK = ['kim', 'lee', 'park', 'choi', 'jung']; const TW = ['general', 'general', 'urgent', 'as', 'redo', 'urgent', 'redo'];
  const out: CalendarEvent[] = []; let id = 0;
  for (let d = 1; d <= 30; d++) {
    const n = 3 + ((d * 3) % 6);
    for (let i = 0; i < n; i++) {
      const k = d * 10 + i; const span = ((k * 5) % 10 < 3) ? 1 + (k % 3) : 1; const e = Math.min(30, d + span - 1);
      out.push({ id: String(++id), start: `2026-06-${String(d).padStart(2, '0')}`, end: `2026-06-${String(e).padStart(2, '0')}`,
        label: T[(k * 11) % T.length], attrs: { type: TW[(d * 3 + i * 2) % TW.length], status: ((d + i) % 3 === 0) ? 'requested' : 'confirmed', designer: DK[(d + i * 2) % DK.length] } });
    }
  }
  return out;
})();
// 태그(기간 표식) — 배경형(환경 조건) 위주 + 배너형 1개. 색=역할 팔레트. 소비처 주입(부품은 의미 0지식).
const CAL_ANNOTATIONS: CalendarAnnotation[] = [
  { id: 't1', start: '2026-06-09', end: '2026-06-12', label: '자재 입고 지연', tone: 'danger', display: 'background' },
  { id: 't2', start: '2026-06-18', end: '2026-06-23', label: '고객 검수기간', tone: 'info', display: 'background' },
  { id: 't3', start: '2026-06-15', end: '2026-06-16', label: '본사 워크샵(휴무)', tone: 'neutral', display: 'banner' },
  { id: 't4', start: '2026-06-29', end: '2026-07-03', label: '하절기 단축근무', tone: 'warning', display: 'background' },
];
// 선택→태그 저작 데모 — 부품은 콜백만 쏘고, *소비처(여기)*가 annotations 상태를 관리(도메인 무지 유지).
const CAL_TONES: CalendarColorRole[] = ['warning', 'success', 'info', 'danger', 'primary'];
function CalDemo() {
  const [annos, setAnnos] = useState<CalendarAnnotation[]>(CAL_ANNOTATIONS);
  return (
    <CalendarPage
      title="시공 일정"
      description="현장 시공 — 타입 / 확정·요청 / 담당 디자이너 · 일 6~10건. 날짜 드래그→태그/일정."
      events={CAL_EVENTS}
      encoding={CAL_ENCODING}
      annotations={annos}
      holidays={CAL_HOLIDAYS}
      createLabel="새 시공"
      viewToggle
      onCreate={() => {}}
      onTagRange={(a, b) => {
        const label = window.prompt(`태그 (${a} ~ ${b})`, '새 태그');
        if (label) setAnnos((p) => [...p, { id: 'u' + p.length, start: a, end: b, label, tone: CAL_TONES[p.length % CAL_TONES.length], display: 'background' }]);
      }}
      onCreateRange={(a, b) => { window.alert(`일정 생성: ${a} ~ ${b}`); }}
    />
  );
}

// ── 회계 골격 3종 데모 ───────────────────────────────────────────────────────
//  각 데모는 **최소형 → 최대형** 순으로 둘을 나란히 낸다. 기준선은 최소형이다:
//  옵션을 하나도 안 준 상태에서 부품이 온전히 서는지가 계약의 시험이고, 최대형은 다 켜면 어디까지 가는지다.

const REG_ENTRIES: RegisterEntry[] = [
  { id: 'r1', date: '08-03', ref: 'TR-0812', kind: { label: '매출', tone: 'success' },
    label: '키친앤코', sublabel: '성수 현장 2차 중도금 · 외상매출금', in: 8_250_000, memo: '세금계산서 발행', reconciled: true },
  { id: 'r2', date: '08-05', ref: 'TR-0813', kind: { label: '매입' },
    label: '대성목재', sublabel: '8월 1차 자재 · 원재료', out: 3_180_000, reconciled: true },
  { id: 'r3', date: '08-10', ref: 'TR-0814', kind: { label: '고정비' },
    label: '성수산업개발', sublabel: '공장 임대료 8월분 · 지급임차료', out: 2_400_000, reconciled: true },
  { id: 'r4', date: '08-11', ref: 'TR-0815', kind: { label: '고정비' },
    label: '급여', sublabel: '7월분 · 급여', out: 18_600_000, memo: '마이너스 통장', reconciled: false },
  { id: 'r5', date: '08-12', ref: 'TR-0816', kind: { label: '매출', tone: 'success' },
    label: '케이산업', sublabel: '잔금 · 외상매출금', in: 6_930_000, reconciled: false },
];
// 수불부 — 같은 부품, 열 이름과 단위만 갈린다(labels·unit). 누계·이월·대사(실사) 축은 그대로 산다.
const STOCK_ENTRIES: RegisterEntry[] = [
  { id: 's1', date: '08-05', ref: 'IN-0221', kind: { label: '입고', tone: 'success' },
    label: '대성목재', sublabel: '8월 1차 · L26-0805', in: 300 },
  { id: 's2', date: '08-08', ref: 'OT-0344', kind: { label: '출고' },
    label: '성수 현장', sublabel: '상부장 12조 · L26-0805', out: 148 },
];

// 증빙은 **행 하나 = 거래 한 건 = 묶음 하나**. 붙은 게 없는 행은 클립이 흐리다(조용한 표).
const REG_EVIDENCE: Record<string, Attachment[]> = {
  r1: [{ id: 'ev1', kind: 'pdf', name: '세금계산서_키친앤코.pdf', size: '82 KB' }],
  r2: [{ id: 'ev2', kind: 'pdf', name: '세금계산서_대성목재.pdf', size: '77 KB' },
       { id: 'ev3', kind: 'image', name: '거래명세서.jpg', size: '340 KB' }],
  r5: [{ id: 'ev4', kind: 'image', name: '입금증_케이산업.jpg', size: '198 KB' }],
};

function RegisterDemo() {
  const [entries, setEntries] = useState(REG_ENTRIES);
  const [month, setMonth] = useState(8);
  return (
    <Stack gap="lg">
      {/* 최소형 — 옵션 0개. 날짜·적요·증감·잔액 네 열. 누계는 부품이 이월부터 만든다. */}
      <RegisterWidget entries={REG_ENTRIES.map(({ kind, ref, reconciled, ...e }) => e)} carryOver={{ balance: 12_480_000 }} />

      {/* 최대형 — A층 전부 + 수불부 형제 */}
      <RegisterWidget
        entries={entries}
        carryOver={{ balance: 12_480_000 }}
        closing={{ caption: '전월이월 ₩12,480,000' }}
        accounts={[
          { label: '기업은행 1234-56 · 운영', value: 'ibk' },
          { label: '국민은행 7788-01', value: 'kb' },
        ]}
        period={`2026년 ${month}월`}
        onPeriodChange={(d) => setMonth((m) => Math.min(12, Math.max(1, m + d)))}
        reconciledThrough="7월 31일까지 대사됨"
        onReconcile={(id, next) => setEntries((p) => p.map((e) => (e.id === id ? { ...e, reconciled: next } : e)))}
        onAdd={{
          kinds: [{ label: '매출', value: 'sale' }, { label: '매입', value: 'buy' }, { label: '고정비', value: 'fixed' }],
          memoPlaceholder: '비고',
          onSubmit: async (v) => {
            if (!v.label) return { error: '적요를 입력하세요.' };
            setEntries((p) => [...p, { id: `n${p.length}`, date: v.date ?? '08-12', label: v.label,
              out: v.out ?? undefined, in: v.in ?? undefined, memo: v.memo, reconciled: false }]);
          },
        }}
        evidence={{
          of: (e) => REG_EVIDENCE[e.id],
          onOpen: (id, items) => window.alert(`증빙 ${items.length}건 — ${items.map((a) => a.name).join(', ')}`),
          onAttach: () => window.alert('첨부 선택기는 소비처가 연다(부품은 파일을 안 든다)'),
        }}
        periodTotals
      />

      <RegisterWidget
        entries={STOCK_ENTRIES}
        carryOver={{ balance: 260 }}
        closing={{ caption: '전월이월 260 장' }}
        accounts={[{ label: '제1창고 · 미송판 18T', value: 'w1' }]}
        period="2026년 8월"
        onPeriodChange={() => {}}
        labels={{ out: '출고', in: '입고', balance: '현재고', account: '창고 · 품목' }}
        unit="장"
      />
    </Stack>
  );
}

const AGING_BUCKETS: AgingBucket[] = [
  { key: 'cur', label: '미도래' }, { key: 'b30', label: '1–30일' }, { key: 'b60', label: '31–60일' },
  { key: 'b90', label: '61–90일' }, { key: 'b90p', label: '90일+' },
];
const AGING_ROWS: AgingRow[] = [
  { id: 'a1', label: '세림건설', amounts: { b90p: 22_300_000 }, children: [
    { id: 'a1c1', label: 'INV-0421 · 판교 오피스 1차', sublabel: '만기 06-03', amounts: { b90p: 22_300_000 } },
  ] },
  { id: 'a2', label: '대명하우징', amounts: { b90: 18_400_000 } },
  { id: 'a3', label: '한울인테리어', amounts: { b30: 6_150_000, b60: 18_450_000 } },
  { id: 'a4', label: '정우주택', amounts: { cur: 8_900_000, b30: 12_300_000, b60: 13_450_000 } },
  { id: 'a5', label: '키친앤코', amounts: { cur: 19_250_000, b30: 8_400_000, b90: 2_770_000 } },
  { id: 'a6', label: '그 외 3개 거래처', amounts: { cur: 34_150_000, b30: 21_900_000 } },
];

function AgingDemo() {
  const [open, setOpen] = useState<string[]>(['a1']);
  return (
    <Stack gap="lg">
      {/* 최소형 — buckets + rows만. 버킷은 필수 주입(30/60/90은 표준이 아니다). */}
      <AgingReportWidget buckets={AGING_BUCKETS} rows={AGING_ROWS} />
      {/* 최대형 */}
      <AgingReportWidget
        buckets={AGING_BUCKETS} rows={AGING_ROWS}
        asOf="2026-08-12" basis="due" showRatio
        expandedIds={open} onExpandChange={setOpen}
      />
    </Stack>
  );
}

const PA_LINES: ApplyLine[] = [
  { id: 'p1', label: 'INV-0421', sublabel: '판교 오피스 1차', date: '06-03',
    age: { label: '70일 경과', tone: 'danger' }, gross: 22_000_000, open: 12_300_000 },
  { id: 'p2', label: 'INV-0455', sublabel: '판교 오피스 2차', date: '06-20',
    age: { label: '53일 경과', tone: 'warning' }, gross: 20_000_000, open: 10_000_000 },
  { id: 'p3', label: 'INV-0470', sublabel: '판교 오피스 잔금', date: '08-31',
    age: { label: '미도래' }, gross: 14_000_000, open: 14_000_000 },
];

function PaymentApplyDemo() {
  const [applied, setApplied] = useState<Record<string, number>>({ p1: 12_300_000, p2: 5_000_000 });
  const [adj, setAdj] = useState<Record<string, number>>({ p2: -300_000 });
  const [auto, setAuto] = useState(true);
  const [src, setSrc] = useState('inv');
  const AMOUNT = 20_000_000;
  const fillOldest = () => {
    let left = AMOUNT;
    const next: Record<string, number> = {};
    for (const l of PA_LINES) { const v = Math.min(left, l.open); next[l.id] = v; left -= v; }
    setApplied(next);
  };
  return (
    <Stack gap="lg">
      {/* 최소형 — 출처 하나(탭 없음) · 일괄액션 없음 · 자동배분 없음 · 조정 열 없음 · 체크박스 없음 */}
      <PaymentApplyWidget
        sources={[{ key: 'inv', label: '청구', lines: PA_LINES }]}
        amount={AMOUNT} applied={applied} onApplyChange={(id, v) => setApplied((p) => ({ ...p, [id]: v }))}
        submit={{ onSubmit: () => {} }}
      />
      {/* 최대형 */}
      <PaymentApplyWidget
        sources={[
          { key: 'inv', label: '청구', lines: PA_LINES },
          { key: 'cm', label: '대변메모', lines: [{ id: 'c1', label: 'CM-0033', sublabel: '하자 보수 감액', gross: 1_200_000, open: 1_200_000 }] },
          { key: 'dep', label: '선수금', lines: [] },
        ]}
        activeSource={src} onSourceChange={setSrc}
        amount={AMOUNT} applied={applied} onApplyChange={(id, v) => setApplied((p) => ({ ...p, [id]: v }))}
        adjustments={adj} onAdjust={(id, v) => setAdj((p) => ({ ...p, [id]: v }))}
        onToggleLine={(id, next) => setApplied((p) => ({ ...p, [id]: next ? (PA_LINES.find((l) => l.id === id)?.open ?? 0) : 0 }))}
        bulkActions={[
          { label: '오래된 것부터', onClick: fillOldest },
          { label: '해제', onClick: () => setApplied({}) },
        ]}
        autoApply={{ checked: auto, onChange: setAuto }}
        unapplied="warn"
        header={<Text variant="body-strong">세림건설 · 2026-08-12 · 계좌이체 (기업은행 1234-56)</Text>}
        submit={{ label: '수납 기록', onSubmit: () => {} }}
        onCancel={() => {}}
      />
    </Stack>
  );
}


// OpenItemListWidget — 소비처 "수금" 화면의 구조 그대로: 목록(현장별 계약금액/수금/미수) → 한 건 열기 → 수납 이력·기록.
//  **부품 둘을 페이지가 잇는다**(OpenItemListWidget → Drawer → RegisterWidget). 표면은 우리가 안 정한다.
const OIL_ITEMS: OpenItem[] = [
  { id: 'o1', label: '판교 오피스', sublabel: '세림건설 · 계약 2026-04-20', owner: '옥성훈',
    gross: 56_000_000, received: 33_700_000, due: '06-03', age: { label: '70일 경과', tone: 'danger' } },
  { id: 'o2', label: '위례 상가', sublabel: '대명하우징 · 계약 2026-05-30', owner: '김효진',
    gross: 18_400_000, received: 0, due: '07-12', age: { label: '31일 경과', tone: 'warning' } },
  { id: 'o3', label: '성수 현장', sublabel: '키친앤코 · 계약 2026-07-02', owner: '옥성훈',
    gross: 27_500_000, received: 8_250_000, due: '08-31', age: { label: '미도래' } },
];
// 한 현장의 수납 이력 = 계약금액(이월) → 수납(감소) → 미수(누계). 통장 원장과 **같은 부품**이다.
const OIL_HISTORY: Record<string, RegisterEntry[]> = {
  o1: [
    { id: 'h1', date: '05-04', ref: 'RC-0031', kind: { label: '수납', tone: 'success' },
      label: '계약금', sublabel: '기업은행 1234-56', out: 16_800_000 },
    { id: 'h2', date: '06-18', ref: 'RC-0044', kind: { label: '수납', tone: 'success' },
      label: '1차 중도금', sublabel: '기업은행 1234-56', out: 16_900_000 },
  ],
  o2: [],
  o3: [{ id: 'h3', date: '08-03', ref: 'RC-0058', kind: { label: '수납', tone: 'success' },
    label: '계약금', sublabel: '기업은행 1234-56', out: 8_250_000 }],
};
const OIL_EVIDENCE: Record<string, Attachment[]> = {
  h1: [{ id: 'e1', kind: 'pdf', name: '세금계산서_계약금.pdf', size: '84 KB' }],
  h2: [{ id: 'e2', kind: 'image', name: '입금증_1차.jpg', size: '212 KB' },
       { id: 'e3', kind: 'pdf', name: '세금계산서_1차.pdf', size: '78 KB' }],
};

function OpenItemDemo() {
  const [sel, setSel] = useState<OpenItem>(OIL_ITEMS[0]);
  const [hist, setHist] = useState(OIL_HISTORY);
  const [detail, setDetail] = useState(false);
  const rows = hist[sel.id] ?? [];

  return (
    <Stack gap="xl">
      {/* 최소형 — items만. 잔액 열·하단 합계는 부품이 뺀다. 제목·헤더 액션은 PageHeader의 일이라 없다. */}
      <OpenItemListWidget items={OIL_ITEMS.map(({ owner, due, age, ...i }) => i)} />

      {/* 최대형 — **행 전체가 클릭 대상**(DataTable·ListWidget과 같은 규율). 행 안에 버튼·링크를 두지 않는다. */}
      <OpenItemListWidget items={OIL_ITEMS} selectedId={sel.id} onSelect={(it) => { setSel(it); setDetail(true); }} />

      {/* 행을 누르면 뜨는 것 — **모달**(size=full: 95vw. 7열 원장은 md/lg 폭에서 잘린다).
          기말잔액 헤더는 안 준다: 모달 제목·목록 행·표 마지막 행이 이미 같은 수를 말하고 있다. */}
      <Modal opened={detail} onClose={() => setDetail(false)} title={`${sel.label} · 수금 이력`} size="full">
        <RegisterWidget
          surface="flush"
          entries={rows}
          carryOver={{ label: '계약금액', balance: sel.gross }}
          sides="out"
          labels={{ out: '수납', balance: '미수' }}
          evidence={{
            of: (e) => OIL_EVIDENCE[e.id],
            onOpen: (id, items) => window.alert(`증빙 ${items.length}건 — ${items.map((a) => a.name).join(', ')}`),
            onAttach: () => window.alert('첨부 선택기는 소비처가 연다(부품은 파일을 안 든다)'),
          }}
          onAdd={{
            labelPlaceholder: '적요 (예: 2차 중도금)',
            onSubmit: async (v) => {
              if (!v.out) return { error: '수납액을 입력하세요.' };
              setHist((p) => ({ ...p, [sel.id]: [...(p[sel.id] ?? []),
                { id: `n${p[sel.id]?.length ?? 0}`, date: v.date ?? '08-12', label: v.label || '수납', out: v.out ?? undefined }] }));
            },
          }}
        />
      </Modal>
    </Stack>
  );
}

export function Demo({ name }: { name: string }) {
  const [chip, setChip] = useState(true);
  const [pop, setPop] = useState(false);
  const [seg, setSeg] = useState('plywood');
  const [tab, setTab] = useState('plywood');
  const [txt, setTxt] = useState('');
  const [pw, setPw] = useState('');
  const [num, setNum] = useState<number | string>('');
  const [cur, setCur] = useState<number | string>(3200);
  const [qty, setQty] = useState(3);
  const [colCart, setColCart] = useState<CollectorCartItem[]>([]);
  const [cart, setCart] = useState<LineItem[]>([
    { id: 'a', label: '슬라이드경첩 35mm', sublabel: '경첩 › 슬라이드', group: '경첩', unitAmount: 1500, quantity: 8 },
    { id: 'b', label: '댐퍼경첩', sublabel: '경첩 › 댐퍼', group: '경첩', unitAmount: 3200, quantity: 3 },
    { id: 'c', label: '레버 손잡이', sublabel: '손잡이 › 레버', group: '손잡이', unitAmount: 4500, quantity: 5 },
  ]);
  const [area, setArea] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [mdate, setMdate] = useState<string[]>([]);
  const [chk, setChk] = useState(false);
  const [sw, setSw] = useState(true);
  const [rad, setRad] = useState('plywood');
  const [ff, setFf] = useState('');
  const [multi, setMulti] = useState<string[]>(['plywood']);
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  // 구간 하나(원자) — 위 range와 값 모양이 같아 자리만 다르다(조회·필터 / 폼).
  const [rangeOne, setRangeOne] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [grp, setGrp] = useState('');
  const [queueSel, setQueueSel] = useState('q1');
  const [branchSel, setBranchSel] = useState('b');
  const [memoDraft, setMemoDraft] = useState('');
  // 도면 썸네일 자리표시 — 데모용 인라인 SVG(패키지는 정적 파일을 서빙하지 않는다).
  const PLAN_THUMB = `data:image/svg+xml;utf8,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120'><rect width='160' height='120' fill='#e9ecef'/><path d='M18 96h124M18 24v72M52 24v72M52 60h90' stroke='#868e96' stroke-width='2' fill='none'/></svg>",
  )}`;
  const [notes, setNotes] = useState<ThreadNote[]>([
    { id: 'n1', body: '고객이 상판 재질 두 가지로 비교 요청.', author: '옥성훈', time: '3일 전', canEdit: true },
    { id: 'n2', body: '토요일 오후 내방. 3인 가구, 아일랜드 원함.', author: '김지우', time: '5일 전',
      attachments: [
        { id: 'f1', kind: 'pdf', name: '1층_평면도.pdf', size: '2.4 MB' },
        { id: 'f2', kind: 'image', name: '현장사진.jpg', src: PLAN_THUMB, alt: '주방 현장 사진' },
      ] },
  ]);
  // 아직 안 올라간 파일의 주인은 소비처다 — 부품은 그리기만 한다(controlled).
  const [notePending, setNotePending] = useState<Attachment[]>([]);
  const noteAttach = {
    accept: '.pdf,.png,.jpg,.jpeg,.webp',
    maxSize: 10 * 1024 * 1024,
    pendingFiles: notePending,
    onPickFiles: (fs: File[]) => setNotePending((p) => [
      ...p,
      ...fs.map((f) => ({
        id: `${f.name}-${f.size}`,
        name: f.name,
        // 확장자→kind 판별은 소비처의 일(부품은 도메인·로케일을 모른다).
        kind: (f.type.startsWith('image/') ? 'image' : f.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document') as AttachmentKind,
        src: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      })),
    ]),
    onRemovePendingFile: (id: string) => setNotePending((p) => p.filter((x) => x.id !== id)),
    // 뷰어를 여는 건 소비처다 — 실제 앱은 여기서 <AttachmentViewer />를 연다.
    onOpenAttachment: (id: string) => notify.info(`첨부 열기 ${id}`),
  };
  // 첨부까지 실어 보내는 제출 — 대기 목록을 비우는 것도 소비처의 일이다.
  const submitNote = () => {
    setNotes((n) => [{
      id: String(n.length + 1), body: memoDraft, author: '나', time: '방금', canEdit: true,
      attachments: notePending.length ? notePending : undefined,
    }, ...n]);
    setMemoDraft('');
    setNotePending([]);
  };
  const [files, setFiles] = useState<FileItem[]>([
    { id: 'a', name: '도면.pdf', status: 'done' },
    { id: 'b', name: '사양.xlsx', status: 'uploading', progress: 60 },
  ]);
  const [page, setPage] = useState(2);
  const [modal, setModal] = useState(false);
  const [dwBefore, setDwBefore] = useState(false);
  const [dwAfter, setDwAfter] = useState(false);
  const [paper, setPaper] = useState(false);
  const [docModal, setDocModal] = useState<'view' | 'edit' | null>(null);
  const [docFree, setDocFree] = useState(false);
  const [docFlow, setDocFlow] = useState(false);          // 흐르는 문서(길이가 데이터)          // 손코딩 문서(children 모드) — 3장
  const [docView, setDocView] = useState('gab');          // 헤더 toolbar 슬롯 데모(갑/을)
  const [docValues, setDocValues] = useState(PAPER_DEMO_VALUES);
  const [cbo, setCbo] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [stp, setStp] = useState(1);
  const [xfer, setXfer] = useState<string[]>(['mdf']);
  const [tsel, setTsel] = useState<string | null>(null);
  const [casc, setCasc] = useState<string[]>([]);
  const [mcol, setMcol] = useState<string[]>([]);
  const [mcolDeep, setMcolDeep] = useState<string[]>(['furn', 'handle', 'bar', 'sus', 'nickel', 'spec1']);  // 깊은 경로 완료 상태(말줄임 데모)
  const [stbSearch, setStbSearch] = useState('');
  const [stbStatus, setStbStatus] = useState<string | null>(null);
  const [month, setMonth] = useState('2026-06');
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dtSel, setDtSel] = useState<string[]>([]);
  // DataSheet 데모 — 조합에서만 드러나는 결함을 잡으려고 **깨지기 쉬운 것들을 한 화면에** 둔다:
  //  수정 중인 행 + 그 아래 오류 줄 + 다른 행의 확장 패널 + 초안 줄 + 하단 sticky 합계.
  //  (부품 단독 데모로는 안 잡힌다 — 01 "조합 결함은 소비처가 먼저 본다")
  const [dsRows, setDsRows] = useState<SheetRow[]>([
    { id: 'd1', date: '2026-08-03', desc: '싱크대 상판 자재', party: '대성석재', kind: '매입', qty: 2, price: 840000, files: 2, memo: '상판 두께 20T, 현장 직납' },
    { id: 'd2', date: '2026-08-04', desc: '현장 경비 정산', party: '김현수', kind: '경비', qty: 1, price: 126000, files: 0 },
    { id: 'd3', date: '2026-08-04', desc: '반포 현장 중도금', party: '㈜한아름', kind: '매출', qty: 1, price: 12400000, files: 1 },
    { id: 'd4', date: '2026-08-05', desc: '비품 구입', party: '오피스마트', kind: '경비', qty: 3, price: 45000, files: 0 },
    { id: 'd5', date: '2026-08-06', desc: '계정 대체', party: '—', kind: '대체', qty: 1, price: 0, files: 0 },
  ]);
  const [dsExpanded, setDsExpanded] = useState<string | null>('d1');
  const [dsSort, setDsSort] = useState<DataTableSort>({ key: 'date', direction: 'asc' });
  const [treeSel, setTreeSel] = useState<string | null>('d1');
  const [treeExp, setTreeExp] = useState<string[]>(['d1']);
  const [hxSearch, setHxSearch] = useState('');
  const [hxDetail, setHxDetail] = useState<HierarchyObject | null>(null);
  const [hxNodes, setHxNodes] = useState<TreeNodeData[]>(SAMPLE_TREE);
  const [hxObjMap, setHxObjMap] = useState<Record<string, HierarchyObject[]>>(() => ({ ...HX_OBJECTS }));
  const [addKind, setAddKind] = useState<null | 'product' | 'dir'>(null);
  const [addName, setAddName] = useState('');
  const [ledgerMonth, setLedgerMonth] = useState(6);
  const [ledgerTab, setLedgerTab] = useState('item');
  const [ledgerSel, setLedgerSel] = useState<string | null>(null);
  const toggleExp = (id: string) => setTreeExp((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const [fgMode, setFgMode] = useState<'edit' | 'read'>('edit');
  const [fgSize, setFgSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [fgVals, setFgVals] = useState<Record<string, unknown>>({
    site: '서울 송파구 장지동 308-204', manager: '인연지', phone: '010-8108-0626',
    useDate: '2026-03-11', door: 'kei', usage: '주방&냉장고장&아일랜드, 화장대, 현장칠, 도어',
  });

  const D: Record<string, ReactNode> = {
    Button: (
      <Stack gap="sm">
        {/* variant — 색·강조의 축. accent는 «물러났지만 이 화면의 주 진입»(글쓰기·더보기·초기화). */}
        <Group gap="xs" align="center" wrap>
          <Text variant="caption" color="secondary">variant</Text>
          <Button variant="primary">저장</Button><Button variant="secondary">취소</Button>
          <Button variant="danger">삭제</Button><Button variant="ghost">더보기</Button>
          <Button variant="accent">글쓰기</Button>
        </Group>
        {/* 밀도 — 높이·좌우여백만 갈린다. **글자는 셋 다 14px**(크기를 글자로 말하지 않는다). */}
        <Group gap="xs" align="center" wrap>
          <Text variant="caption" color="secondary">size</Text>
          <Button variant="secondary" size="xs">28</Button>
          <Button variant="secondary" size="sm">32</Button>
          <Button variant="secondary" size="md">40</Button>
        </Group>
      </Stack>
    ),
    Badge: (
      <Stack gap="sm">
        {/* weak(기본) — 평상시. 톤만 얹는다. */}
        <Group gap="xs" align="center">
          <Text variant="caption" color="secondary">weak</Text>
          <Badge color="success">완료</Badge><Badge color="warning">대기</Badge><Badge color="danger">실패</Badge><Badge color="info">신규</Badge>
        </Group>
        {/* fill — 반전. "여기 좀 봐". 한 화면에 여럿 두면 강조가 강조이길 그만둔다. */}
        <Group gap="xs" align="center">
          <Text variant="caption" color="secondary">fill</Text>
          <Badge color="info" strength="fill">공지</Badge><Badge color="danger" strength="fill">필독</Badge>
        </Group>
      </Stack>
    ),
    // 상태 사다리 3단을 한 눈에 — 같은 상태를 세 무게로 그린다(06 §3-6).
    StatusLabel: (
      <Stack gap="sm">
        <Group gap="md" align="center" wrap>
          <Text variant="caption" color="secondary">1단 · 텍스트+색</Text>
          <StatusLabel>진행</StatusLabel>
          <StatusLabel tone="warning">대기</StatusLabel>
          <StatusLabel tone="success">완료</StatusLabel>
          <StatusLabel tone="danger">반려</StatusLabel>
        </Group>
        <Group gap="md" align="center" wrap>
          <Text variant="caption" color="secondary">2단 · 심볼+텍스트</Text>
          <StatusLabel icon="clock">진행</StatusLabel>
          <StatusLabel tone="warning" icon="history">대기</StatusLabel>
          <StatusLabel tone="success" icon="check-circle">완료</StatusLabel>
          <StatusLabel tone="danger" icon="x-circle">반려</StatusLabel>
        </Group>
        <Group gap="md" align="center" wrap>
          <Text variant="caption" color="secondary">3단 · 알약(Badge)</Text>
          <Badge color="warning">지연</Badge>
          <Badge color="danger" strength="fill">필독</Badge>
        </Group>
        {/* 문장 속 — Badge가 못 하는 일. padding이 없어 행간을 안 민다. */}
        <Text variant="body">
          이 품의는 <StatusLabel tone="danger" icon="x-circle">반려</StatusLabel>됐습니다. 사유를 확인한 뒤 다시 상신하세요.
        </Text>
      </Stack>
    ),
    CountBadge: (
      <Stack gap="sm">
        {/* 탭 라벨 뒤 카운트 — 행동요구(빨강)만 튀고 정보(중립)는 가라앉는다. 0건은 안 보임. */}
        <Group gap="lg" align="center">
          <Group gap="xs" align="center"><Text variant="body-strong">새 주문</Text><CountBadge count={1} /></Group>
          <Group gap="xs" align="center"><Text variant="body" color="secondary">진행 중</Text><CountBadge count={3} tone="neutral" /></Group>
          <Group gap="xs" align="center"><Text variant="body" color="secondary">완료</Text><CountBadge count={0} /></Group>
        </Group>
        {/* 크기 축 — 붙는 아이콘보다 작아야 한다. 16px 아이콘 옆에 md를 쓰면 배지가 아이콘을 이긴다. */}
        <Group gap="lg" align="center">
          <Group gap="xs" align="center"><Text variant="caption" color="secondary">md · 아이콘 20px 옆</Text><Icon name="bell" size="md" /><CountBadge count={3} /></Group>
          <Group gap="xs" align="center"><Text variant="caption" color="secondary">sm · 아이콘 16px 옆</Text><Icon name="bell" size="sm" /><CountBadge count={3} size="sm" /></Group>
        </Group>
        {/* 점(dot) 모드 + 99+ 캡 */}
        <Group gap="lg" align="center">
          <Group gap="xs" align="center"><Text variant="body">발주</Text><CountBadge count={5} dot /></Group>
          <CountBadge count={128} />
        </Group>
      </Stack>
    ),
    Chip: <Chip color="info" selected={chip} onChange={() => setChip((v) => !v)} onRemove={() => {}}>합판</Chip>,
    Text: <Stack gap="xxs"><Text variant="body">본문(body)</Text><Text variant="body-strong">강조(body-strong)</Text><Text variant="caption" color="secondary">보조(caption)</Text></Stack>,
    Title: <Stack gap="xxs"><Title variant="display">Display</Title><Title variant="heading">Heading</Title><Title variant="subheading">Subheading</Title></Stack>,
    Label: <Label htmlFor="x">담당자 이름</Label>,
    //  Anchor의 정체는 «이동»이라, 링크 하나를 덩그러니 놓으면 아무것도 안 보인다.
    //   ① 제일 흔한 자리가 «문장 안»이고 ② href가 살아 있어야 이동인지 확인이 되며
    //   ③ 밑줄·색이 본문과 어떻게 갈리는지는 본문 옆에 놔야 읽힌다.
    //   (옛 데모는 `href="#"` 링크 한 줄이라 눌러도 아무 일이 없었다 — 오너 관찰.)
    Anchor: (
      <Stack gap="sm">
        <Text variant="body">
          문장 안에서: 자세한 규격은 <Anchor href="/dev/part/Button">Button 상세</Anchor>를 보세요.
          이동이 아닌 행동은 <Text variant="body-strong">버튼</Text>이 맡습니다.
        </Text>
        <Group gap="lg" align="center">
          <Anchor href="/dev/part/Badge">단독 링크</Anchor>
          <Anchor href="/dev/tokens">토큰 화면으로</Anchor>
        </Group>
        <Text variant="caption" color="secondary">
          캔버스가 iframe이라 누르면 이 판 안에서 이동합니다 — 「상태 초기화」로 되돌립니다.
        </Text>
      </Stack>
    ),
    Icon: <Group gap="sm"><Icon name="check-circle" /><Icon name="bell" color="danger" /><Icon name="settings" size="lg" /></Group>,
    Avatar: <Group gap="xs"><Avatar>김</Avatar><Avatar size="sm">병</Avatar><Avatar size="lg">준</Avatar></Group>,
    Image: <Image src={IMG_SRC} alt="예시" size="sm" />,
    Tooltip: <Tooltip label="도움말 텍스트"><Button variant="secondary">hover 해보기</Button></Tooltip>,
    Popover: <Popover opened={pop} onChange={setPop} content={<Card variant="outlined" padding="sm"><Text variant="body">슬롯 안은 부품으로</Text></Card>}><Button variant="secondary" onClick={() => setPop((v) => !v)}>클릭</Button></Popover>,
    Spinner: <Spinner />,
    SegmentedControl: <SegmentedControl options={opts} value={seg} onChange={setSeg} />,
    TabBar: <TabBar options={[{ ...opts[0], count: 2 }, opts[1], opts[2]]} value={tab} onChange={setTab} />,
    TextInput: <TextInput value={txt} onChange={setTxt} placeholder="이름 입력" />,
    PasswordInput: <PasswordInput value={pw} onChange={setPw} placeholder="비밀번호" />,
    NumberInput: <NumberInput value={num} onChange={setNum} placeholder="수량" />,
    CurrencyInput: <CurrencyInput value={cur} onChange={setCur} placeholder="단가" />,
    NumberStepper: <NumberStepper value={qty} onChange={setQty} max={99} />,
    Textarea: <Textarea value={area} onChange={setArea} placeholder="메모" autosize />,
    Select: <Select options={opts} value={sel} onChange={setSel} placeholder="자재 선택" />,
    DatePicker: <DatePicker value={date} onChange={setDate} placeholder="날짜" holidays={CAL_HOLIDAYS} />,
    MultiDatePicker: <MultiDatePicker value={mdate} onChange={setMdate} placeholder="여러 날짜" holidays={CAL_HOLIDAYS} />,
    DateRangePicker: <DateRangePicker value={rangeOne} onChange={setRangeOne} placeholder="기간(시작~끝)" holidays={CAL_HOLIDAYS} />,
    Checkbox: <Checkbox label="동의합니다" checked={chk} onChange={setChk} />,
    Switch: <Switch label="알림 받기" checked={sw} onChange={setSw} />,
    Radio: <Radio options={opts} value={rad} onChange={setRad} />,
    Card: <Group gap="sm"><Card variant="elevated" padding="md"><Text variant="body">elevated</Text></Card><Card variant="outlined" padding="md"><Text variant="body">outlined</Text></Card><Card variant="flat" padding="md"><Text variant="body">flat</Text></Card></Group>,
    Divider: <div style={{ width: 240 }}><Divider /></div>,
    Container: <Card variant="flat" padding="sm"><Box>narrow 천장 + 가운데</Box></Card>,
    Page: <Card variant="flat" padding="sm"><Box>1200 캡 + 중앙 — 페이지 폭의 유일한 주인(prop 없음)</Box></Card>,
    Stack: <div style={{ width: 200 }}><Stack gap="xs"><Box>1</Box><Box>2</Box><Box>3</Box></Stack></div>,
    Group: <Group gap="xs"><Box>A</Box><Box>B</Box><Box>C</Box></Group>,
    Grid: <Grid columns={3} gap="xs"><Grid.Col span={1}><Box>1</Box></Grid.Col><Grid.Col span={2}><Box>span 2</Box></Grid.Col></Grid>,
    FormField: <FormField label="이메일" withAsterisk error={ff && !ff.includes('@') ? '형식이 올바르지 않습니다' : undefined}><TextInput value={ff} onChange={setFf} placeholder="user@kk.co.kr" /></FormField>,
    MultiSelect: <MultiSelect options={opts} value={multi} onChange={setMulti} placeholder="자재(복수)" />,
    DateRangeField: <DateRangeField value={range} onChange={setRange} startPlaceholder="시작" endPlaceholder="끝" holidays={CAL_HOLIDAYS} />,
    InputGroup: <InputGroup rightAddon="원"><NumberInput value={grp} onChange={(v) => setGrp(String(v))} placeholder="금액" /></InputGroup>,
    FileUploader: <FileUploader value={files} onChange={setFiles} multiple accept=".pdf,.xlsx,image/*" maxSize={5 * 1024 * 1024} />,
    Pagination: <Pagination total={10} value={page} onChange={setPage} />,
    IconButton: <Group gap="xs"><IconButton icon="settings" label="설정" variant="secondary" /><IconButton icon="trash" label="삭제" variant="danger" /><IconButton icon="dots" label="더보기" variant="ghost" /></Group>,
    Callout: <Callout tone="warning" title="중복 연락처">같은 번호가 이미 등록되어 있습니다.</Callout>,
    StatusRow: <StatusRow label="발주서 #1024" icon="file-text" status={{ label: '승인 대기', tone: 'warning' }} actions={[{ label: '승인', variant: 'primary', onClick: () => {} }, { label: '반려', variant: 'ghost', onClick: () => {} }]} />,
    SummaryCard: <div style={{ width: 220 }}><SummaryCard label="승인 대기" icon="clock" tone="warning" count={12} amount={3400000} /></div>,
    TotalRow: <div style={{ width: 280 }}><TotalRow amount={3400000} /></div>,
    Collapsible: (
      // 정산 사용례 — 발주 한 건당 요약행(StatusRow) 헤더, 펼치면 품목 줄들 + 소계(TotalRow). 쌓아서 요약 목록.
      <div style={{ width: 440, display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-sm)' }}>
        <Collapsible defaultOpen header={<StatusRow label="발주서 #1024" icon="file-text" status={{ label: '완료', tone: 'success' }} />}>
          <Stack gap="xs">
            <Group justify="between"><Text variant="body">합판 24T × 50</Text><Text variant="body">₩1,200,000</Text></Group>
            <Group justify="between"><Text variant="body">경첩 × 200</Text><Text variant="body">₩800,000</Text></Group>
            <TotalRow amount={2000000} />
          </Stack>
        </Collapsible>
        <Collapsible header={<StatusRow label="발주서 #1025" icon="file-text" status={{ label: '진행', tone: 'info' }} />}>
          <Text variant="body">기본 접힘 — 헤더를 누르면 펼쳐집니다.</Text>
        </Collapsible>
      </div>
    ),
    Accordion: (
      // 윤곽 최소·그림자 위주. 기본=회색(bg-tertiary)+그림자, 강조(첫 행)=틴트 채움+얇은 틴트 윤곽+그림자(좌측 띠 없음).
      //  clearAttentionOnOpen: 강조 행을 펼치면(=봤음) 기본 회색으로 페이드 해제. 펼침 조율은 하나만 열림(multiple 아님).
      <div style={{ width: 440 }}>
        <Accordion
          clearAttentionOnOpen
          items={[
            { value: 'basic', label: <StatusRow label="기본 정보" icon="file-text" status={{ label: '필수', tone: 'info' }} />, children: <Text variant="body">상호 · 사업자번호 · 대표자</Text>, tone: 'attention' },
            { value: 'owner', label: <StatusRow label="담당자" icon="user" status={{ label: '선택', tone: 'neutral' }} />, children: <Text variant="body">이름 · 연락처 · 이메일</Text> },
            { value: 'config', label: <StatusRow label="환경설정" icon="settings" status={{ label: '선택', tone: 'neutral' }} />, children: <Text variant="body">여신한도 · 결제일</Text> },
          ]}
        />
      </div>
    ),
    Modal: (
      <>
        <Button variant="secondary" onClick={() => setModal(true)}>모달 열기</Button>
        <Modal opened={modal} onClose={() => setModal(false)} title="신규 등록" actions={[{ label: '취소', variant: 'ghost', onClick: () => setModal(false) }, { label: '저장', variant: 'primary', onClick: () => setModal(false) }]}>
          <Text variant="body">본문(children)에 도메인 폼이 온다. Modal은 그게 뭔지 모른다.</Text>
        </Modal>
      </>
    ),
    Drawer: (
      // 단독 부품(신규, 기존 대체 아님). 기준: 뒤 화면이 보여야 하면 Drawer / 가려도 되면(차단) Modal.
      <Stack gap="xs">
        <Text variant="caption" color="secondary">맥락(목록·상세)을 유지한 채 가장자리에서 보조작업. position으로 좌/우/상/하.</Text>
        <Group gap="xs" wrap>
          <Button variant="secondary" onClick={() => setDwAfter(true)}>우측 상세 Drawer</Button>
          <Button variant="ghost" onClick={() => setDwBefore(true)}>좌측 필터 Drawer</Button>
        </Group>
        <Drawer opened={dwAfter} onClose={() => setDwAfter(false)} position="right" title="거래처 상세" actions={[{ label: '닫기', variant: 'ghost', onClick: () => setDwAfter(false) }, { label: '저장', variant: 'primary', onClick: () => setDwAfter(false) }]}>
          <Text variant="body">우측에서 슬라이드 — 뒤 목록 맥락을 유지한 채 편집.</Text>
        </Drawer>
        <Drawer opened={dwBefore} onClose={() => setDwBefore(false)} position="left" title="필터" actions={[{ label: '적용', variant: 'primary', onClick: () => setDwBefore(false) }]}>
          <Text variant="body">좌측 필터 패널 예시.</Text>
        </Drawer>
      </Stack>
    ),
    PaperDoc: (
      // 서식 + 값 → A4. 격자는 정렬 골격이고 선은 셀의 속성이다(선 소유권: 각 칸이 자기 위·왼쪽만 그린다).
      <Stack gap="xs">
        <Text variant="caption" color="secondary">
          서식(PaperSpec)에 값을 먹여 A4로 그린다. 「경첩」이 세 줄에 세로로 걸치는 게 묶음 걸침(scope: group)이고,
          굵은 선은 표 바깥에만 — 반복 줄에 그은 아래 변은 «표의 바닥»으로 읽혀 마지막 줄에만 찍힌다. 서식은 엑셀에서 만든다(npx erp-paper-import).
        </Text>
        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--mantine-radius-sm)' }}>
          <PaperDoc spec={PAPER_DEMO_SPEC} values={docValues} scale={0.42} />
        </div>
      </Stack>
    ),
    DocModal: (
      // 껍데기 하나 — 내용은 서식(spec)이든 손코딩(children)이든, 인쇄는 한 경로다.
      <Stack gap="xs">
        <Text variant="caption" color="secondary">
          같은 문서를 보기 / 작성·편집으로 연다 — 채우는 중에도 **문서 기하는 그대로**다(칸이 곧 입력의 크기, 입력은 1px 물려 들어간다).
          고치고 저장하면 위 미리보기에 바로 반영된다. 안 저장하고 닫으면 푸터가 확인으로 바뀐다. 배율은 100% 고정(맞춰 보는 시점은 인쇄 미리보기다).
          헤더 우측은 열린 슬롯(`toolbar`) — 문서의 *종류*를 고르는 자리다(여기선 갑/을, 도메인에 따라 라디오·선택도 된다).
        </Text>
        <Group gap="xs" wrap>
          <Button variant="secondary" onClick={() => setDocModal('view')}>서식 문서 — 보기</Button>
          <Button variant="secondary" onClick={() => setDocModal('edit')}>서식 문서 — 작성·편집</Button>
          <Button variant="secondary" onClick={() => setDocFree(true)}>손코딩 문서 — 3장</Button>
        </Group>
        <DocModal
          opened={docModal !== null}
          onClose={() => setDocModal(null)}
          title={`발주서 — ${docModal === 'edit' ? '작성' : '보기'}`}
          spec={PAPER_DEMO_SPEC}
          values={docValues}
          mode={docModal ?? 'view'}
          onSave={setDocValues}
          readonlyFields={['품목.이름']}
          toolbar={docModal === 'view' ? (
            <SegmentedControl
              size="sm" value={docView} onChange={setDocView}
              options={[{ label: '갑지', value: 'gab' }, { label: '을지', value: 'eul' }]}
            />
          ) : undefined}
          actions={docModal === 'view' ? [{ label: '수정', variant: 'primary', onClick: () => setDocModal('edit') }] : undefined}
        />
        {/* children 모드 — **각 장을 <PaperSheet>로 감싼 것이 전부**다. 껍데기는 문서 안을 모른다.
            세 장을 넣은 건 이 부품이 생긴 이유가 «여러 장이 한 장으로 겹쳐 나가던 것»이라서다 —
            겹침·잘림은 한 장짜리 데모에선 절대 안 드러난다(조합 결함은 조합을 박아야 보인다). */}
        <DocModal
          opened={docFree}
          onClose={() => setDocFree(false)}
          title="계약서 — 손으로 그린 문서 3장"
          orientation="portrait"
          actions={[{ label: '승인 요청', variant: 'primary', onClick: () => setDocFree(false) }]}
        >
          {['계약 조건', '공사 범위', '특약 사항'].map((h, i) => (
            <PaperSheet key={h}>
              <Stack gap="lg">
                <Group justify="between" align="start">
                  <Title variant="display">{h}</Title>
                  <Text variant="caption" color="secondary">{`${i + 1} / 3`}</Text>
                </Group>
                <Divider />
                <Text variant="body">
                  이 장은 서식(PaperSpec)이 아니라 소비처가 JSX로 그린 것이다. 껍데기가 하는 일은
                  «한 장 = 시트 하나»를 지키는 것뿐이고, 인쇄에서 이 세 장은 정확히 세 페이지가 된다.
                </Text>
              </Stack>
            </PaperSheet>
          ))}
        </DocModal>
      </Stack>
    ),
    PaperFlow: (
      // 길이가 데이터로 정해지는 서류. 쪽 나눔은 브라우저가 하고, 여백은 쪽마다 선다.
      <Stack gap="xs">
        <Text variant="caption" color="secondary">
          계약서처럼 **장을 셀 수 없는** 문서다(약관이 늘면 장이 는다). 시트와 달리 높이를 안 정한다 —
          대신 쪽마다 위아래 여백이 서도록 부품이 표 머리·꼬리 자리를 예약한다(그것만이 쪽마다 반복된다).
          아래 「문서 열기」로 조항 40개짜리를 넣어 뒀다 — 인쇄 미리보기를 열면 3장으로 나뉘고 **매 장에 여백이 있다.**
        </Text>
        <Group gap="xs" wrap>
          <Button variant="secondary" onClick={() => setDocFlow(true)}>흐르는 문서 열기 (조항 40)</Button>
        </Group>
        <DocModal
          opened={docFlow}
          onClose={() => setDocFlow(false)}
          title="공사 계약서 — 길이가 데이터로 정해지는 문서"
          orientation="portrait"
          actions={[{ label: '승인 요청', variant: 'primary', onClick: () => setDocFlow(false) }]}
        >
          <PaperFlow>
            <Title variant="display">공사 계약서</Title>
            <div style={{ height: 12 }} />
            {Array.from({ length: 40 }, (_, i) => (
              <PaperKeep key={i}>
                <div style={{ marginBottom: 12 }}>
                  <Text variant="body-strong">{`제${i + 1}조`}</Text>
                  <Text variant="body">
                    이 조항은 쪽 경계에서 쪼개지지 않는다(PaperKeep). 데이터가 늘면 장이 늘어난다 —
                    소비처는 장을 세지 않는다.
                  </Text>
                </div>
              </PaperKeep>
            ))}
          </PaperFlow>
        </DocModal>
      </Stack>
    ),
    PaperSheet: (
      // 종이 한 장 — 여백·폭·바탕·쪽 나눔은 시트가, 안은 소비처가.
      <Stack gap="xs">
        <Text variant="caption" color="secondary">
          손으로 그린 문서의 **한 장**이다. 보통 `DocModal` 안에서 여러 장을 쌓고, 방향은 모달이 문맥으로 흘려준다.
          안쪽 여백 15mm는 **서식 문서의 격자 여백과 같은 상수**다 — 회사 서류의 여백이 한 값이 된다. (아래는 0.32배로 줄여 보인 것)
        </Text>
        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--mantine-radius-sm)', height: 1123 * 0.32 + 24, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(0.32)', transformOrigin: 'top center' }}>
            <PaperSheet>
              <Stack gap="lg">
                <Title variant="display">계약서</Title>
                <Divider />
                <Text variant="body">이 안은 소비처가 그린다 — 시트는 문서 안을 모른다.</Text>
              </Stack>
            </PaperSheet>
          </div>
        </div>
      </Stack>
    ),
    PaperModal: (
      // 보기 전용 A4 뷰어. 종이가 자기 윤곽을 가짐(모달 아님). 헤더 토글 — 전체(통째·무스크롤) / 크게(폭 채워 확대·세로 스크롤).
      <Stack gap="xs">
        <Text variant="caption" color="secondary">완성 문서를 본다. 헤더 토글 자세히(기본·폭 채워 확대·세로 스크롤) / 전체(한눈에·무스크롤). children은 표준 A4 캔버스(794×1123) 좌표계.</Text>
        <Group gap="xs" wrap>
          <Button variant="secondary" onClick={() => setPaper(true)}>문서 뷰어 열기</Button>
        </Group>
        <PaperModal
          opened={paper}
          onClose={() => setPaper(false)}
          orientation="portrait"
          title="거래명세서 — 세로 A4"
          actions={[{ label: '닫기', variant: 'ghost', onClick: () => setPaper(false) }]}
        >
          {/* 표준 A4 캔버스(794×1123) 기준 데모 문서(실전은 FieldGrid 장표). 문서 여백 48px. */}
          <div style={{ padding: 48, height: '100%', boxSizing: 'border-box' }}>
            <Stack gap="lg">
              <Group justify="between" align="start">
                <Stack gap="xs">
                  <Title variant="display">거래명세서</Title>
                  <Text variant="caption" color="secondary">No. 2026-0622-017 · 발행일 2026-06-22</Text>
                </Stack>
                <Stack gap="xs" align="end">
                  <Text variant="body">㈜한빛산업</Text>
                  <Text variant="caption" color="secondary">사업자 123-45-67890</Text>
                </Stack>
              </Group>
              <Divider />
              <Grid columns={2} gap="lg">
                <Stack gap="xs"><Text variant="caption" color="secondary">공급받는 자</Text><Text variant="body">대성건설 ㈜</Text></Stack>
                <Stack gap="xs"><Text variant="caption" color="secondary">담당</Text><Text variant="body">김현수 과장 · 010-1234-5678</Text></Stack>
              </Grid>
              <Divider />
              <Stack gap="sm">
                <Group justify="between"><Text variant="body-strong">품목</Text><Text variant="body-strong">금액</Text></Group>
                <Divider />
                <Group justify="between"><Text variant="body">강관 파이프 50A × 120</Text><Text variant="body">3,600,000</Text></Group>
                <Group justify="between"><Text variant="body">엘보 90° 50A × 80</Text><Text variant="body">640,000</Text></Group>
                <Group justify="between"><Text variant="body">플랜지 50A × 40</Text><Text variant="body">520,000</Text></Group>
                <Group justify="between"><Text variant="body">시공·운반비</Text><Text variant="body">1,200,000</Text></Group>
                <Divider />
                <Group justify="between"><Title variant="heading">합계 (VAT 별도)</Title><Title variant="heading">5,960,000</Title></Group>
              </Stack>
            </Stack>
          </div>
        </PaperModal>
      </Stack>
    ),
    DataTable: (
      <DataTable
        selectable
        selectedIds={dtSel}
        onSelectionChange={setDtSel}
        bulkActions={[{ label: '삭제', variant: 'danger', icon: 'trash', iconOnly: true, onClick: () => setDtSel([]) }]}
        columns={[
          { key: 'name', label: '거래처', type: 'text', sortable: true },
          { key: 'owner', label: '담당', type: 'user' },
          { key: 'tags', label: '태그', type: 'tags' },
          { key: 'rate', label: '달성률', type: 'percent', sortable: true },
          { key: 'amount', label: '금액', type: 'currency', sortable: true },
        ]}
        rows={[
          { id: '1', name: '가구상사', owner: { name: '김병준' }, tags: ['B2B', '우수'], rate: 92, amount: 1200000 },
          { id: '2', name: '목재유통', owner: { name: '이수연' }, tags: ['B2C'], rate: 47, amount: 880000 },
        ]}
        status="ready"
      />
    ),
    DataSheet: (
      <DataSheet
        columns={[
          { key: 'date', label: '일자', edit: 'date', sortable: true },
          { key: 'desc', label: '적요', edit: 'text', grow: true, placeholder: '적요' },
          { key: 'party', label: '거래처', edit: 'text', placeholder: '거래처' },
          // read × edit 2축 — 배지로 보이고 select로 고친다(상태 열의 가장 흔한 형태).
          { key: 'kind', label: '구분', read: 'badge', edit: 'select', placeholder: '선택',
            options: [{ label: '매입', value: '매입' }, { label: '매출', value: '매출' }, { label: '경비', value: '경비' }, { label: '대체', value: '대체' }],
            badgeColors: { 매입: 'info', 매출: 'success', 경비: 'warning', 대체: 'neutral' } },
          { key: 'qty', label: '수량', edit: 'number', placeholder: '0' },
          // editable(row) — 같은 열이라도 '대체' 줄에서는 안 열린다.
          { key: 'price', label: '단가', edit: 'currency', placeholder: '0', editable: (r) => r.kind !== '대체' },
          { key: 'amount', label: '금액', read: 'currency' },   // edit 없음 = 파생 칸
        ]}
        rows={dsRows.map((r) => ({ ...r, amount: (Number(r.qty) || 0) * (Number(r.price) || 0) }))}
        enterOrder={['date', 'desc', 'party', 'kind', 'qty', 'price']}
        sort={dsSort}
        onSortChange={setDsSort}
        onCommitRow={async (id, v) => {
          // 거절 계약 데모 — 값을 지키고 그 칸만 오류를 문다(표 위 배너로 안 올린다).
          if (v.kind === '경비' && Number(v.price) > 50000) return { error: '경비 단가 한도(₩50,000)를 넘습니다', key: 'price' };
          setDsRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...v } : r)));
        }}
        draft={{
          seed: { date: '', desc: '', party: '', kind: '', qty: '', price: '', files: 0 },
          ready: (v) => !!(v.date && v.desc && v.kind),
          onCreate: async (v) => { setDsRows((prev) => [...prev, { ...v, id: `n${prev.length + 1}` } as SheetRow]); },
          // 초안 줄의 파생 칸 — **저장 줄과 같은 식으로 amount를 채운다.** 이게 없으면 같은 열이
          //  저장 줄에선 차 있고 초안 줄에서만 비어, 치는 중에 대조할 숫자가 사라진다.
          derive: (v) => ({ amount: (Number(v.qty) || 0) * (Number(v.price) || 0) }),
        }}
        rowActions={(row) => [{ label: '삭제', icon: 'trash', variant: 'danger', onClick: () => setDsRows((prev) => prev.filter((r) => r.id !== row.id)) }]}
        expand={{
          count: (r) => Number(r.files) || 0,
          // 초안 줄에서도 같은 패널이 열린다 — 소비처가 파일을 draft 값에 쌓아두면 onCreate가 통째로 받아간다.
          render: (r) => (
            <Group gap="xl" align="start">
              <Stack gap="xs">
                <Text variant="caption" color="secondary">첨부</Text>
                <Group gap="xs" align="center">
                  {Array.from({ length: Number(r.files) || 0 }).map((_, i) => (
                    <Group key={i} gap="xxs" wrap={false}>
                      <Icon name="file-text" size="sm" color="secondary" />
                      <Text variant="caption">{`증빙_${String(r.id)}_${i + 1}.pdf`}</Text>
                    </Group>
                  ))}
                  <Button variant="secondary" size="sm" leftIcon={<Icon name="plus" size="sm" />}
                    onClick={() => setDsRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, files: (Number(x.files) || 0) + 1 } : x)))}>
                    파일 추가
                  </Button>
                </Group>
              </Stack>
              <Stack gap="xs">
                <Text variant="caption" color="secondary">메모</Text>
                {r.memo ? <Text variant="body">{String(r.memo)}</Text>
                  : <Text variant="body" color="secondary">메모 없음</Text>}
              </Stack>
            </Group>
          ),
        }}
        expandedId={dsExpanded}
        onExpandChange={setDsExpanded}
        totals={{
          qty: dsRows.reduce((s, r) => s + (Number(r.qty) || 0), 0),
          amount: dsRows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.price) || 0), 0),
        }}
      />
    ),
    ListWidget: (
      // TanStack 흡수 목록 위젯(ListPage 대체). 툴바가 표면 안 · align 자동/override · actions 셀=행 버튼.
      <ListWidget
        title="레코드"
        columns={LW_COLUMNS}
        data={LW_ROWS}
        search={{ fields: ['name'], placeholder: '항목명 검색' }}
        selectable
        bulkActions={[
          { label: '내보내기', variant: 'secondary', icon: 'download', onClick: () => notify.info('내보내기') },
          { label: '삭제', variant: 'danger', icon: 'trash', onClick: () => notify.danger('일괄 삭제') },
        ]}
        pageSize={8}
        onRowClick={(r) => notify.info(`행 클릭: ${String(r.name)}`)}
        emptyState={{ icon: 'search', title: '결과 없음', description: '검색·필터를 조정하세요.' }}
      />
    ),
    Repeater: (
      // 저작 툴킷 척추 — 접이 레코드 + 헤더/본문 슬롯. 실제론 소비처가 renderItem에 도메인 필드를 조립.
      //  여기선 defaultOpen으로 슬롯 내용을 보인다(add/remove는 토스트 — 박물관은 상태 없음).
      <div style={{ maxWidth: 560 }}>
        <Repeater
          items={REP_DEMO}
          addLabel="옵션 추가"
          defaultOpen
          onAdd={() => notify.info('레코드 추가')}
          onRemove={() => notify.info('레코드 삭제')}
          renderHeader={(it) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{it.variable}</span>
              <Text variant="body-strong">{it.label}</Text>
              <Badge color={it.tone}>{it.kind}</Badge>
            </span>
          )}
          renderItem={(it) => (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-sm)' }}>
              <FormField label="variable_name"><TextInput value={it.variable} onChange={() => {}} /></FormField>
              <FormField label="label"><TextInput value={it.label} onChange={() => {}} /></FormField>
            </div>
          )}
        />
      </div>
    ),
    ExpressionField: <ExprFieldDemo />,
    KeyValueField: <KVFieldDemo />,
    OptionSetEditor: <OptionSetEditorDemo />,
    OptionSetComposer: <OptionSetComposerDemo />,
    OptionSetPicker: <OptionSetPickerDemo />,
    CompositionOutline: <CompositionDemo />,
    AssignPicker: (
      // kind='appliance' 필터 → 같은 kind 템플릿만(빈 템플릿 비활성). 선택 시 재적용 경고 Modal.
      <AssignPicker
        templates={[
          { id: 't1', label: '기본 경첩 세트', kind: 'appliance', itemCount: 4 },
          { id: 't2', label: '프리미엄 힌지', kind: 'appliance', itemCount: 7 },
          { id: 't3', label: '빈 템플릿', kind: 'appliance', itemCount: 0 },
          { id: 't4', label: '도어 규격(다른 kind)', kind: 'required', itemCount: 5 },
        ]}
        kind="appliance"
        onAssign={(id) => notify.info(`배정: ${id}`)}
        confirmReapply
      />
    ),
    InheritedValueField: (
      // §4.1 봉인 — 참조(SSOT) 상속가 vs override, ×배율. override 0이면 item 상속(출처 칩=상속).
      <div style={{ maxWidth: 520 }}>
        <InheritedValueField
          refOptions={IVF_REFS}
          refId="i2"
          onRefChange={() => {}}
          override={0}
          onOverrideChange={() => {}}
          ratio={1}
          onRatioChange={() => {}}
        />
      </div>
    ),
    NotificationPanel: (
      // 알림 벨 Popover 슬롯 위젯 — 실제론 AppShell notifControl Popover(width lg=360, p=md)가 감싼다.
      // 박물관에선 그 팝오버 표면을 흉내 낸 상자(360·padding md·raised·overlay)에 담아 단독으로 보여준다.
      <div style={{ width: 360, padding: 'var(--mantine-spacing-md)', background: 'var(--surface-raised)', boxShadow: 'var(--elevation-overlay)', borderRadius: 'var(--mantine-radius-md)' }}>
        <NotificationPanel
          items={NOTIF_ITEMS}
          onMarkAllRead={() => notify.info('모두 읽음')}
          onViewAll={() => notify.info('전체 알림 페이지로 이동')}
        />
      </div>
    ),
    Skeleton: (
      // 정형화 비교 — 기존: 로딩 시 점 하나(Spinner)로 레이아웃 붕괴. 수정안: 실제 행 구조를 흉내낸 Skeleton(레이아웃 유지).
      <BeforeAfter
        before={
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        }
        after={
          <Stack gap="sm">
            {[0, 1, 2].map((i) => (
              <Group key={i} gap="sm" align="center" wrap={false}>
                <Skeleton variant="circle" size="sm" />
                <div style={{ flex: 1 }}><Skeleton variant="text" lines={2} /></div>
              </Group>
            ))}
          </Stack>
        }
      />
    ),
    LineItemList: (
      <div style={{ maxWidth: 360 }}>
        <LineItemList
          items={cart}
          onQuantityChange={(id, q) => setCart((c) => c.map((it) => (it.id === id ? { ...it, quantity: q } : it)))}
          onRemove={(id) => setCart((c) => c.filter((it) => it.id !== id))}
          showAmount
        />
      </div>
    ),
    QueueList: (
      <Stack gap="md">
        <QueueList items={QUEUE_ITEMS} selectedId={queueSel} onSelect={setQueueSel} />
        {/* selectionMark="radio" — 같은 부품, 다른 *의미*(여럿 중 하나를 고른다). 마지막 행은 disabled+배지. */}
        <QueueList items={BRANCH_ITEMS} selectedId={branchSel} onSelect={setBranchSel} selectionMark="radio" />
        <QueueList items={[]} status="loading" skeletonRows={3} />
      </Stack>
    ),
    DecisionPanel: (
      <DecisionPanel
        title="목동 하이페리온 A동 3305호"
        subtitle="강도현 · 010-9902-6614"
        sections={[
          { key: 'memo', label: `메모 ${notes.length}`, children: (
            <NoteThread notes={notes} draft={memoDraft} onDraftChange={setMemoDraft} onSubmit={submitNote}
              onEdit={(id, body) => setNotes((n) => n.map((x) => (x.id === id ? { ...x, body } : x)))}
              onDelete={(id) => setNotes((n) => n.filter((x) => x.id !== id))} {...noteAttach} />
          ) },
          { key: 'branch', label: '견적안 2', labelExtra: <Button variant="ghost" size="sm" onClick={() => {}}>＋ 새 안</Button>, children: (
            <QueueList items={BRANCH_ITEMS.slice(0, 2)} selectedId={branchSel} onSelect={setBranchSel} selectionMark="radio" />
          ) },
        ]}
        secondaryActions={[{ label: '견적 수정', onClick: () => {} }, { label: '도면 첨부', onClick: () => {} }]}
        // 금액 없는 B안이 선택돼 있으면 잠금 — 눌러 보면 사유가 안내 자리에 뜬다(기하 불변).
        primaryAction={{ label: `${branchSel === 'a' ? 'A안' : 'B안'} 계약 작성`, onClick: () => {},
          disabled: branchSel !== 'a', disabledReason: '금액이 있는 안만 계약할 수 있습니다' }}
      />
    ),
    NoteThread: (
      <NoteThread notes={notes} draft={memoDraft} onDraftChange={setMemoDraft} onSubmit={submitNote}
        onEdit={(id, body) => setNotes((n) => n.map((x) => (x.id === id ? { ...x, body } : x)))}
        onDelete={(id) => setNotes((n) => n.filter((x) => x.id !== id))} {...noteAttach} />
    ),
    ListDetail: (
      <ListDetail
        list={<QueueList items={QUEUE_ITEMS.slice(0, 3)} selectedId={queueSel} onSelect={setQueueSel} />}
        detail={(
          <Card variant="elevated" padding="none">
            <DecisionPanel title="아크로 서울포레스트 D동 2201호" subtitle="박서준 · 010-3311-7745"
              sections={[{ key: 'x', label: '참조', children: <Text variant="body">가구 발주서</Text> }]}
              actionNote="첫 견적안을 만들면 안 목록이 생깁니다"
              primaryAction={{ label: '견적 작성', onClick: () => {} }} />
          </Card>
        )}
      />
    ),
    EmptyState: <EmptyState icon="box" title="등록된 발주가 없습니다" description="신규 발주를 만들어 시작하세요." action={{ label: '신규 발주', variant: 'primary', onClick: () => {} }} />,
    PageHeader: <PageHeader title="고객 관리" meta={[{ kind: 'badge', label: '활성', tone: 'success' }, { kind: 'text', label: '유입경로 · 2026-05-02 등록' }]} actions={[{ label: '신규 고객', variant: 'primary', icon: 'user', onClick: () => {} }]} />,
    DescriptionList: <DescriptionList columns={2} items={[{ label: '거래처명', value: '가구상사', type: 'text' }, { label: '상태', value: '확정', type: 'badge', badgeColors: { 확정: 'success' } }, { label: '담당자', value: '김병준', type: 'text' }, { label: '계약일', value: '2026-05-02', type: 'date' }]} />,
    Timeline: <Timeline events={[{ id: '1', timestamp: '2026-06-15T09:00:00', actor: { name: '김병준' }, category: { label: '발주', tone: 'info' }, title: '발주서 생성', body: '#1024 생성됨' }, { id: '2', timestamp: '2026-06-16T14:30:00', actor: { name: '이수연' }, category: { label: '승인', tone: 'success' }, title: '승인 완료' }]} />,
    Calendar: <Calendar month={month} onMonthChange={setMonth} events={[{ id: '1', date: '2026-06-10', label: 'A현장 납품', tone: 'info' }, { id: '2', date: '2026-06-18', label: 'B현장 시공', tone: 'success' }]} />,
    FormSection: (
      <FormSection
        columns={2}
        fields={[
          { name: 'company', label: '거래처명', type: 'text', required: true },
          { name: 'phone', label: '연락처', type: 'text', mask: 'phone' },
          { name: 'material', label: '주요 자재', type: 'select', options: opts },
          { name: 'memo', label: '메모', type: 'textarea', span: 2 },
        ]}
        values={form}
        onChange={(n, value) => setForm((s) => ({ ...s, [n]: value }))}
      />
    ),
    FieldGrid: (
      // 단독(신규) — 테두리 셀 격자(장표). 작성↔확인 토글로 "같은 크기·같은 뷰" 확인(셀 박스 기하 불변, 값만 스왑).
      <Stack gap="sm">
        <Group justify="between" align="center" wrap>
          <Text variant="caption" color="secondary">테두리 셀 격자(장표) — 작성/확인 같은 뷰 + size별 타이포·행 높이 스케일</Text>
          <Group gap="xs" wrap>
            <SegmentedControl size="sm" value={fgSize} onChange={(v) => setFgSize(v as 'sm' | 'md' | 'lg')}
              options={[{ label: '작게', value: 'sm' }, { label: '보통', value: 'md' }, { label: '크게', value: 'lg' }]} />
            <SegmentedControl size="sm" value={fgMode} onChange={(v) => setFgMode(v as 'edit' | 'read')}
              options={[{ label: '작성', value: 'edit' }, { label: '확인', value: 'read' }]} />
          </Group>
        </Group>
        <FieldGrid
          columns={4}
          mode={fgMode}
          size={fgSize}
          values={fgVals}
          onChange={(n, v) => setFgVals((s) => ({ ...s, [n]: v }))}
          fields={[
            { name: 'site', label: '현장주소', type: 'text' },
            { name: 'manager', label: '발주담당자', type: 'text' },
            { name: 'phone', label: '연락처', type: 'text', mask: 'phone' },
            { name: 'useDate', label: '사용일', type: 'date' },
            { name: 'door', label: '도어재작', type: 'select', options: [{ label: '케이산업', value: 'kei' }, { label: '미정', value: 'tbd' }] },
            { name: 'usage', label: '사용용도', type: 'textarea' },
          ]}
          rows={[
            [{ label: '현장주소' }, { field: 'site', colSpan: 3 }],
            [{ label: '발주담당자' }, { field: 'manager' }, { label: '연락처' }, { field: 'phone' }],
            [{ label: '사용일' }, { field: 'useDate' }, { label: '도어재작' }, { field: 'door' }],
            [{ label: '사용용도' }, { field: 'usage', colSpan: 3 }],
            // node 셀 — 스키마 필드로 안 떨어지는 비표준 컨트롤(여기선 Cascader)을 통째로 한 칸에. label/field/image와 배타, mode 무관 그대로 렌더.
            [{ label: '지역' }, { node: <Cascader options={CASC_OPTS} value={casc} onChange={setCasc} placeholder="지역 선택" />, colSpan: 3 }],
          ]}
        />
      </Stack>
    ),
    AppShell: <Anchor href="/dev/preview">→ /dev/preview 에서 3티어 라이브 (데스크탑 넷바 / 태블릿 아이콘 레일 / 폰 하단탭)</Anchor>,
    // Mobile* 는 여기 없다 — **_mobileDemos 가 단일 출처**다.
    //  이전엔 이 자리에 "→ /shell/mobile 에서 라이브" 링크 14줄이 있었다. 실물이 4탭 셸 데모 안에만
    //  존재해서, 부품 하나를 보려면 탭을 손으로 통과해야 했고 빈 상태·에러 같은 건 조작해야만 보였다.
    //  지금은 부품마다 캔버스 주소(/shell/m/part/[name])가 있고 박물관이 그걸 폰 프레임으로 임베드한다.
    //  → 링크를 여기 되살리지 말 것. 두 출처가 되는 순간 한쪽이 낡는다.
    ListPage: <Anchor href="/customers">→ /customers 에서 라이브 (스키마 구동 목록)</Anchor>,
    DetailPage: <Anchor href="/customers">→ /customers/[id] 에서 라이브 (정보+폼 2분할)</Anchor>,
    Combobox: (
      <BeforeAfter
        before={<Select options={opts} value={cbo} onChange={setCbo} placeholder="Select (검색 불가)" />}
        after={<Combobox options={opts} value={cbo} onChange={setCbo} placeholder="Combobox (타이핑 검색)" />}
      />
    ),
    Progress: (
      // 단독(신규) — 결정형(%) 진행. 끝 모르는 로딩은 Spinner(대체 아님, 별개 축).
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">결정형 진행률(0~100). 끝 모르는 로딩은 Spinner.</Text>
        <div style={{ width: 320 }}><Progress value={68} /></div>
      </Stack>
    ),
    TimePicker: (
      // 단독(신규) — 시각 입력 축(날짜=DatePicker와 별개).
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">시각 입력(HH:MM).</Text>
        <TimePicker value={time} onChange={setTime} />
      </Stack>
    ),
    Stat: (
      // 단독(신규) — SummaryCard와 형제. 건수/금액 요약=SummaryCard, 단일 지표+추세=Stat.
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">단일 지표 + 추세·델타(SummaryCard와 형제).</Text>
        <div style={{ width: 240 }}><Stat label="이번 달 매출" value="₩34,000,000" trend="up" delta="12.4%" icon="check-circle" /></div>
      </Stack>
    ),
    Stepper: (
      // 단독(신규) — 다단계 진행 표시(controlled active). 단계 콘텐츠는 호출측이 active로 분기.
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">등록 마법사 등 다단계 흐름. 노드 클릭으로 이동.</Text>
        <Stepper active={stp} onStepClick={setStp} steps={[{ label: '기본 정보' }, { label: '연락처' }, { label: '확인' }]} />
      </Stack>
    ),
    Transfer: (
      // 단독 부품(신규) — MultiSelect와 독립. 대량 항목을 양쪽 리스트로 옮길 때(MultiSelect=인라인 태그 다중).
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">대량 항목 양쪽 배정(MultiSelect와 독립)</Text>
        <div style={{ width: 640 }}>
          <Transfer items={XFER_ITEMS} selected={xfer} onChange={setXfer} titles={['자재 후보', '선택 자재']} />
        </div>
      </Stack>
    ),
    TreeSelect: (
      // 단독 부품(신규) — Tree와 독립. Tree=파인더/표시(HierarchyExplorer·dev 좌측 패널), TreeSelect=노드를 값으로 고르는 입력.
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">계층에서 노드 하나를 값으로 선택(Tree와 독립)</Text>
        <TreeSelect nodes={SAMPLE_TREE} value={tsel} onChange={setTsel} placeholder="디렉토리 선택" />
      </Stack>
    ),
    Cascader: (
      // 순차 인라인 — 한 칸 고르면 다음 칸 등장(깊이=칸 수). 리프 선택 시 "A › B › C [변경]"으로 압축.
      //  드롭다운 박스는 MillerColumns와 같은 컬럼-아이템 레이아웃(Select 아님). 한 트리거+다단은 MillerColumns(형제).
      <Stack gap="xxs">
        <Text variant="caption" color="secondary">서울 → 강남구 → 삼성동 순으로 칸이 늘어난다(페이지에 N박스, 공간 여유용).</Text>
        <Cascader options={CASC_OPTS} value={casc} onChange={setCasc} placeholder="지역 선택" />
      </Stack>
    ),
    MillerColumns: (
      // 트리거 1개 → 팝오버 다단 컬럼(좌→우, 부모 클릭=다음 컬럼). 좁은 화면(≤600px)은 단일 컬럼 드릴인 폴백. 페이지 발자국 최소.
      <Stack gap="md">
        <Stack gap="xxs">
          <Text variant="caption" color="secondary">트리거 1개 → 팝오버에서 좌→우 컬럼으로 좁혀 경로 선택(Finder·Ant Cascader 패턴). 브라우저 폭 ≤600px면 단일 컬럼 드릴인.</Text>
          <MillerColumns options={CASC_OPTS} value={mcol} onChange={setMcol} placeholder="지역 선택" />
        </Stack>
        {/* 완료 브레드크럼 말줄임 검증 — 깊은 경로(6단)를 좁은 셀(240px)에 넣었다. 브레드크럼은 말줄임(전체경로는 hover),
            변경 버튼은 flex-shrink:0로 항상 노출. 트리거 클릭=재오픈. 폭을 더 줄여도 안 깨진다. */}
        <Stack gap="xxs">
          <Text variant="caption" color="secondary">좁은 셀(240px) + 깊은 경로 → 브레드크럼 말줄임(…전체경로 hover) · 변경 항상 노출. 폭 무관 안 깨짐.</Text>
          <div style={{ width: 240, border: '1px solid var(--border-default)', borderRadius: 'var(--mantine-radius-sm)', padding: '6px 8px', overflow: 'hidden' }}>
            <MillerColumns options={MCOL_DEEP} value={mcolDeep} onChange={setMcolDeep} placeholder="분류 선택" />
          </div>
        </Stack>
      </Stack>
    ),
    SearchToolbar: (
      // 세로 비교(전체폭) — SearchToolbar는 가로로 길어 2열 비교에 넣으면 wrap돼 행이 쌓인다. 실제는 한 줄.
      <Stack gap="md">
        <Stack gap="xxs">
          <Group gap="xs" align="center"><Badge color="neutral">기존</Badge><Text variant="caption" color="secondary">ListPage 죽은 필터 버튼(동작 없음)</Text></Group>
          <Group gap="xs" align="center"><Button variant="secondary" disabled>필터</Button></Group>
        </Stack>
        <Stack gap="xxs">
          <Group gap="xs" align="center"><Badge color="success">수정안</Badge></Group>
          <SearchToolbar searchValue={stbSearch} onSearchChange={setStbSearch} searchPlaceholder="거래처 검색" filters={[{ key: 'status', label: '상태', options: [{ label: '활성', value: 'active' }, { label: '휴면', value: 'dormant' }], value: stbStatus, onChange: setStbStatus }]} />
        </Stack>
      </Stack>
    ),
    ToastHost: (
      <Stack gap="xs">
        <Text variant="caption" color="secondary">notify.* 트리거 — 호스트=ToastHost(위치·지속 단일 관리)</Text>
        <Group gap="xs" wrap>
          <Button variant="secondary" onClick={() => notify.success('저장되었습니다')}>성공</Button>
          <Button variant="danger" onClick={() => notify.danger('삭제 실패')}>실패</Button>
          <Button variant="ghost" onClick={() => notify.info('동기화 중')}>정보</Button>
        </Group>
      </Stack>
    ),
    Menu: <Menu trigger={<IconButton icon="dots-vertical" label="메뉴" variant="secondary" />} items={[{ label: '수정', icon: 'edit', onClick: () => {} }, { label: '복제', icon: 'copy', onClick: () => {} }, { label: '삭제', icon: 'trash', variant: 'danger', onClick: () => {} }]} />,
    ObjectCard: <div style={{ width: 260, height: 300 }}><ObjectCard title="스테인리스 자유경첩 4″" subtitle="HG-SS-4F" thumbnail={IMG_SRC} status={{ label: '판매중', tone: 'success' }} headline={{ label: '단가', value: won(3200, '개'), type: 'text', note: { label: '변경요청중', tone: 'warning' } }} attributes={[{ label: '규격', value: '4″', type: 'text' }, { label: '재질', value: 'STS304', type: 'text' }]} actions={[{ label: '수정', icon: 'edit', onClick: () => {} }, { label: '삭제', variant: 'danger', icon: 'trash', onClick: () => {} }]} /></div>,
    Tree: <div style={{ width: 300 }}><Tree nodes={SAMPLE_TREE} selectedId={treeSel} expandedIds={treeExp} onSelect={setTreeSel} onToggle={toggleExp} title="디렉토리" editable onAddRoot={() => {}} onRename={() => {}} onDelete={() => {}} /></div>,
    HierarchyCollector: (
      <HierarchyCollector
        title="발주 작성"
        description="분류를 횡단하며 담고, 우측에서 분류별로 편집 · 발주는 하단"
        actions={[{ label: '임시저장', variant: 'secondary', onClick: () => {} }, { label: '발주', variant: 'primary', onClick: () => {} }]}
        catalogs={COLLECTOR_CATALOGS}
        products={COLLECTOR_PRODUCTS}
        cart={colCart}
        onCartChange={setColCart}
        showAmount
        onProductClick={() => {}}
      />
    ),
    HierarchyExplorer: (() => {
      // 제품 클릭 → 상세(Modal)는 *소비처* 책임 — 부품(HE/ObjectCard)은 onClick만 노출하고 상세에 뭐가 들었는지 모른다(헌법 1).
      //  데모에선 onClick에 상세 Modal 열기를 배선해 목록 항목이 interactive함을 보인다(액션 케밥은 별개).
      //  · 부자재(d1) 선택 시 하위 분류 타일 + 직속 제품 목록이 함께 보인다(잎/폴더 이분법 없음).
      //  · 추가는 우측 ＋ 드롭다운(제품/분류) → 종류만 정하고 이름 입력은 소비처 모달이 받는다(완전 위임).
      const withDetail = (objs: HierarchyObject[]) => objs.map((o) => ({ ...o, onClick: () => setHxDetail(o) }));
      const doAdd = () => {
        const name = addName.trim();
        if (!name || !treeSel) { setAddKind(null); return; }
        if (addKind === 'dir') {
          const id = `${treeSel} > ${name}`;
          setHxNodes((ns) => addChildNode(ns, treeSel, { id, label: name }));
          setTreeExp((e) => (e.includes(treeSel) ? e : [...e, treeSel]));
        } else {
          const id = `${treeSel}#p-${name}`;
          setHxObjMap((m) => ({ ...m, [treeSel]: [...(m[treeSel] ?? []), { id, title: name, icon: 'package', headline: { label: '단가', value: '견적 필요', type: 'text' } }] }));
        }
        setAddKind(null); setAddName('');
      };
      return (
        <>
          <HierarchyExplorer
            title="품목 카탈로그" description="분류별 부자재 제품 등록 (kk ERP)"
            nodes={hxNodes} selectedId={treeSel} expandedIds={treeExp} onSelect={setTreeSel} onToggle={toggleExp}
            editable treeTitle="분류" selectedLabel="제품"
            // 선택 디렉토리의 직속 제품(하위 분류와 공존 가능). 없으면 [] → 빈상태.
            objects={withDetail(hxObjMap[treeSel ?? ''] ?? [])}
            onAddObject={() => { setAddName(''); setAddKind('product'); }}
            onAddChild={() => { setAddName(''); setAddKind('dir'); }}
            // 전역 검색 — 입력 시 결과 모드(각 결과에 경로). 디렉토리 선택 후 위 검색칸에 '경첩' 입력해보면 보인다.
            searchQuery={hxSearch}
            onSearchChange={setHxSearch}
            searchResults={Object.entries(hxObjMap).flatMap(([dirId, list]) => {
              const p = pathOf(hxNodes, dirId) ?? [];
              return list.filter((o) => o.title.includes(hxSearch)).map((o) => ({ ...o, path: p, onClick: () => setHxDetail(o) }));
            })}
          />
          {/* 제품/분류 추가 모달(소비처 조립) — HE의 ＋ 드롭다운은 종류만 정하고, 이름 입력은 소비처 몫(헌법 1). */}
          <Modal opened={addKind != null} onClose={() => setAddKind(null)} title={addKind === 'dir' ? '분류 추가' : '제품 추가'}
            actions={[{ label: '취소', variant: 'ghost', onClick: () => setAddKind(null) }, { label: '추가', variant: 'primary', onClick: doAdd }]}>
            <FormField label={addKind === 'dir' ? '분류 이름' : '제품명'}>
              <TextInput value={addName} onChange={setAddName} placeholder={addKind === 'dir' ? '예: 특수 경첩' : '예: 스테인리스 경첩 5″'} />
            </FormField>
          </Modal>
          {/* 상세 모달(소비처 조립) — 클릭한 제품의 역할 슬롯을 그대로 펼친다. 수정·삭제는 *여기서* 한다(목록 케밥 폐기). */}
          <Modal opened={hxDetail != null} onClose={() => setHxDetail(null)} title={hxDetail?.title ?? ''}
            actions={[
              { label: '닫기', variant: 'ghost', onClick: () => setHxDetail(null) },
              { label: '수정', icon: 'edit', onClick: () => notify.info('수정 — 소비처 폼에 연결') },
              { label: '삭제', variant: 'danger', icon: 'trash', onClick: () => {
                if (!hxDetail) return;
                setHxObjMap((m) => Object.fromEntries(Object.entries(m).map(([k, list]) => [k, list.filter((o) => o.id !== hxDetail.id)])));
                setHxDetail(null);
              } },
            ]}>
            <Stack gap="sm">
              {hxDetail?.subtitle && <Text variant="caption" color="secondary">{hxDetail.subtitle}</Text>}
              {hxDetail?.status && <div><Badge color={hxDetail.status.tone}>{hxDetail.status.label}</Badge></div>}
              <Divider />
              <Stack gap="xs">
                {hxDetail?.headline && (
                  <Group justify="between"><Text variant="body" color="secondary">{hxDetail.headline.label}</Text><Text variant="body-strong">{String(hxDetail.headline.value)}</Text></Group>
                )}
                {hxDetail?.attributes?.map((a, i) => (
                  <Group key={i} justify="between"><Text variant="body" color="secondary">{a.label}</Text><Text variant="body">{String(a.value)}</Text></Group>
                ))}
              </Stack>
            </Stack>
          </Modal>
        </>
      );
    })(),
    SectionHeader: <div style={{ width: 360 }}><Card variant="elevated" padding="md"><SectionHeader title="강남 현장" description="rev.2 · 2026-05-02 등록" divider actions={[{ label: '추가', variant: 'primary', icon: 'plus', onClick: () => {} }]} /></Card></div>,
    Breadcrumb: <Breadcrumb items={[{ label: '현장', onClick: () => {} }, { label: '강남 현장', onClick: () => {} }, { label: '도면' }]} />,
    PeriodNavigator: <PeriodNavigator label={`2026년 ${ledgerMonth}월`} onPrev={() => setLedgerMonth((m) => Math.max(1, m - 1))} onNext={() => setLedgerMonth((m) => Math.min(12, m + 1))} disabledPrev={ledgerMonth <= 1} disabledNext={ledgerMonth >= 12} />,
    LedgerPage: (() => {
      // 정산 데모(kk ERP) — 기간·KPI밴드·분해(품목별/발주별)·드릴(Drawer). 발주별에서 행 클릭 → 라인 상세.
      const isItem = ledgerTab === 'item';
      const columns = isItem
        ? [
            { key: 'name', label: '품목명', type: 'text' as const },
            { key: 'qty', label: '수량', type: 'number' as const },
            { key: 'amount', label: '금액 합계', type: 'currency' as const },
          ]
        : [
            { key: 'no', label: '발주번호', type: 'text' as const },
            { key: 'vendor', label: '거래처', type: 'text' as const },
            { key: 'amount', label: '금액', type: 'currency' as const },
            { key: 'status', label: '상태', type: 'badge' as const, badgeColors: { '정산완료': 'success' as const, '미정산': 'warning' as const } },
          ];
      const rows = isItem
        ? [{ id: 'i1', name: '모니터암', qty: 2, amount: 12323 }]
        : [
            { id: 'PO-2026-0612', no: 'PO-2026-0612', vendor: '㈜대한철물', amount: 12323, status: '정산완료' },
            { id: 'PO-2026-0613', no: 'PO-2026-0613', vendor: '세양하드웨어', amount: 45000, status: '미정산' },
          ];
      return (
        <LedgerPage
          title="정산"
          description="월별 정산 현황 (kk ERP)"
          actions={[{ label: '명세서 다운로드', variant: 'secondary', icon: 'upload', onClick: () => {} }]}
          period={{ label: `2026년 ${ledgerMonth}월`, onPrev: () => setLedgerMonth((m) => Math.max(1, m - 1)), onNext: () => setLedgerMonth((m) => Math.min(12, m + 1)), disabledPrev: ledgerMonth <= 1, disabledNext: ledgerMonth >= 12 }}
          metrics={[
            { kind: 'stat', label: '정산 총액', value: fmtCurrency(12323), trend: 'up', delta: '전월 +8%', icon: 'wallet' },
            { kind: 'summary', label: '미정산 잔액', icon: 'credit-card', tone: 'warning', amount: 45000 },
            { kind: 'summary', label: '정산 완료', icon: 'check-circle', tone: 'success', count: 1, amount: 12323 },
            { kind: 'summary', label: '정산 대기', icon: 'clock', tone: 'neutral', count: 1 },
          ]}
          breakdown={{
            tabs: [{ label: '품목별', value: 'item' }, { label: '발주별', value: 'order' }],
            value: ledgerTab, onChange: setLedgerTab,
            columns, rows, total: isItem ? 12323 : 57323,
            onRowClick: isItem ? undefined : (row) => setLedgerSel(String(row.no)),
            emptyState: { icon: 'wallet', title: '정산 내역이 없습니다' },
          }}
          detail={{
            opened: ledgerSel != null,
            onClose: () => setLedgerSel(null),
            title: ledgerSel ?? '',
            actions: [{ label: '명세서 출력', icon: 'receipt', onClick: () => {} }, { label: '정산 확정', variant: 'primary', onClick: () => {} }],
            content: (
              <Stack gap="md">
                <StatusRow label="세양하드웨어" status={{ label: '미정산', tone: 'warning' }} />
                <Text variant="caption" color="secondary">발주일 2026-06-13 · 3품목</Text>
                <Divider />
                <Stack gap="xs">
                  <Group justify="between"><Text variant="body">모니터암 ×2</Text><Text variant="body">{fmtCurrency(12323)}</Text></Group>
                  <Group justify="between"><Text variant="body">경첩 4″ ×5</Text><Text variant="body">{fmtCurrency(16000)}</Text></Group>
                  <Group justify="between"><Text variant="body">레일 ×4</Text><Text variant="body">{fmtCurrency(16677)}</Text></Group>
                </Stack>
                <TotalRow amount={45000} />
              </Stack>
            ),
          }}
        />
      );
    })(),
    Bento: (() => {
      // 고정 셀을 보이게 가득 채우는 데모 타일.
      const cell = (t: string) => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mantine-color-primary-1)', color: 'var(--text-primary)', borderRadius: 'var(--mantine-radius-xs)', fontSize: 13 }}>{t}</div>;
      return (
        <Bento columns={4} gap="md">
          <Bento.Tile colSpan={1}>{cell('1×1')}</Bento.Tile>
          <Bento.Tile colSpan={2}>{cell('colSpan 2')}</Bento.Tile>
          <Bento.Tile colSpan={1} rowSpan={2}>{cell('1×2')}</Bento.Tile>
          <Bento.Tile colSpan={3}>{cell('colSpan 3')}</Bento.Tile>
        </Bento>
      );
    })(),
    CalendarPage: <CalDemo />,
    BoardList: <BoardListDemo />,
    BoardView: <BoardViewDemo />,
    BoardWrite: <BoardWriteDemo />,
    PageShell: (
      <PageShell
        title="발주 관리"
        meta={[{ kind: 'badge', label: '이번 달', tone: 'info' }]}
        actions={[{ label: '신규 발주', variant: 'primary', icon: 'plus', onClick: () => {} }]}
        tiles={[
          { id: 's1', colSpan: 3, content: <SummaryCard label="승인 대기" icon="clock" tone="warning" count={12} amount={3400000} /> },
          { id: 's2', colSpan: 3, content: <SummaryCard label="확정" icon="check-circle" tone="success" count={48} amount={18200000} /> },
          { id: 's3', colSpan: 3, content: <SummaryCard label="반려" icon="x-circle" tone="danger" count={3} /> },
          { id: 's4', colSpan: 3, content: <Stat label="발주액" value={fmtCurrency(12840000)} trend="up" delta="전월 +8.2%" icon="chart-bar" /> },
          { id: 'l1', colSpan: 8, rowSpan: 2, content: (
            <Card variant="elevated" padding="none" fill>
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <DataTable
                  columns={[
                    { key: 'no', label: '발주번호', type: 'text' },
                    { key: 'vendor', label: '거래처', type: 'text' },
                    { key: 'amount', label: '금액', type: 'currency' },
                  ]}
                  rows={[
                    { id: '1', no: 'PO-2026-0612', vendor: '㈜대한철물', amount: 1200000 },
                    { id: '2', no: 'PO-2026-0613', vendor: '세양하드웨어', amount: 880000 },
                  ]}
                  status="ready" />
              </div>
            </Card>
          ) },
          { id: 'r1', colSpan: 4, content: <SummaryCard label="미수금" icon="wallet" tone="warning" count={7} amount={4300000} /> },
          { id: 'r2', colSpan: 4, content: <Stat label="평균 리드타임" value="6.2일" icon="clock" /> },
        ]}
      />
    ),
    Money: (
      <Stack gap="xs">
        <Group gap="lg"><Money value={1284000} /><Money value={1284000} symbol={false} /><Money value={412} unit="장" /></Group>
        {/* 음수 셋: 화면(−) / 장표(△) / 영문((n)). 관행이 하나가 아니라 셋을 닫아서 연다. */}
        <Group gap="lg"><Money value={-3450000} /><Money value={-3450000} negative="triangle" /><Money value={-3450000} negative="paren" tone="plain" /></Group>
        {/* 0과 없음은 다른 축: zero='dash'여도 null은 그대로 —. */}
        <Group gap="lg"><Money value={0} /><Money value={0} zero="dash" /><Money value={null} /><Money value={1284000} emphasis /></Group>
      </Stack>
    ),
    RegisterWidget: <RegisterDemo />,
    OpenItemListWidget: <OpenItemDemo />,
    AgingReportWidget: <AgingDemo />,
    PaymentApplyWidget: <PaymentApplyDemo />,
    Editor: <EditorDemo />,
    RichText: <RichTextDemo />,
  };

  return <>{D[name] ?? <Text variant="caption" color="secondary">예시 준비 중</Text>}</>;
}
