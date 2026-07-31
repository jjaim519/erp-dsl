'use client';
// MobileBoardList (유기체) — 사내 게시판 목록의 모바일 화면. 데스크탑 BoardList의 짝.
//
//  · **타입을 공유한다**: `BoardPost` 한 벌을 소비처가 두 화면에 그대로 넘긴다(변환 0).
//    MobileCalendar가 CalendarEvent를 데스크탑과 공유하는 것과 같은 규율 — 복제하면 두 화면이 갈린다.
//  · 시각 체계는 모바일 계열 그대로: 면·그림자 0, 배경 + 가로 헤어라인. 행은 MobileListRow가 그린다
//    (여기서 행을 다시 짜지 않는다 — 44pt·:active·chevron 규율이 그 부품에 이미 있다).
//  · 데스크탑과 갈리는 것:
//    ① 표 헤더(분류/제목/…/조회)가 없다 — 폰 폭에 6열은 안 들어가고, 열 제목은 행이 이미 말한다.
//    ② 번호 페이징 대신 '더보기'다. 폰에서 번호 페이징은 표적이 작고 스크롤 맥락을 끊는다.
//    ③ 분류(말머리)는 SegmentedControl이 아니라 **가로 스크롤 필터 칩**이다 — 분류가 5개를 넘으면
//       세그먼트는 글자가 뭉개진다. MobileCalendar 범례 칩 줄과 같은 어휘.
//  · 하단 고정(글쓰기 CTA)은 이 부품이 아니라 셸이 소유한다 — MobileShell의 `bottom` 한 자리.
//    부품이 자기 sticky 바를 그리면 같은 자리를 두 경로가 다툰다(v0.52.0에서 슬롯을 하나로 합친 이유).
import { MobileChoice } from './MobileChoice';
import { Badge } from './Badge';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { InputGroup } from './InputGroup';
import { EmptyState } from './EmptyState';
import { MobileSection } from './MobileSection';
import { MobileListRow } from './MobileListRow';
import { fmtNumber } from './_cells';
import type { BoardPost } from './BoardList';
import './board.css';      // 공지·필독·NEW 솔리드 배지 어휘는 데스크탑과 *같은 클래스*를 쓴다(같은 신호 = 같은 형태)
import './mobileboard.css';

type Props = {
  posts: BoardPost[];
  categories?: { value: string; label: string }[];   // 말머리. 안 주면 칩 줄 미조립('전체'는 소비처가 포함)
  category?: string;
  onCategoryChange?: (v: string) => void;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  onSelectPost?: (post: BoardPost) => void;
  onLoadMore?: () => void;                            // '더보기'(폰은 번호 페이징을 안 쓴다). 노출 조건은 아래 hasMore — 데이터가 정한다
  loadMoreLabel?: string;
  totalCount?: number;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function MobileBoardList({
  posts, categories, category, onCategoryChange,
  searchQuery, onSearchChange, searchPlaceholder = '제목·작성자 검색',
  onSelectPost, onLoadMore, loadMoreLabel = '더보기', totalCount, emptyState,
}: Props) {
  const pinned = posts.filter((p) => p.pinned);
  const normal = posts.filter((p) => !p.pinned);

  // 더보기는 *데이터가 결정*한다 — 토글 prop이 아니다(데스크탑이 totalPages>1일 때만 Pagination을 그리는 것과 같은 규율).
  //  `totalCount`를 주면 "아직 안 불러온 게 있을 때"만 뜬다 — 총 4건에 4건이 다 보이는데 더보기가 있으면
  //  없는 걸 있다고 말하는 셈이다. totalCount가 없으면 부품은 남은 양을 알 수 없어, 콜백을 준 소비처를 믿는다.
  const hasMore = onLoadMore != null && (totalCount == null || posts.length < totalCount);

  // 행 하나 — 데스크탑의 열(분류·필독·NEW·안읽음·첨부/댓글·작성자·날짜·조회)을 폰의 3층
  //  [배지 줄 / 제목 / 보조 줄]로 접는다. 잃는 정보는 없고 배치만 세로로 눕는다.
  const row = (p: BoardPost) => {
    const meta = [p.author.name + (p.author.dept ? ` · ${p.author.dept}` : ''), p.date]
      .concat(p.views != null ? [`조회 ${fmtNumber(p.views)}`] : [])
      .join(' · ');
    const counts = (p.attachments || p.comments) ? (
      <span className="mb-counts">
        {p.attachments ? <span><Icon name="paperclip" size="sm" />{p.attachments}</span> : null}
        {p.comments ? <span className="cmt"><Icon name="message" size="sm" />{p.comments}</span> : null}
      </span>
    ) : undefined;

    return (
      <MobileListRow
        key={p.id}
        title={p.title}
        emphasis={p.unread}                                   // 안 읽음 = 제목 강조(데스크탑 볼드와 같은 신호)
        leading={p.unread && !p.pinned ? <span className="mb-dot" aria-label="안 읽음" /> : undefined}
        meta={meta}
        badges={
          <>
            {p.pinned ? <span className="board-notice">공지</span> : p.category ? <Badge color="neutral">{p.category}</Badge> : null}
            {p.mustRead && <span className="board-must">필독</span>}
            {p.isNew && <span className="board-new">NEW</span>}
          </>
        }
        trailing={counts}
        onClick={onSelectPost ? () => onSelectPost(p) : undefined}
      />
    );
  };

  return (
    <>
      {(onSearchChange || (categories && categories.length > 0)) && (
        <MobileSection>
          {onSearchChange && (
            <InputGroup leftAddon={<Icon name="search" size="sm" />}>
              <TextInput value={searchQuery ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} />
            </InputGroup>
          )}
          {categories && categories.length > 0 && category != null && onCategoryChange && (
            <div className="mb-cats">
              <MobileChoice options={categories} value={category} onChange={onCategoryChange} ariaLabel="말머리 필터" />
            </div>
          )}
        </MobileSection>
      )}

      {posts.length === 0 ? (
        <MobileSection>
          <EmptyState
            icon={emptyState?.icon ?? 'file-text'}
            title={emptyState?.title ?? '게시글이 없습니다'}
            description={emptyState?.description}
          />
        </MobileSection>
      ) : (
        <>
          {/* 공지는 별도 구획으로 먼저 — 데스크탑의 '상단 고정 밴드'를 모바일에선 *섹션 하나*가 대신한다.
              (배지만으로는 "고정"이 안 읽힌다. 구획이 곧 고정의 표현.) */}
          {pinned.length > 0 && (
            <div className="mb-pinned">
              <MobileSection flush>{pinned.map(row)}</MobileSection>
            </div>
          )}
          <MobileSection flush>{normal.map(row)}</MobileSection>

          {(hasMore || totalCount != null) && (
            <MobileSection>
              {hasMore && <Button variant="secondary" fullWidth onClick={onLoadMore}>{loadMoreLabel}</Button>}
              {totalCount != null && (
                <div className="mb-total"><Text variant="caption" color="secondary">총 {fmtNumber(totalCount)}건</Text></div>
              )}
            </MobileSection>
          )}
        </>
      )}
    </>
  );
}
