// ─────────────────────────────────────────────────────────────
// 배럴. 바깥 세계가 보는 유일한 문은 '@/ui' 하나다.
// ─────────────────────────────────────────────────────────────

// 표시·행동 원자
export { Button } from './Button';
export { Badge } from './Badge';
export { CountBadge } from './CountBadge';
export { Chip } from './Chip';
export { Text } from './Text';
export { Title } from './Title';
export { Label } from './Label';
export { Anchor } from './Anchor';
export { Icon, type IconName } from './Icon';
export { Avatar } from './Avatar';
export { Image } from './Image';
export { Tooltip } from './Tooltip';
export { Popover } from './Popover';
export { Spinner } from './Spinner';
export { Skeleton } from './Skeleton';
export { Progress } from './Progress';
export { SegmentedControl } from './SegmentedControl';
export { TabBar } from './TabBar';

// 입력군
export { TextInput } from './TextInput';
export { PasswordInput } from './PasswordInput';
export { NumberInput } from './NumberInput';
export { CurrencyInput } from './CurrencyInput';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Combobox } from './Combobox';
export { DatePicker } from './DatePicker';
export { MultiDatePicker } from './MultiDatePicker';
export { TimePicker } from './TimePicker';
export { Checkbox } from './Checkbox';
export { Switch } from './Switch';
export { Radio } from './Radio';

// 레이아웃 원자
export { Card } from './Card';
export { Divider } from './Divider';
export { Container } from './Container';
export { Page } from './Page';   // 페이지 폭 규율(1200 캡+중앙) — AppShell 아래 모든 화면 공통 래퍼

// 배치 프리미티브
export { Stack } from './Stack';
export { Group } from './Group';
export { Grid } from './Grid';
export { Bento } from './Bento';   // 페이지 본문 격자(전 PageGrid) — 위젯 타일 배치

// 분자 6
export { FormField } from './FormField';
export { MultiSelect } from './MultiSelect';
export { DateRangeField } from './DateRangeField';
export { InputGroup } from './InputGroup';
export { NumberStepper } from './NumberStepper';
export { FileUploader, type FileItem } from './FileUploader';
export { Pagination } from './Pagination';
export { Callout } from './Callout';
export { StatusRow } from './StatusRow';
export { SummaryCard } from './SummaryCard';
export { TotalRow } from './TotalRow';
export { Menu } from './Menu';
export { ObjectCard, type ObjectField } from './ObjectCard';
export { SectionHeader } from './SectionHeader';
export { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
export { Collapsible } from './Collapsible';
export { Accordion, type AccordionItem } from './Accordion';
export { Stat } from './Stat';
export { PeriodNavigator } from './PeriodNavigator';
export { TreeSelect } from './TreeSelect';
export { Cascader, type CascaderOption } from './Cascader';
export { MillerColumns, type MillerOption } from './MillerColumns';
export { SearchToolbar } from './SearchToolbar';
export { Editor, type EditorFeature } from './Editor';   // 리치 텍스트 작성기(TipTap 흡수)
export { RichText } from './RichText';                    // 작성물(HTML) 읽기 뷰어 — Editor의 짝

// 유기체
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { PaperModal } from './PaperModal';
export { Stepper } from './Stepper';
export { Transfer } from './Transfer';
export { ToastHost } from './ToastHost';
export { DataTable } from './DataTable';
export { ListWidget, type ListColumn, type ListRow } from './ListWidget';  // TanStack 흡수 목록 위젯(ListPage 대체 MVP)
export { NotificationPanel, type NotifItem, type NotifTone } from './NotificationPanel';  // 알림 벨 Popover 슬롯 위젯
export { Repeater } from './Repeater';  // 저작 툴킷 척추 — 가변 레코드 목록(추가/삭제/펼침)
export { InheritedValueField, type RefOption } from './InheritedValueField';  // 참조+상속+override 봉인(§4.1)
export { ExpressionField, type ExprVariable, type ExprFunction } from './ExpressionField';  // 닫힌 DSL 수식 편집기
export { KeyValueField, type KVKey } from './KeyValueField';  // 닫힌 키 맵 편집(dim_adjustments 류)
export { AssignPicker, type AssignTemplate } from './AssignPicker';  // 옵션세트 kind별 배정 + 재적용 경고
export { LineItemList, type LineItem } from './LineItemList';
export { EmptyState } from './EmptyState';
export { PageHeader } from './PageHeader';
export { DescriptionList } from './DescriptionList';
export { AppShell } from './AppShell';
export { Timeline } from './Timeline';
export { Calendar } from './Calendar';
export { IconButton } from './IconButton';
export { Tree, type TreeNodeData } from './Tree';
export { FieldGrid, type FieldGridCell } from './FieldGrid';

// 템플릿 + 폼 조립 (스키마 구동)
export { FormSection } from './FormSection';
export { ListPage } from './ListPage';
export { DetailPage } from './DetailPage';
export { HierarchyExplorer, type HierarchyObject } from './HierarchyExplorer';
export { HierarchyCollector, type CollectorCatalog, type CollectorProduct, type CollectorCartItem } from './HierarchyCollector';
export { LedgerPage, type LedgerMetric, type LedgerBreakdown, type LedgerDetail } from './LedgerPage';
export { CalendarPage, type CalendarEvent, type CalendarEncoding, type CalendarColorRole, type CalendarAnnotation, type CalendarHoliday } from './CalendarPage';
export { BoardList, type BoardPost } from './BoardList';
export { BoardView, type BoardComment, type BoardAttachment } from './BoardView';
export { BoardWrite, type AudienceNode } from './BoardWrite';
export { buildHierarchyFromRows, type HierarchyImport } from './hierarchyImport';
export type { DataTableColumn, DataTableRow, DataTableSort } from './DataTable';

// 유기체 공유 타입 (스키마 작성자가 쓰는 어휘)
export type { CellType, Action, ActionVariant, BadgeColor } from './_cells';

// App Router 배선 (src/ui 안에서만 @mantine/core를 만질 수 있어 여기서 노출)
export { Providers } from './Providers';
export { notify } from './notify';
export { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

// 0~1단계 시각 검증용 dev 프리뷰 (DSL 부품 아님)
// ── dev 갤러리(DevTokenPreview/DevAtomGallery/…)는 공개 API 아님 — 검증용 도구.
//    데모 앱은 './_dev'에서 import하고, publish 시 _dev·_Dev*는 제외(.npmignore).
