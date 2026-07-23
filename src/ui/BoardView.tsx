'use client';
// BoardView (템플릿) — 사내 게시판 글 보기. 도메인 0줄(헌법 1).
//  · 발행물형 읽기 + 업무용 핵심: 필독 읽음확인(읽은 N/총원) · 첨부 · 이전/다음글 · 가벼운 댓글(1단 답글).
//  · 본문(content)은 도메인 콘텐츠 → raw ReactNode 슬롯(Modal children 동형). 소비처가 조립(에디터 산출/DSL 조합).
//  · 공지/필독 솔리드 배지(board.css 공유) + 필독바·첨부 well·읽음 CTA·이전다음·댓글 레이아웃은 board 전용
//    (01 4-D "전용이면 소유"). 분리는 surface 톤·구분선만(무테). 색·간격 전부 토큰.
import type { ReactNode } from 'react';
import { Container } from './Container';
import { Page } from './Page';
import { Title } from './Title';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { Divider } from './Divider';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Progress } from './Progress';
import { Textarea } from './Textarea';
import { Group } from './Group';
import { type Action, renderAction, fmtNumber } from './_cells';
import './board.css';

export type BoardAttachment = { id: string; name: string; size?: string; onDownload?: () => void };
export type BoardComment = {
  id: string;
  author: { name: string; dept?: string };
  date: string;
  body: string;
  isAuthor?: boolean;        // '작성자' 표시
  reply?: boolean;           // 1단 답글(들여쓰기) — 얕은 스레드
};

type Props = {
  category?: string;
  notice?: boolean;          // 공지 배지
  mustRead?: boolean;        // 필독 배지 + 읽음확인
  title: string;
  author: { name: string; dept?: string; role?: string };
  date: string;              // 작성일시(표시 문자열 — 포맷은 소비처)
  views?: number;
  content: ReactNode;        // 본문(도메인 슬롯 — 소비처 조립)
  attachments?: BoardAttachment[];
  readState?: { read: number; total: number; acknowledged?: boolean; onAcknowledge?: () => void };
  actions?: Action[];        // 우상단(수정/인쇄/삭제)
  onBack?: () => void;
  backLabel?: string;
  prev?: { title: string; date?: string; onClick?: () => void };
  next?: { title: string; date?: string; onClick?: () => void };
  comments?: BoardComment[];
  commentsAllowed?: boolean;
  commentValue?: string;
  onCommentChange?: (v: string) => void;
  onCommentSubmit?: () => void;
  onReply?: (commentId: string) => void;
};

export function BoardView({
  category, notice, mustRead, title, author, date, views, content, attachments,
  readState, actions, onBack, backLabel = '목록', prev, next,
  comments, commentsAllowed = true, commentValue, onCommentChange, onCommentSubmit, onReply,
}: Props) {
  const initial = author.dept ?? author.name.slice(0, 2);
  const pct = readState && readState.total > 0 ? Math.round((readState.read / readState.total) * 100) : 0;

  return (
    <Page>
      <Container maxWidth="default">
      <div className="boardview">
        {/* 상단 액션 — 좌 목록 / 우 수정·인쇄·삭제 */}
        <div className="boardview-actions">
          {onBack
            ? <Button variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" size="sm" />} onClick={onBack}>{backLabel}</Button>
            : <span />}
          {actions && actions.length > 0 && <Group gap="xs">{actions.map((a, i) => renderAction(a, i, 'sm'))}</Group>}
        </div>

        {/* 글 카드 */}
        <article className="boardview-card">
          <div className="boardview-head">
            <div className="boardview-badges">
              {notice && <span className="board-notice">공지</span>}
              {mustRead && <span className="board-must">필독</span>}
              {!notice && category && <Text variant="caption" color="secondary">{category}</Text>}
            </div>
            <Title variant="heading">{title}</Title>
            <div className="boardview-meta">
              <Avatar size="md">{initial}</Avatar>
              <div>
                <div className="who">{author.name} <span>· {[author.dept, author.role].filter(Boolean).join(' · ')}</span></div>
                <div className="sub"><span>작성 {date}</span>{views != null && <span>· 조회 {fmtNumber(views)}</span>}</div>
              </div>
            </div>
          </div>
          <Divider orientation="horizontal" />

          {/* 필독 읽음확인 배너 */}
          {mustRead && readState && (
            <div className="boardview-mustbar">
              <Icon name="alert-triangle" />
              <div className="txt">필독 공지입니다. <span>내용 확인 후 ‘읽음 확인’을 눌러주세요.</span></div>
              <div className="prog">
                <div className="bar"><Progress value={pct} tone="primary" /></div>
                <span className="num">읽음 {readState.read} / {readState.total}</span>
              </div>
            </div>
          )}

          {/* 첨부 */}
          {attachments && attachments.length > 0 && (
            <div className="boardview-attach">
              <div className="hd"><Icon name="paperclip" size="sm" />첨부파일 {attachments.length}</div>
              {attachments.map((f) => (
                <div key={f.id} className="boardview-file">
                  <Icon name="file" color="primary" />
                  <span className="nm">{f.name}</span>
                  {f.size && <span className="sz">{f.size}</span>}
                  <span className="dl"><IconButton icon="download" label="다운로드" variant="ghost" size="sm" onClick={f.onDownload ?? (() => {})} /></span>
                </div>
              ))}
            </div>
          )}

          {/* 본문(도메인 슬롯) */}
          <div className="boardview-body">{content}</div>

          {/* 읽음확인 CTA */}
          {mustRead && readState && (
            <div className="boardview-ack">
              {readState.acknowledged ? (
                <span className="done"><Icon name="check-circle" />읽음 확인 완료</span>
              ) : (
                <>
                  <div className="q">이 공지를 확인하셨나요?</div>
                  <div className="sub">아직 읽지 않은 동료가 {Math.max(0, readState.total - readState.read)}명 있습니다.</div>
                  <Button variant="primary" leftIcon={<Icon name="check" size="sm" />} onClick={readState.onAcknowledge ?? (() => {})}>읽음 확인</Button>
                </>
              )}
            </div>
          )}
        </article>

        {/* 이전/다음글 */}
        {(prev || next) && (
          <nav className="boardview-adjacent">
            {prev && (
              <div className="boardview-adj" onClick={prev.onClick}>
                <span className="dir"><Icon name="chevron-up" size="sm" />이전글</span>
                <span className="t">{prev.title}</span>{prev.date && <span className="dt">{prev.date}</span>}
              </div>
            )}
            {next && (
              <div className="boardview-adj" onClick={next.onClick}>
                <span className="dir"><Icon name="chevron-down" size="sm" />다음글</span>
                <span className="t">{next.title}</span>{next.date && <span className="dt">{next.date}</span>}
              </div>
            )}
          </nav>
        )}

        {/* 댓글 */}
        {commentsAllowed && (
          <section className="boardview-comments">
            <div className="hd">댓글 <span>{comments?.length ?? 0}</span></div>
            {comments?.map((c) => (
              <div key={c.id} className={`boardview-comment${c.reply ? ' reply' : ''}`}>
                <Avatar size="sm">{c.author.dept ?? c.author.name.slice(0, 2)}</Avatar>
                <div className="body">
                  <div>
                    <span className="who">{c.author.name}<span>· {c.author.dept}{c.isAuthor ? ' · 작성자' : ''}</span></span>
                    <span className="when">{c.date}</span>
                  </div>
                  <div className="text">{c.body}</div>
                  {onReply && !c.reply && (
                    <button type="button" className="boardview-reply" onClick={() => onReply(c.id)}>
                      <Icon name="arrow-back-up" size="sm" />답글
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="boardview-writer">
              <div className="field"><Textarea value={commentValue ?? ''} onChange={onCommentChange ?? (() => {})} placeholder="댓글을 입력하세요" autosize /></div>
              <Button variant="primary" onClick={onCommentSubmit ?? (() => {})}>등록</Button>
            </div>
          </section>
        )}
      </div>
      </Container>
    </Page>
  );
}
