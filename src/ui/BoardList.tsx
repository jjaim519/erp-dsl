'use client';
// BoardList (템플릿) — 사내 게시판 목록 골격. 도메인 0줄(헌법 1).
//  · 밀도형 행(업무 스캔 우선) + 상단 고정 공지 밴드(무테 tonal) + 필독/안읽음 강조.
//  · 분류(말머리)·다중 게시판은 데이터 — 노출 여부는 소비처가 결정(categories 안 주면 탭 없음).
//  · 작성자 = 실명+부서(아바타). 내부/업무용 보드의 정체(익명 아님).
//  · 행 그리드는 board 고유 6열 레이아웃이라 Grid 프리미티브(12의 약수)로 못 짬 → raw CSS grid 격리 예외
//    (Calendar 7열·Modal raw flex 동류, 헌법 명시 예외). 공지/필독 솔리드 배지는 Badge 원자(light)가 못 내
//    템플릿 전용 span(01 4-D "전용이면 소유"). 색·간격 전부 토큰.
import { Badge } from './Badge';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { SegmentedControl } from './SegmentedControl';
import { TextInput } from './TextInput';
import { InputGroup } from './InputGroup';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Icon, type IconName } from './Icon';
import { fmtNumber } from './_cells';
import './board.css';

export type BoardPost = {
  id: string;
  category?: string;            // 말머리(중립 태그). 없으면 분류 칸 빈칸
  title: string;
  author: { name: string; dept?: string };
  date: string;                 // 표시 문자열(포맷은 소비처)
  views?: number;
  comments?: number;
  attachments?: number;
  unread?: boolean;             // 안 읽음 → 제목 볼드 + 점
  isNew?: boolean;              // NEW 태그
  pinned?: boolean;             // 상단 고정(공지 밴드)
  mustRead?: boolean;           // 필독 배지
};

type Props = {
  title: string;
  description?: string;
  posts: BoardPost[];
  categories?: { value: string; label: string }[];  // 분류 탭(소비처 노출 결정). '전체'는 소비처가 포함
  category?: string;
  onCategoryChange?: (v: string) => void;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  createLabel?: string;
  onCreate?: () => void;
  onSelectPost?: (post: BoardPost) => void;
  page?: number;
  onPageChange?: (p: number) => void;
  totalPages?: number;
  totalCount?: number;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function BoardList({
  title, description, posts, categories, category, onCategoryChange,
  searchQuery, onSearchChange, searchPlaceholder = '제목·작성자 검색',
  createLabel = '글쓰기', onCreate, onSelectPost,
  page, onPageChange, totalPages, totalCount, emptyState,
}: Props) {
  const pinned = posts.filter((p) => p.pinned);
  const normal = posts.filter((p) => !p.pinned);
  // 가드는 **안쪽 조건과 같아야 한다.** 예전엔 `categories.length > 0`만 봤는데 아래 렌더는
  //  category·onCategoryChange까지 요구해서, 분류는 줬지만 값·핸들러를 안 준 소비처에서
  //  띠가 spacer 하나만 든 채로 렌더됐다(검색도 없으면 통째로 빈 줄). 자리를 잡아두는 이유가 없는데 잡혔다.
  const showCats = categories != null && categories.length > 0 && category != null && onCategoryChange != null;
  const showStrip = showCats || onSearchChange != null;
  const isEmpty = posts.length === 0;

  function meta(p: BoardPost) {
    return (
      <div className="board-meta">
        {p.attachments ? <span className="m"><Icon name="paperclip" size="sm" />{p.attachments}</span> : null}
        {p.comments ? <span className="m cmt"><Icon name="message" size="sm" />{p.comments}</span> : null}
      </div>
    );
  }

  function row(p: BoardPost) {
    return (
      <div key={p.id} className={`board-row board-post${p.unread ? ' unread' : ''}`}
        onClick={onSelectPost ? () => onSelectPost(p) : undefined}>
        <div className="board-cat">
          {p.pinned
            ? <Badge color="info" strength="fill">공지</Badge>
            : p.category ? <Badge color="neutral">{p.category}</Badge> : null}
        </div>
        <div className="board-title">
          {p.mustRead && <Badge color="danger" strength="fill">필독</Badge>}
          {p.unread && !p.pinned && <span className="board-dot" />}
          <span className="board-t">{p.title}</span>
          {p.isNew && <Badge color="danger">NEW</Badge>}
        </div>
        {meta(p)}
        <div className="board-author">
          <span className="nm">{p.author.name}</span>
        </div>
        <div className="board-date">{p.date}</div>
        <div className="board-views">{p.views != null ? fmtNumber(p.views) : ''}</div>
      </div>
    );
  }

  return (
    <Page>
      <div className="board">
        <PageHeader
          title={title}
          meta={description ? [{ kind: 'text', label: description }] : undefined}
          actions={onCreate ? [{ label: createLabel, variant: 'primary', icon: 'plus', onClick: onCreate }] : undefined}
        />

        {showStrip && (
          <div className="board-strip">
            {showCats && (
              <SegmentedControl options={categories} value={category} onChange={onCategoryChange} size="sm" />
            )}
            <span className="board-spacer" />
            {onSearchChange && (
              <div className="board-search">
                <InputGroup leftAddon={<Icon name="search" size="sm" />}>
                  <TextInput value={searchQuery ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} size="sm" />
                </InputGroup>
              </div>
            )}
          </div>
        )}

        <div className="board-card">
          {isEmpty ? (
            <EmptyState
              icon={emptyState?.icon ?? 'file-text'}
              title={emptyState?.title ?? '게시글이 없습니다'}
              description={emptyState?.description}
            />
          ) : (
            <>
              <div className="board-row board-head">
                <div>분류</div>
                <div>제목</div>
                <div className="r">첨부·댓글</div>
                <div>작성자</div>
                <div className="c">날짜</div>
                <div className="c">조회</div>
              </div>
              {pinned.length > 0 && <div className="board-pinned">{pinned.map(row)}</div>}
              {normal.map(row)}
              {(totalCount != null || (totalPages != null && totalPages > 1)) && (
                <div className="board-foot">
                  <div className="board-total">{totalCount != null ? <>총 <b>{fmtNumber(totalCount)}</b>건</> : null}</div>
                  {totalPages != null && totalPages > 1 && page != null && onPageChange
                    ? <Pagination total={totalPages} value={page} onChange={onPageChange} />
                    : <span />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
