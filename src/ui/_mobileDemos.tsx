'use client';
// ─────────────────────────────────────────────────────────────────────────
// _mobileDemos — 모바일 계열 라이브 예시 **단일 출처**.
//
//  왜 _registry와 갈라져 있나: 데스크탑 부품은 박물관 페이지 안에 그대로 렌더할 수 있지만
//  Mobile*은 못 한다. 세 가지가 걸린다 —
//   ① `.ms` 스코프가 있어야 타이포·터치타깃·--surface-input이 산다(셸 스코프가 값을 깐다)
//   ② 뷰포트가 폰 폭이어야 미디어쿼리·useMediaQuery가 맞게 발화한다(/dev/preview가 iframe을 쓰는 이유와 동일)
//   ③ MobileShell이 html.erp-mobile-lock으로 문서 스크롤을 잠근다 — 박물관 페이지 안에 넣으면 그 페이지가 죽는다
//  → 그래서 모바일 예시는 **자기 주소(/shell/m/part/[name])를 갖고 iframe 안에서** 산다.
//    박물관 상세(/dev/part/[name])는 그 주소를 폰 프레임으로 임베드만 한다.
//
//  이전 상태: _registry의 Mobile* 14항목이 전부 "→ /shell/mobile 에서 라이브" 링크 한 줄이었다.
//   부품 하나를 보려면 셸 데모의 4탭을 손으로 통과해야 했고, 상태(포커스·에러·빈 상태)는 조작해야만 보였다.
//
//  · 데이터는 _devFixtures 한 벌(여기서 만들지 않는다 — 만들면 4탭 데모와 두 벌이 된다).
//  · bare: 데모가 자기 MobileShell을 직접 그리는 경우. 아니면 캔버스가 셸로 감싼다.
//  · dev 전용(publish 제외).
// ─────────────────────────────────────────────────────────────────────────
import { useState, type ReactNode, type CSSProperties } from 'react';
import { mobileTypoVars } from './theme';
import { useMobileScope } from './_mobileScope';
import { MobileShell } from './MobileShell';
import { MobileSection } from './MobileSection';
import { MobileListRow } from './MobileListRow';
import { MobileStatRow } from './MobileStatRow';
import { MobileDisclosure } from './MobileDisclosure';
import { MobileField } from './MobileField';
import { MobileChoice } from './MobileChoice';
import { MobilePhotoPicker } from './MobilePhotoPicker';
import { MobileCalendar } from './MobileCalendar';
import { MobileComment } from './MobileComment';
import { MobileComposer } from './MobileComposer';
import { MobileFileRow } from './MobileFileRow';
import { MobileBoardList } from './MobileBoardList';
import { MobileBoardView } from './MobileBoardView';
import { MobileBoardWrite } from './MobileBoardWrite';
import { MobileSegment } from './MobileSegment';
import { MobileDecisionBar } from './MobileDecisionBar';
import { MobileBottomSheet } from './MobileBottomSheet';
import { MobileConfirm } from './MobileConfirm';
import { MobileFilterBar, type FilterAxis } from './MobileFilterBar';
import { MobileRecordList } from './MobileRecordList';
import { MobilePullToRefresh } from './MobilePullToRefresh';
import type { DataTableColumn, DataTableRow } from './DataTable';
import { MobileAttachmentViewer } from './MobileAttachmentViewer';
import { MobilePaperViewer } from './MobilePaperViewer';
import { MobileStepTrail, type TrailStep } from './MobileStepTrail';
import { MobileList } from './MobileList';
import { TextInput } from './TextInput';
import { Textarea } from './Textarea';
import { Text } from './Text';
import { Title } from './Title';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icon';
import { Switch } from './Switch';
import { RichText } from './RichText';
import type { FileItem } from './FileUploader';
import type { BoardComment } from './BoardView';
import {
  TABS, POSTS, CATS, COMMENTS, POST_HTML, AUDIENCES, ATTACHMENTS, VIEWER_ITEMS,
  SITE_EVENTS, SITE_ENCODING, SITE_ANNOS, monthLabel, shiftMonth,
  PAPER_ROWS, PAPER_FIELDS, PAPER_VALUES,
} from './_devFixtures';

export type MobileDemoDef = {
  render: () => ReactNode;
  bare?: boolean;     // 데모가 MobileShell을 직접 소유한다(캔버스가 감싸지 않는다)
  note?: string;      // 캔버스 밖(박물관 상세)에 적히는 한 줄 — "여기서 무엇을 보라"
  screen?: boolean;   // 부품이 아니라 *화면* — 좌측 트리의 '화면' 그룹에 뜬다
  label?: string;     // 화면의 표시 이름(부품은 이름 자체가 라벨이라 안 쓴다)
};

/* ── 기초 골격 ─────────────────────────────────────────────────────────── */

function ShellDemo() {
  const [tab, setTab] = useState('/board');
  return (
    <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}
      header={{
        title: '헤더 행 제목',
        onBack: () => {},
        actions: [{ label: '글쓰기', onClick: () => {} },
                  { label: '더보기', icon: 'dots-vertical', iconOnly: true, onClick: () => {} }],
      }}
      bottom={<div style={{ padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)' }}>
        <Button variant="primary" fullWidth onClick={() => {}}>하단 고정 슬롯</Button>
      </div>}>
      <MobileSection title="본문">
        <Text variant="body">
          셸은 세 자리를 내준다 — 헤더 행(항상 있다), 본문(유일한 스크롤 영역), 하단 고정.
          탭바는 그 아래 별도 층이라 하단 슬롯과 다투지 않는다.
          헤더의 텍스트 액션은 accent(안 채움)이고, 채운 버튼은 하단 커밋 전용이다.
        </Text>
      </MobileSection>
      <MobileSection flush>
        {Array.from({ length: 12 }, (_, i) => (
          <MobileListRow key={i} title={`스크롤 확인용 행 ${i + 1}`} meta="본문만 스크롤된다" />
        ))}
      </MobileSection>
    </MobileShell>
  );
}

/* 헤더 행 4형(고정 제목 / 뒤로+제목 / 값 제목 / 빈 헤더)을 **나란히 놓는 데모는 만들 수 없다** —
   .ms가 height:100dvh이고 erp-mobile-lock이 문서 스크롤을 잠가서 폰 캔버스에 셸을 여러 개 못 쌓는다.
   대신 그 넷이 통합 화면(/shell/m 4탭)에 이미 다 있고, 거기서만 확인 가능한 것이 정확히 이 설계의
   주장이다 — **header를 안 준 탭과 준 탭의 본문 시작선이 같다.** 부품 캔버스에서는 확인 불가라
   ShellDemo가 한 형태만 보이고 note가 나머지를 가리킨다. */

function SectionDemo() {
  return (
    <>
      <MobileSection title="제목 있는 묶음">
        <Text variant="body">자유 슬롯. 기본은 사방 여백.</Text>
      </MobileSection>
      <MobileSection title="액션 있는 헤더" action={<Text variant="caption" color="secondary">전체보기</Text>}>
        <Text variant="body">액션이 있으면 헤더가 대칭 행이 된다.</Text>
      </MobileSection>

      {/* 구간 경계 3축 — 선 / 여백 / 없음 */}
      <MobileSection title="separator: line (기본)" flush>
        <MobileListRow title="행 사이는 들여쓴 선" meta="구간 사이는 전체 너비 선" />
        <MobileListRow title="행 2" meta="마지막 행의 선은 지워진다" />
      </MobileSection>
      <MobileSection title="separator: space" separator="space" flush>
        <MobileListRow title="위와 선 없이 여백으로만 나뉜다" meta="TDS Border height16과 같은 방식" />
        <MobileListRow title="행 2" />
      </MobileSection>
      <MobileSection title="separator: none" separator="none" flush>
        <MobileListRow title="앞 구간과 이어지는 한 덩어리" />
      </MobileSection>

      {/* 밀도 3단 */}
      <MobileSection title="density: compact" density="compact" flush>
        <MobileListRow title="촘촘한 행" meta="상하 xs" />
        <MobileListRow title="촘촘한 행" meta="결재함처럼 정보가 많은 화면" />
      </MobileSection>
      <MobileSection title="density: loose" density="loose" flush>
        <MobileListRow title="여유로운 행" meta="상하 lg" />
        <MobileListRow title="여유로운 행" meta="설정처럼 항목이 적은 화면" />
      </MobileSection>
    </>
  );
}

function ListRowDemo() {
  return (
    <MobileSection flush>
      <MobileListRow title="제목만 있는 행" />
      <MobileListRow title="메타가 붙은 행" meta="김서연 · 인사팀 · 06.24" />
      <MobileListRow title="배지 줄이 붙은 행" meta="06.20"
        badges={<><Badge color="neutral">업무</Badge><Badge color="danger">필독</Badge></>} />
      <MobileListRow title="좌측 슬롯 + 우측 값" meta="첨부 2건"
        leading={<Icon name="file" size="sm" color="secondary" />}
        trailing={<Text variant="caption" color="secondary">1,240,000</Text>} />
      <MobileListRow title="눌리는 행 — chevron이 생긴다" meta="onClick이 있으면 버튼" onClick={() => {}} />
      <MobileListRow title="아직 안 본 행 (emphasis)" meta="굵기 한 단만 올린다" emphasis onClick={() => {}} />
      {/* unread — 제목 *앞* 인라인. 아래 행들과 제목 시작선이 같아야 한다(06 §3-7).
          emphasis와 따로 켤 수 있다: 굵기 없이 점만도 가능하다. */}
      <MobileListRow title="안 읽음 — 점 + 굵기" meta="둘은 다른 prop이다" unread emphasis onClick={() => {}} />
      <MobileListRow title="안 읽음 — 점만" meta="굵기 없이도 켜진다" unread onClick={() => {}} />
      {/* leading이 있으면 점이 그 모서리로 옮겨간다(같은 요소·같은 낭독 문구). */}
      <MobileListRow title="좌측 슬롯이 있을 때" meta="점이 아바타 모서리로 간다" unread
        leading={<Avatar size="sm">옥</Avatar>} onClick={() => {}} />
      <MobileListRow title="trailing 슬롯에 스위치" meta="onClick 없으면 정적 행"
        trailing={<Switch checked onChange={() => {}} />} />
      {/* actions — 행이 컨테이너가 되고 [본체 | 액션]이 형제로 선다. chevron은 사라진다. */}
      <MobileListRow title="그 자리 액션 1개" meta="본체를 누르면 진입, 우측은 액션" onClick={() => {}}
        actions={[{ label: '재요청', icon: 'refresh', iconOnly: true, variant: 'ghost', onClick: () => {} }]} />
      <MobileListRow title="그 자리 액션 2개 (상한)" meta="셋째는 타입이 막는다" onClick={() => {}}
        actions={[
          { label: '승인', icon: 'check', iconOnly: true, variant: 'ghost', onClick: () => {} },
          { label: '반려', icon: 'x', iconOnly: true, variant: 'ghost', onClick: () => {} },
        ]} />
      <MobileListRow title="액션만 (진입 없음)" meta="onClick이 없으면 본체는 정적"
        actions={[{ label: '삭제', icon: 'trash', iconOnly: true, variant: 'ghost', onClick: () => {} }]} />
    </MobileSection>
  );
}

function StatRowDemo() {
  return (
    <>
      <MobileSection flush>
        <MobileStatRow items={[
          { label: '진행 중', value: '12건', onClick: () => {} },
          { label: '승인 대기', value: '3건', sub: '2건 지연', tone: 'danger', onClick: () => {} },
          { label: '이번 달', value: '48건', sub: '+12%', tone: 'success' },
        ]} />
      </MobileSection>
      <MobileSection title="2칸" flush>
        <MobileStatRow items={[
          { label: '미결', value: '7건', tone: 'warning', sub: '오늘 마감 2' },
          { label: '완료', value: '135건' },
        ]} />
      </MobileSection>
    </>
  );
}

function DisclosureDemo() {
  return (
    <MobileSection flush>
      <MobileDisclosure title="시공 상세" sub="3차" meta="4개 항목" defaultOpen>
        <Text variant="body">주방 상부장 · 하부장 · 아일랜드 · 팬트리</Text>
      </MobileDisclosure>
      <MobileDisclosure title="변경 이력" sub="최근 30일" meta="2건">
        <Text variant="body">07.20 자재 변경 · 07.25 일정 조정</Text>
      </MobileDisclosure>
      {/* sub가 붙어도 제목이 길면 제목만 말줄임 — 보조는 flex:none이라 안 잘린다 */}
      <MobileDisclosure title="제목이 아주 길어서 한 줄에 안 들어가는 경우의 처리" sub="2차" meta="8건">
        <Text variant="body">제목만 말줄임되고 보조·요약값은 남는다.</Text>
      </MobileDisclosure>
      <MobileDisclosure title="meta 없는 펼침">
        <Text variant="body">우측 요약값이 없으면 chevron만 남는다.</Text>
      </MobileDisclosure>
    </MobileSection>
  );
}

function FieldDemo() {
  const [a, setA] = useState('2026년 하계 휴가 신청 안내');
  const [b, setB] = useState('');
  const [c, setC] = useState('2026-07-01');
  const [body, setBody] = useState('');
  return (
    <>
      <MobileSection title="상태 4종" flush>
        <MobileField label="기본" required>
          <TextInput value={a} onChange={setA} />
        </MobileField>
        <MobileField label="비어 있음 (placeholder)">
          <TextInput value={b} onChange={setB} placeholder="입력하세요" />
        </MobileField>
        <MobileField label="에러" required error="오늘 이전 날짜는 지정할 수 없습니다">
          <TextInput value={c} onChange={setC} />
        </MobileField>
        <MobileField label="원자가 아닌 칸 — 칩 줄은 면을 안 입는다">
          <MobileChoice options={CATS.slice(1)} value="notice" onChange={() => {}} ariaLabel="분류" />
        </MobileField>
      </MobileSection>
      <MobileSection title="본문 캔버스 — 면 없음">
        <Textarea variant="canvas" value={body} onChange={setBody} placeholder="내용을 입력하세요" />
      </MobileSection>
    </>
  );
}

function ChoiceDemo() {
  const [v, setV] = useState<string | null>('notice');
  const [w, setW] = useState<string | null>(null);
  return (
    <MobileSection flush>
      <MobileField label="선택됨">
        <MobileChoice options={CATS.slice(1)} value={v} onChange={setV} ariaLabel="분류" />
      </MobileField>
      <MobileField label="미선택">
        <MobileChoice options={[{ value: 'a', label: '자재' }, { value: 'b', label: '장비' }]}
          value={w} onChange={setW} ariaLabel="품목 분류" />
      </MobileField>
      <MobileField label="상한 초과 — 가로 스크롤(규율 상한 5)">
        <MobileChoice
          options={['전체', '공지', '업무', '인사', '안전', '품질', '물류', '재무'].map((l, i) => ({ value: String(i), label: l }))}
          value="0" onChange={() => {}} ariaLabel="상한 초과 예시" />
      </MobileField>
    </MobileSection>
  );
}

function PhotoPickerDemo() {
  const [photos, setPhotos] = useState<FileItem[]>([]);
  return (
    <MobileSection title="현장 사진">
      <MobilePhotoPicker value={photos} onChange={setPhotos} max={6} />
    </MobileSection>
  );
}

// 달력은 **자기 셸을 직접 그린다**(bare). 월 제목·이동이 부품에서 셸 헤더의 *값 제목*으로 올라갔으므로,
//  캔버스가 감싸주는 기본 헤더(부품 이름)로는 이 부품의 계약을 보여줄 수 없다.
//  월 state의 주인이 소비처라는 것도 여기서 그대로 드러난다 — 셸에 배선하는 쪽이 소비처다.
function CalendarDemo() {
  const [month, setMonth] = useState('2026-07');
  const [day, setDay] = useState('2026-07-27');
  return (
    <MobileShell tabs={TABS} activePath="/sites" onNavigate={() => {}}
      header={{ title: {
        value: monthLabel(month),
        onPrev: () => setMonth(shiftMonth(month, -1)),
        onNext: () => setMonth(shiftMonth(month, 1)),
        prevLabel: '이전 달', nextLabel: '다음 달',
      } }}>
      <MobileCalendar
        fill
        month={month}
        selected={day} onSelect={setDay}
        onSelectEvent={() => {}}
        events={SITE_EVENTS} encoding={SITE_ENCODING} annotations={SITE_ANNOS}
      />
    </MobileShell>
  );
}

function CommentDemo() {
  const roots = COMMENTS.filter((c) => !c.parentId);
  return (
    <MobileSection title="댓글 3">
      {roots.map((c) => (
        <div key={c.id}>
          <MobileComment comment={c} onReply={() => {}} />
          {COMMENTS.filter((r) => r.parentId === c.id).map((r) => (
            <MobileComment key={r.id} comment={r} />
          ))}
        </div>
      ))}
    </MobileSection>
  );
}

function ComposerDemo() {
  const [v, setV] = useState('');
  const [reply, setReply] = useState(true);
  return (
    <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}}
      header={{ title: '댓글', onBack: () => {} }}
      bottom={
        <MobileComposer value={v} onChange={setV} onSubmit={() => setV('')}
          placeholder="댓글을 입력하세요"
          replyTo={reply ? { label: '박상우님에게 답글', onCancel: () => setReply(false) } : undefined} />
      }>
      <MobileSection>
        <Text variant="body" color="secondary">
          하단 고정 입력 바. 답글 대상 칩은 입력 *위*에 뜬다 — 폰은 입력이 하단 고정이라 &ldquo;위치&rdquo;로 대상을 못 말한다.
          {!reply && ' (대상 칩을 껐다 — 새로고침하면 돌아온다)'}
        </Text>
      </MobileSection>
    </MobileShell>
  );
}

function FileRowDemo() {
  return (
    <>
      <MobileSection title="열기 + 내려받기 (onOpen)" flush>
        {ATTACHMENTS.map((f) => (
          <MobileFileRow key={f.id} name={f.name} size={f.size} onOpen={() => {}} onDownload={() => {}} />
        ))}
        <MobileFileRow name="열기만 가능한 첨부.pdf" size="2.4 MB" onOpen={() => {}} />
      </MobileSection>
      <MobileSection title="내려받기만 (현행)" flush>
        <MobileFileRow name="휴가규정_개정본.pdf" size="180 KB" onDownload={() => {}} />
        <MobileFileRow name="용량 표기 없는 첨부.hwpx" onDownload={() => {}} />
        <MobileFileRow name="내려받기 없는 첨부(정적 행).png" size="1.2 MB" />
      </MobileSection>
    </>
  );
}

function BottomSheetDemo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [v, setV] = useState('');
  return (
    <>
      <MobileSection title="시트 2종" flush>
        <MobileListRow title="필드 시트 — 제목 + 커밋 2" meta="키보드가 뜨면 시트가 그만큼 올라간다" onClick={() => setA(true)} />
        <MobileListRow title="피커 시트 — 제목 없음" meta="제목이 군더더기인 경우" onClick={() => setB(true)} />
      </MobileSection>
      <MobileBottomSheet
        opened={a} onClose={() => setA(false)} title="지출 등록"
        actions={[{ label: '취소', variant: 'secondary', onClick: () => setA(false) },
                  { label: '등록', variant: 'primary', onClick: () => setA(false) }]}
      >
        <MobileField label="항목" required><TextInput value={v} onChange={setV} placeholder="예: 자재비" /></MobileField>
        <MobileField label="금액"><TextInput value="" onChange={() => {}} placeholder="0" /></MobileField>
      </MobileBottomSheet>
      <MobileBottomSheet opened={b} onClose={() => setB(false)}>
        <MobileListRow title="현장 실측" onClick={() => setB(false)} />
        <MobileListRow title="시공" onClick={() => setB(false)} />
        <MobileListRow title="검수" onClick={() => setB(false)} />
      </MobileBottomSheet>
    </>
  );
}

function ConfirmDemo() {
  const [d, setD] = useState(false);
  const [s, setS] = useState(false);
  return (
    <>
      <MobileSection title="되돌림 가능성이 톤을 정한다" flush>
        <MobileListRow title="삭제 — danger" meta="되돌릴 수 없다" onClick={() => setD(true)} />
        <MobileListRow title="상신 — default" meta="회수할 수 있다" onClick={() => setS(true)} />
      </MobileSection>
      <MobileConfirm
        opened={d} tone="danger" title="이 발주를 삭제할까요?"
        message="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제" onConfirm={() => setD(false)} onCancel={() => setD(false)}
      />
      <MobileConfirm
        opened={s} title="결재를 상신할까요?"
        confirmLabel="상신" onConfirm={() => setS(false)} onCancel={() => setS(false)}
      />
    </>
  );
}

const FB_AXES: FilterAxis[] = [
  { id: 'stage', label: '공정', rows: [
    { key: 'st:meas', label: '실측', count: 4, marker: { kind: 'swatch', color: 'info' } },
    { key: 'st:make', label: '제작', count: 7, marker: { kind: 'swatch', color: 'warning' } },
    { key: 'st:inst', label: '시공', count: 3, marker: { kind: 'swatch', color: 'success' } },
    { key: 'st:done', label: '완료', count: 12, marker: { kind: 'swatch', color: 'neutral' } },
  ] },
  { id: 'owner', label: '담당', rows: [
    { key: 'ow:ok', label: '옥성훈', count: 9, marker: { kind: 'initial', text: '옥' } },
    { key: 'ow:km', label: '김민지', count: 6, marker: { kind: 'initial', text: '김' } },
    { key: 'ow:lj', label: '이재현', count: 2, marker: { kind: 'initial', text: '이' } },
  ], action: { label: '담당 관리', icon: 'settings', onClick: () => {} } },
  { id: 'firm', label: '확정 여부', rows: [
    { key: 'fm:y', label: '확정', count: 11, marker: { kind: 'emphasis', value: 'solid' } },
    { key: 'fm:n', label: '가예약', count: 5, marker: { kind: 'emphasis', value: 'dashed' } },
  ] },
];

function FilterBarDemo() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set(['st:done']));
  const toggle = (k: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });
  return (
    <>
      <MobileFilterBar axes={FB_AXES} hiddenKeys={hidden} onToggle={toggle} onReset={() => setHidden(new Set())} />
      <MobileSection flush separator="line">
        <MobileListRow title="대명물산 주방 시공" meta="옥성훈 · 07.06" onClick={() => {}} />
        <MobileListRow title="한빛산업 실측" meta="김민지 · 07.13" onClick={() => {}} />
      </MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          축 버튼을 누르면 <b>시트</b>가 열린다(06 §2-2 — 값 고르기는 피커다). 걸린 축만 톤이 켜지고,
          바 높이는 값 개수와 무관하다.
        </Text>
      </MobileSection>
    </>
  );
}

// 공정은 **모든 행에 있는 축**이라 kicker(배지)가 아니라 inline(보조 줄)이다 — 06 §3-6.
//  배지를 세 행에 다 달면 배지밭이 되고 그 순간 배지가 신호이길 그만둔다.
//  kicker는 드물게 뜨는 것만: 여기선 '지연'이 한 행에만 있다.
const REC_COLS: DataTableColumn[] = [
  { key: 'name', label: '거래처', type: 'text', listSlot: 'primary' },
  { key: 'owner', label: '담당', type: 'text', listSlot: 'secondary' },
  { key: 'date', label: '납기', type: 'date', listSlot: 'inline' },
  { key: 'stage', label: '공정', type: 'text', listSlot: 'inline' },
  { key: 'flag', label: '이상', type: 'badge', listSlot: 'kicker', badgeColors: { 지연: 'danger' } },
  { key: 'amount', label: '금액', type: 'currency', listSlot: 'trailing' },
  { key: 'memo', label: '비고', type: 'text' },   // listSlot 없음 → 좁은 화면에서 안 보인다
];
const REC_ROWS: DataTableRow[] = [
  { id: 'r1', name: '대명물산', owner: '옥성훈', date: '2026-07-06', stage: '시공', amount: 3400000, memo: '표에만 보이는 열' },
  { id: 'r2', name: '한빛산업', owner: '김민지', date: '2026-07-13', stage: '실측', flag: '지연', amount: 1280000, memo: '—' },
  { id: 'r3', name: '세종테크', owner: '이재현', date: '2026-07-22', stage: '완료', amount: 8750000, memo: '—' },
];

function RecordListDemo() {
  return (
    <>
      <MobileSection flush><MobileRecordList columns={REC_COLS} rows={REC_ROWS} idKey="id" onRowClick={() => {}} /></MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          컬럼을 <b>한 번</b> 선언하고 <b>listSlot</b>만 붙였다. 표와 이 목록이 같은 배열을 본다 —
          <b>비고</b> 열은 slot이 없어 여기선 안 보인다.
          공정은 모든 행에 있으므로 배지가 아니라 보조 줄이고(06 §3-6), <b>배지는 드문 것</b>(지연 1건)에만 붙는다.
        </Text>
      </MobileSection>
    </>
  );
}

function PullToRefreshDemo() {
  const [n, setN] = useState(0);
  return (
    <MobilePullToRefresh onRefresh={() => new Promise((r) => setTimeout(() => { setN((v) => v + 1); r(); }, 900))}>
      <MobileSection>
        <Text variant="body" color="secondary">
          <b>폰 프레임 안에서 터치로</b> 목록 맨 위를 아래로 당겨보세요(마우스로는 안 됩니다 — 터치 이벤트입니다).
          새로고침 {n}회.
        </Text>
      </MobileSection>
      <MobileSection title="목록" flush>
        {Array.from({ length: 12 }, (_, i) => (
          <MobileListRow key={i} title={`항목 ${i + 1}`} meta="당김 새로고침 대상" onClick={() => {}} />
        ))}
      </MobileSection>
    </MobilePullToRefresh>
  );
}

function SegmentDemo() {
  const [a, setA] = useState('wait');
  const [b, setB] = useState('unread');
  return (
    <>
      {/* countTone·showZero — 대기는 행동요구라 danger, 나머지는 정보성 neutral(기본).
          예정 0건은 showZero로 남긴다: 단계별 큐에선 "이 단계는 비었다"도 답이다. */}
      <MobileSection title="여백이 넘쳐 스크롤 (결재함) · 톤 2종 + 0건" flush>
        <MobileSegment
          ariaLabel="결재함"
          value={a} onChange={setA}
          items={[
            { value: 'wait', label: '대기', count: 3, countTone: 'danger' },
            { value: 'plan', label: '예정', count: 0, showZero: true },
            { value: 'done', label: '처리', count: 12 },
            { value: 'end', label: '완료' },
            { value: 'all', label: '전체', count: 128 },
          ]}
        />
      </MobileSection>
      <MobileSection title="여백이 남아 균등 분할 (읽음 명단)" flush>
        <MobileSegment
          ariaLabel="읽음 명단"
          value={b} onChange={setB}
          items={[
            { value: 'unread', label: '안읽음', count: 14 },
            { value: 'read', label: '읽음', count: 18 },
          ]}
        />
      </MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          균등/스크롤은 prop이 아니라 <b>항목 수</b>가 정한다(M3: fixed 2~3 / scrollable 4+).
          5탭에 카운트까지 붙으면 375px에 균등으로 안 들어가 라벨이 뭉개진다.
        </Text>
      </MobileSection>
    </>
  );
}

function DecisionBarDemo() {
  const [tab, setTab] = useState('wait');
  const [done, setDone] = useState<string | null>(null);
  return (
    <MobileShell
      header={{ title: '휴가 신청서', onBack: () => {} }}
      tabs={TABS} activePath="/board" onNavigate={() => {}}
      bottom={
        <MobileDecisionBar
          primary={{ label: '승인', onClick: () => setDone('승인') }}
          secondary={{ label: '반려', onClick: () => setDone('반려') }}
          more={[
            { label: '보류', onClick: () => setDone('보류') },
            { label: '전결 위임', onClick: () => setDone('위임') },
            { label: '결재선 보기', onClick: () => {} },
          ]}
        />
      }>
      <MobileSegment
        ariaLabel="결재함"
        value={tab} onChange={setTab}
        items={[
          { value: 'wait', label: '대기', count: 3 },
          { value: 'plan', label: '예정' },
          { value: 'done', label: '처리', count: 12 },
          { value: 'end', label: '완료' },
        ]}
      />
      <MobileSection>
        <Title variant="subheading">2026년 하계 휴가 신청</Title>
        <div style={{ marginTop: 8 }}>
          <Text variant="caption" color="secondary">김서연 · 인사팀 · 07.01 ~ 07.05 (5일)</Text>
        </div>
      </MobileSection>
      <MobileSection title="결재선" flush>
        <MobileListRow title="1차 · 박상우 팀장" meta="07.01 승인" badges={<Badge color="success">승인</Badge>} />
        <MobileListRow title="2차 · 옥성훈 대표" meta="대기 중" badges={<Badge color="neutral">대기</Badge>} emphasis />
      </MobileSection>
      <MobileSection title="첨부" flush>
        <MobileFileRow name="휴가신청서_김서연.pdf" size="182 KB" onOpen={() => {}} onDownload={() => {}} />
      </MobileSection>
      {done && (
        <MobileSection>
          <Text variant="body">처리 결과: <b>{done}</b> (데모 — 실제 전이는 소비처가 한다)</Text>
        </MobileSection>
      )}
    </MobileShell>
  );
}

function AttachmentViewerDemo() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  return (
    <MobileShell header={{ title: '게시글', onBack: () => {} }} tabs={TABS} activePath="/board" onNavigate={() => {}}>
      <MobileSection title={`첨부 ${VIEWER_ITEMS.length}`} flush>
        {VIEWER_ITEMS.map((f, i) => (
          <MobileFileRow key={f.id} name={f.name} size={f.size}
            onOpen={() => { setIdx(i); setOpen(true); }}
            onDownload={() => {}} />
        ))}
      </MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          앞의 둘은 이미지, 셋째는 PDF(자산이 깔려 있으면 렌더된다), 나머지 넷은 <b>사유별 폴백 카드</b>다 —
          형식 미지원 · 용량 초과 · 보호 문서. 단일 &ldquo;미리보기 불가&rdquo; 문구를 쓰지 않는 이유는
          사용자가 다음에 뭘 할지가 사유마다 다르기 때문이다.
        </Text>
      </MobileSection>
      <MobileAttachmentViewer
        opened={open} onClose={() => setOpen(false)}
        items={VIEWER_ITEMS} index={idx} onIndexChange={setIdx}
        onDownload={() => {}} onShare={() => {}} onPrint={() => {}}
        pdfAssetBase="/pdfjs"
      />
    </MobileShell>
  );
}

const TRAIL_OK: TrailStep[] = [
  { id: 's0', role: '기안', name: '김서연', meta: '인사팀 · 07.01 10:22', state: 'done', stateLabel: '상신' },
  { id: 's1', role: '1차', name: '박상우', meta: '구매팀 팀장 · 07.01 14:05', state: 'done', stateLabel: '승인',
    comment: '이 코멘트는 안 보인다 — 승인 코멘트는 그리지 않는다.' },
  { id: 's2', role: '2차', name: '옥성훈', meta: '대표 · 대기 중', state: 'current', stateLabel: '내 차례' },
  { id: 's3', role: '최종', name: '결재 완료', state: 'plan', stateLabel: '예정' },
];
const TRAIL_REJECT: TrailStep[] = [
  { id: 'r0', role: '기안', name: '정민호', meta: '구매팀 · 07.02 09:10', state: 'done', stateLabel: '상신' },
  { id: 'r1', role: '1차', name: '박상우', meta: '구매팀 팀장 · 07.02 11:40', state: 'reject', stateLabel: '반려',
    comment: '증빙 누락입니다. 카드 전표 첨부 후 재상신 바랍니다.' },
  { id: 'r2', role: '2차', name: '옥성훈', state: 'halt', stateLabel: '중단' },
];

function StepTrailDemo() {
  return (
    <>
      <MobileSection title="기본 — 접힘" flush>
        <MobileStepTrail steps={TRAIL_OK} summary="2/4 · 옥성훈 차례" />
      </MobileSection>
      <MobileSection title="펼친 상태" flush>
        <MobileStepTrail steps={TRAIL_OK} summary="2/4 · 옥성훈 차례" defaultOpen />
      </MobileSection>
      <MobileSection title="반려 — 사유는 그 단계 안에" flush>
        <MobileStepTrail steps={TRAIL_REJECT} summary="1차에서 반려됨" defaultOpen />
      </MobileSection>
      <MobileSection title="summary 없음 — 부품이 n/N만 만든다" flush>
        <MobileStepTrail steps={TRAIL_OK} />
      </MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          접어도 <b>값(어디까지 왔나)은 보인다</b> — 숨기는 건 단계 목록이지 진행 상태가 아니다.
          승인 코멘트는 데이터에 있어도 그리지 않는다(위 1차 단계에 코멘트가 들어 있다).
        </Text>
      </MobileSection>
    </>
  );
}

function BulkSelectDemo() {
  const [mode, setMode] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const rows = [
    { id: 'a', title: '휴가신청서', meta: '김서연 · 인사팀 · 07.01' },
    { id: 'b', title: '지출결의서', meta: '박상우 · 구매팀 · 07.02' },
    { id: 'c', title: '발주요청서', meta: '정민호 · 물류팀 · 07.02' },
  ];
  const toggle = (id: string) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const exit = () => { setMode(false); setSel([]); };

  return (
    <MobileShell
      header={mode
        ? { title: `${sel.length}건 선택`, onBack: exit, backLabel: '선택 종료',
            actions: [{ label: '전체 선택', icon: 'check', iconOnly: true, onClick: () => setSel(rows.map((r) => r.id)) }] }
        : { title: '결재함', actions: [{ label: '선택', onClick: () => setMode(true) }] }}
      tabs={TABS} activePath="/board" onNavigate={() => {}}
      bottom={mode && sel.length > 0
        ? (
          <MobileDecisionBar
            primary={{ label: `${sel.length}건 승인`, onClick: exit }}
            more={[{ label: '선택 해제', onClick: () => setSel([]) }]}
          />
        )
        : undefined}
    >
      <MobileSegment
        ariaLabel="결재함"
        value="wait" onChange={() => {}}
        items={[
          { value: 'wait', label: '대기', count: 3 },
          { value: 'plan', label: '예정' },
          { value: 'done', label: '처리', count: 12 },
          { value: 'end', label: '완료' },
        ]}
      />
      <MobileSection flush>
        {rows.map((r) => (
          <MobileListRow
            key={r.id} title={r.title} meta={r.meta}
            selectable={mode}
            selected={sel.includes(r.id)}
            onSelectedChange={() => toggle(r.id)}
            onClick={() => {}}
          />
        ))}
      </MobileSection>
      <MobileSection>
        <Text variant="body" color="secondary">
          선택이 켜지면 <b>chevron이 사라진다</b> — 행이 진입을 안 하기 때문이다.
          모드의 주인은 <b>화면</b>이고 행은 자기가 선택됐는지만 안다.
          일괄은 <b>승인만</b> 연다 — 반려는 사유를 요구하는데 여러 건에 같은 사유를 다는 건 기록으로 못 쓴다.
        </Text>
      </MobileSection>
    </MobileShell>
  );
}

type Job = { id: string; name: string; site: string; stage: string; owner: string; done: boolean };
const JOBS: Job[] = [
  { id: 'j1', name: '대명물산 주방 시공', site: '대명물산', stage: '진행', owner: '옥성훈', done: false },
  { id: 'j2', name: '대명물산 팬트리 추가', site: '대명물산', stage: '진행', owner: '옥성훈', done: false },
  { id: 'j3', name: '한빛산업 실측', site: '한빛산업', stage: '대기', owner: '김민지', done: false },
  { id: 'j4', name: '세종테크 납품', site: '세종테크', stage: '대기', owner: '김민지', done: false },
  { id: 'j5', name: '누수 보수', site: '대명물산', stage: '완료', owner: '옥성훈', done: true },
];

function ListDemo() {
  const [mode, setMode] = useState<'flat' | 'sections' | 'groups' | 'loading' | 'empty'>('flat');
  const shown = mode === 'empty' ? [] : mode === 'loading' ? [] : JOBS;
  const row = (j: Job) => (
    <MobileListRow title={j.name} meta={`${j.site} · ${j.owner}`}
      badges={<Badge color={j.done ? 'success' : 'neutral'}>{j.stage}</Badge>} onClick={() => {}} />
  );
  return (
    <>
      <MobileSection title="보기 전환" >
        <MobileChoice
          ariaLabel="보기"
          value={mode}
          onChange={(v) => setMode(v as typeof mode)}
          options={[
            { value: 'flat', label: '평면' }, { value: 'sections', label: '섹션' },
            { value: 'groups', label: '섹션+그룹' }, { value: 'loading', label: '로딩' }, { value: 'empty', label: '빈 상태' },
          ]}
        />
      </MobileSection>
      <MobileList<Job>
        items={shown}
        getKey={(j) => j.id}
        renderRow={row}
        sections={mode === 'sections' || mode === 'groups'
          ? [
              { key: 'wip', title: '진행 중', match: (j) => !j.done },
              { key: 'done', title: '완료', match: (j) => j.done },
            ]
          : undefined}
        groupBy={mode === 'groups' ? (j) => j.site : undefined}
        renderGroupHeader={(g) => `${g[0].site} · ${g.length}건`}
        renderGroupAction={() => <Text variant="caption" color="secondary">일괄</Text>}
        searchQuery="" onSearchChange={() => {}} searchPlaceholder="현장·담당 검색"
        status={mode === 'loading' ? 'loading' : 'ready'}
        emptyState={{ title: '작업이 없습니다', description: '새 작업을 등록해 보세요' }}
        onLoadMore={() => {}}
        totalCount={12}
      />
      <MobileSection>
        <Text variant="body" color="secondary">
          그룹 액션(‘일괄’)은 <b>2건 이상 그룹에만</b> 뜬다 — 한빛산업·세종테크는 1건이라 안 보인다.
          정렬은 부품이 하지 않는다(<code>items</code>를 정렬된 상태로 받는다).
        </Text>
      </MobileSection>
    </>
  );
}

/* ── 화면(유기체) ──────────────────────────────────────────────────────── */

function BoardListDemo() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  return (
    <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}}
      header={{ title: '게시판', actions: [{ label: '글쓰기', onClick: () => {} }] }}>
      <MobileBoardList
        posts={POSTS}
        categories={CATS} category={cat} onCategoryChange={setCat}
        searchQuery={q} onSearchChange={setQ}
        onSelectPost={() => {}}
        onLoadMore={() => {}}
        totalCount={12}
      />
    </MobileShell>
  );
}

function BoardListLoadingDemo() {
  // 지연(400ms)을 눈으로 보려면 다시 열어야 하므로, 토글로 재현할 수 있게 둔다.
  const [loading, setLoading] = useState(true);
  return (
    <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}}
      header={{ title: '게시판', actions: [{ label: loading ? '완료로' : '로딩으로', variant: 'secondary', onClick: () => setLoading((v) => !v) }] }}>
      <MobileBoardList
        posts={loading ? [] : POSTS}
        status={loading ? 'loading' : 'ready'}
        categories={CATS} category="all" onCategoryChange={() => {}}
        searchQuery="" onSearchChange={() => {}}
        onSelectPost={() => {}}
      />
    </MobileShell>
  );
}

function BoardListEmptyDemo() {
  const [q, setQ] = useState('없는검색어');
  return (
    <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}}
      header={{ title: '게시판', actions: [{ label: '글쓰기', onClick: () => {} }] }}>
      <MobileBoardList
        posts={[]}
        categories={CATS} category="all" onCategoryChange={() => {}}
        searchQuery={q} onSearchChange={setQ}
        emptyState={{ title: '검색 결과가 없습니다', description: '다른 검색어를 입력해 보세요' }}
      />
    </MobileShell>
  );
}

function BoardViewDemo() {
  const [cmts, setCmts] = useState<BoardComment[]>(COMMENTS);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [acked, setAcked] = useState(false);
  const post = POSTS[0];
  return (
    <MobileShell
      header={{ title: post.category, onBack: () => {},
                actions: [{ label: '더보기', icon: 'dots-vertical', iconOnly: true, onClick: () => {} }] }}
      tabs={TABS} activePath="/board" onNavigate={() => {}}
      bottom={
        <MobileComposer value={draft} onChange={setDraft}
          onSubmit={() => {
            const body = draft.trim();
            if (!body) return;
            setCmts((p) => [...p, { id: 'n' + p.length, author: { name: '옥성훈', dept: '대표' }, date: '방금', body, ...(replyTo ? { parentId: replyTo } : {}) }]);
            setDraft(''); setReplyTo(null);
          }}
          placeholder="댓글을 입력하세요"
          replyTo={replyTo ? { label: `${cmts.find((c) => c.id === replyTo)?.author.name}님에게 답글`, onCancel: () => setReplyTo(null) } : undefined} />
      }>
      <MobileBoardView
        category={post.category} notice={post.pinned} mustRead={post.mustRead}
        title={post.title}
        author={{ name: post.author.name, dept: post.author.dept, role: '팀장' }}
        date={post.date} views={post.views}
        content={<RichText html={POST_HTML} />}
        attachments={ATTACHMENTS.map((f) => ({ ...f, onDownload: () => {} }))}
        readState={{ read: 18, total: 32, acknowledged: acked, onAcknowledge: () => setAcked(true) }}
        prev={{ title: '3분기 전사 워크샵 일정 공유', date: '06.18', onClick: () => {} }}
        next={{ title: '2026년 거래처 단가표 v3 배포', date: '06.25', onClick: () => {} }}
        comments={cmts}
        onReply={setReplyTo}
      />
    </MobileShell>
  );
}

function BoardWriteDemo() {
  const [t, setT] = useState('');
  const [cat, setCat] = useState<string | null>('notice');
  const [body, setBody] = useState('');
  const [aud, setAud] = useState<string[]>(['hr']);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [notice, setNotice] = useState(false);
  const [must, setMust] = useState(false);
  const [cmt, setCmt] = useState(true);
  return (
    <MobileShell
      header={{ title: '글쓰기', onBack: () => {},
                actions: [{ label: '임시저장', icon: 'save', iconOnly: true, onClick: () => {} }] }}
      tabs={TABS} activePath="/board" onNavigate={() => {}}
      bottom={<div style={{ padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)' }}>
        <Button variant="primary" fullWidth onClick={() => {}}>등록</Button>
      </div>}>
      <MobileBoardWrite
        categories={CATS.slice(1)} category={cat} onCategoryChange={setCat}
        postTitle={t} onPostTitleChange={setT}
        body={body} onBodyChange={setBody}
        audiences={AUDIENCES} selectedAudiences={aud} onAudiencesChange={setAud}
        files={files} onFilesChange={setFiles}
        notice={notice} onNoticeChange={setNotice}
        mustRead={must} onMustReadChange={setMust}
        commentsAllowed={cmt} onCommentsAllowedChange={setCmt}
      />
    </MobileShell>
  );
}

function OrdersDemo() {
  const [site, setSite] = useState('');
  const [kind, setKind] = useState<string | null>(null);
  return (
    <MobileShell tabs={TABS} activePath="/orders" onNavigate={() => {}}
      header={{ title: '발주' }}
      bottom={<div style={{ padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)' }}>
        <Button variant="primary" fullWidth onClick={() => {}}>발주 요청</Button>
      </div>}>
      <MobileSection flush>
        <MobileStatRow items={[
          { label: '진행 중', value: '12건', onClick: () => {} },
          { label: '승인 대기', value: '3건', sub: '2건 지연', tone: 'danger', onClick: () => {} },
          { label: '이번 달', value: '48건', sub: '+12%', tone: 'success' },
        ]} />
      </MobileSection>
      <MobileSection title="새 발주" flush>
        <MobileField label="현장" required>
          <TextInput value={site} onChange={setSite} placeholder="현장을 입력하세요" />
        </MobileField>
        <MobileField label="품목 분류">
          <MobileChoice options={[{ value: 'a', label: '자재' }, { value: 'b', label: '장비' }]}
            value={kind} onChange={setKind} ariaLabel="품목 분류" />
        </MobileField>
      </MobileSection>
    </MobileShell>
  );
}

function EventDetailDemo() {
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const ev = SITE_EVENTS[0];
  return (
    <MobileShell header={{ title: '시공', onBack: () => {} }} tabs={TABS} activePath="/sites" onNavigate={() => {}}>
      <MobileSection>
        <Title variant="subheading">{ev.label}</Title>
        <div style={{ marginTop: 8 }}>
          <Text variant="caption" color="secondary">{ev.start} ~ {ev.end ?? ev.start}</Text>
        </div>
      </MobileSection>
      <MobileSection flush>
        <MobileDisclosure title="시공 상세" meta="4개 항목" defaultOpen>
          <Text variant="body">주방 상부장 · 하부장 · 아일랜드 · 팬트리</Text>
        </MobileDisclosure>
        <MobileDisclosure title="변경 이력" meta="2건">
          <Text variant="body">07.20 자재 변경 · 07.25 일정 조정</Text>
        </MobileDisclosure>
      </MobileSection>
      <MobileSection title="현장 사진">
        <MobilePhotoPicker value={photos} onChange={setPhotos} max={6} />
      </MobileSection>
    </MobileShell>
  );
}


// A4 장표 뷰어 — 열린 채로 띄운다(닫히면 볼 게 없는 부품이라 '열기' 한 단계를 데모가 통과시키지 않는다).
//  캔버스가 셸로 감싸지 않는 이유(bare): 이 부품은 셸 *위를 덮는* 전체 화면 커버라 셸 안에 넣으면 층이 거짓이 된다.
function PaperViewerDemo() {
  return (
    <MobilePaperViewer
      opened
      onClose={() => {}}
      title="거래명세서 2026-0805-017"
      columns={4}
      rows={PAPER_ROWS}
      fields={PAPER_FIELDS}
      values={PAPER_VALUES}
      actions={[{ label: '내려받기', icon: 'download', iconOnly: true, onClick: () => {} }]}
    />
  );
}


/* 당김 새로고침 **+ fill 화면** — 깨졌던 조합 그대로다(회귀 가드).
   기존 PullToRefresh 데모는 *목록*을 감싸고 있어서 이 결함이 /dev에서 안 잡혔다:
   래퍼(.mptr)에 height 규칙이 없어 높이 사슬이 끊기고, .mcal.fill의 height:100%가
   auto를 가리켜 달력이 내용 높이로 쪼그라들었다(소비처 현장·일정 탭에서 터졌다).
   → 여기서 주 행이 화면을 꽉 채우는지가 그 사슬이 살아 있다는 증거다. */
function PullFillDemo() {
  const [month, setMonth] = useState('2026-07');
  const [day, setDay] = useState('2026-07-27');
  const [n, setN] = useState(0);
  return (
    <MobileShell tabs={TABS} activePath="/sites" onNavigate={() => {}}
      header={{ title: {
        value: `${monthLabel(month)}${n ? ` · 새로고침 ${n}` : ''}`,
        onPrev: () => setMonth(shiftMonth(month, -1)),
        onNext: () => setMonth(shiftMonth(month, 1)),
        prevLabel: '이전 달', nextLabel: '다음 달',
      } }}>
      <MobilePullToRefresh onRefresh={() => new Promise((r) => setTimeout(() => { setN((v) => v + 1); r(); }, 900))}>
        <MobileCalendar
          fill
          month={month}
          selected={day} onSelect={setDay}
          onSelectEvent={() => {}}
          events={SITE_EVENTS} encoding={SITE_ENCODING} annotations={SITE_ANNOS}
        />
      </MobilePullToRefresh>
    </MobileShell>
  );
}

/* ── 등록부 ────────────────────────────────────────────────────────────── */

export const MOBILE_DEMOS: Record<string, MobileDemoDef> = {
  // 부품 — 캔버스가 셸로 감싼다
  MobileShell:       { render: () => <ShellDemo />, bare: true, note: '세 자리(헤더 행·본문·하단 고정) + 탭바 층. 헤더 4형(고정 제목·뒤로+제목·값 제목·빈 헤더)은 4탭 통합 화면에서 본다 — 셸을 여러 개 못 쌓는다' },
  MobileSection:     { render: () => <SectionDemo />, note: '제목·액션·flush·무제목 4형' },
  MobileListRow:     { render: () => <ListRowDemo />, note: '슬롯 조합 11종 — emphasis·unread(점 자리 2곳)·actions(1·2·진입없음)·chevron·trailing' },
  MobileStatRow:     { render: () => <StatRowDemo />, note: '3칸 / 2칸 · tone 3종' },
  MobileDisclosure:  { render: () => <DisclosureDemo />, note: '펼침·접힘·sub(제목 옆 보조)·긴 제목 말줄임·meta 없음' },
  MobileField:       { render: () => <FieldDemo />, note: '기본·빈칸·에러·원자 아닌 칸 + 본문 캔버스' },
  MobileChoice:      { render: () => <ChoiceDemo />, note: '선택·미선택·상한 초과(가로 스크롤)' },
  MobilePhotoPicker: { render: () => <PhotoPickerDemo />, note: '썸네일 격자 + 추가 타일' },
  MobileCalendar:    { render: () => <CalendarDemo />, bare: true, note: 'fill 모드 — 달력이 본문 전체를 갖는다. 월 제목·이동은 부품이 아니라 셸 헤더의 값 제목이다' },
  MobileComment:     { render: () => <CommentDemo />, note: '루트 + 1단 답글 · 작성자 배지' },
  MobileComposer:    { render: () => <ComposerDemo />, bare: true, note: '하단 고정 입력 + 답글 대상 칩' },
  MobileFileRow:     { render: () => <FileRowDemo />, note: '열기+내려받기 분리 · 내려받기만 · 정적 행' },
  MobileSegment:     { render: () => <SegmentDemo />, note: '여백 하한(md)이 균등↔스크롤을 정한다(개수 분기 아님) · countTone 2종 · 0건 표시' },
  MobileDecisionBar: { render: () => <DecisionBarDemo />, bare: true, note: '승인/반려 + ⋯ 메뉴. 결재 화면 전체 맥락' },
  MobileAttachmentViewer: { render: () => <AttachmentViewerDemo />, bare: true, note: '이미지 2 · PDF 1 · 폴백 사유 4종. 행을 눌러 연다' },
  MobilePaperViewer: { render: () => <PaperViewerDemo />, bare: true, note: '읽기(투영)/원본(2D+확대 3단) 두 뷰. rowSpan 라벨이 그룹 머리로 내려간다 — 세그먼트를 눌러 대조하라' },
  MobileStepTrail:   { render: () => <StepTrailDemo />, note: '접힘(기본)·펼침·반려·summary 없음' },
  MobileList:        { render: () => <ListDemo />, note: '평면·섹션·섹션+그룹·로딩·빈 상태 5모드 전환' },
  MobileBottomSheet: { render: () => <BottomSheetDemo />, note: '필드 시트(제목+커밋 2) · 피커 시트(제목 없음). 입력칸을 누르면 키보드만큼 올라간다' },
  MobileConfirm:     { render: () => <ConfirmDemo />, note: 'danger(삭제) · default(상신) — 되돌림 가능성이 톤을 정한다' },
  MobileFilterBar:   { render: () => <FilterBarDemo />, bare: true, note: '축 3(색·글자·실선/파선 표식) · 걸린 축 톤 · 값 고르기는 시트' },
  MobileRecordList:  { render: () => <RecordListDemo />, note: 'listSlot에서 파생 — 비고는 slot이 없어 안 보이고, 배지는 드문 것(지연 1건)에만' },
  MobilePullToRefresh: { render: () => <PullToRefreshDemo />, bare: true, note: '**터치로** 맨 위에서 아래로 당긴다(마우스 불가). 임계 72px에서 화살표가 뒤집힌다' },

  // 화면 — 4탭 데모를 안 거치고 직접 진입하는 자리.
  ScreenBulkApprove: { render: () => <BulkSelectDemo />, bare: true, screen: true, label: '결재함 — 일괄 승인', note: '상단 선택 → 체크 → 하단 결정 바. chevron이 사라지는지 확인' },
  MobileBoardList:   { render: () => <BoardListDemo />, bare: true, note: '검색·분류 칩·공지 구획·더보기' },
  MobileBoardView:   { render: () => <BoardViewDemo />, bare: true, note: '필독 읽음확인·첨부·이전다음·댓글' },
  MobileBoardWrite:  { render: () => <BoardWriteDemo />, bare: true, note: '수신자 조직도·첨부·게시옵션 3종' },

  // 화면 — 4탭 데모를 안 거치고 직접 진입하는 자리.
  //  키에 콜론 같은 구분자를 안 쓴다(URL 세그먼트로 그대로 나가므로). 구분은 screen 플래그가 한다.
  ScreenBoardListEmpty: { render: () => <BoardListEmptyDemo />, bare: true, screen: true, label: '게시판 — 빈 상태', note: '조작 없이 빈 상태를 바로 본다' },
  ScreenBoardListLoading: { render: () => <BoardListLoadingDemo />, bare: true, screen: true, label: '게시판 — 로딩', note: '400ms 지연 후 스피너. 상단 버튼으로 로딩↔완료 전환' },
  ScreenPullFill:       { render: () => <PullFillDemo />, bare: true, screen: true, label: '현장 — 당김 + fill 달력', note: '**높이 사슬 회귀 가드.** 주 행이 화면을 꽉 채우면 통과, 쪼그라들면 래퍼가 사슬을 끊은 것이다' },
  ScreenOrders:         { render: () => <OrdersDemo />, bare: true, screen: true, label: '발주 탭', note: '데스크탑 FormField를 셸 안에서 쓰는 자리 — 모바일 전용 부품 없이 성립하는지' },
  ScreenEventDetail:    { render: () => <EventDetailDemo />, bare: true, screen: true, label: '현장 — 일정 상세', note: '3뎁스 화면' },
};

export const MOBILE_DEMO_NAMES = Object.keys(MOBILE_DEMOS);
export const MOBILE_SCREENS = MOBILE_DEMO_NAMES.filter((n) => MOBILE_DEMOS[n].screen);
export const hasMobileDemo = (name: string) => name in MOBILE_DEMOS;

/** 캔버스 본체 — /shell/m/part/[name] 이 이걸 렌더한다. bare가 아니면 셸로 감싼다. */
/** 크롬 없는 캔버스 — 스케일·평면만 갖는다(문서 루트 변수 + .ms 클래스). 크롬은 MobileShell 것. */
function BareCanvas({ children }: { children: ReactNode }) {
  useMobileScope();
  return <div className="ms" style={mobileTypoVars as CSSProperties}>{children}</div>;
}

export function MobileDemoCanvas({ name }: { name: string }) {
  const def = MOBILE_DEMOS[name];
  if (!def) {
    return (
      <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}}>
        <MobileSection title="없는 데모">
          <Text variant="body" color="secondary">{name} 의 모바일 예시가 등록되지 않았습니다.</Text>
        </MobileSection>
      </MobileShell>
    );
  }
  // bare = 셸 **크롬**을 안 씌운다는 뜻이지 모바일 규격 밖이라는 뜻이 아니다.
  //  전에는 여기서 MobileShell을 통째로 건너뛰어 **타이포 스케일까지 같이 사라졌고**(포털이든 아니든),
  //  그래서 bare 데모의 글자가 전부 데스크탑 값으로 떴다. 스코프만 따로 씌운다.
  if (def.bare) return <BareCanvas>{def.render()}</BareCanvas>;
  return (
    <MobileShell tabs={TABS} activePath="/board" onNavigate={() => {}} header={{ title: name, onBack: () => {} }}>
      {def.render()}
    </MobileShell>
  );
}
