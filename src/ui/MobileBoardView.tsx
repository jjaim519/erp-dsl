'use client';
// MobileBoardView (유기체) — 사내 게시판 글 보기의 모바일 화면. 데스크탑 BoardView의 짝.
//
//  · **타입 공유**: `BoardAttachment`·`BoardComment`를 데스크탑과 같은 한 벌로 받는다(변환 0).
//  · 데스크탑이 가진 업무 기능을 전부 갖는다 — 필독 읽음확인(경고 배너 + 진행률 + CTA) · 첨부 ·
//    이전/다음글 · 조회수 · 작성자 신원(부서·직책) · 댓글 차단(commentsAllowed).
//  · 데스크탑과 갈리는 것:
//    ① 글 카드가 없다 — 면·그림자 대신 섹션 헤어라인이 구획을 만든다(모바일 계열 정체성).
//    ② **댓글 작성란이 이 부품 안에 없다.** 폰은 입력이 화면 하단 고정이라 셸의 `bottom`에 `MobileComposer`를
//       꽂는다(v0.52.0: 긴 스크롤 끝의 입력창은 손이 안 닿는다). 그래서 답글도 *위치*가 아니라 **대상 태깅**으로
//       말한다 — `onReply(id)`로 대상만 올려보내고, 칩·초안은 컴포저가 갖는다.
//       데스크탑은 반대로 중첩 인라인 폼이다(위치가 대상을 말한다). 같은 행위, 다른 매체.
//    ③ 상단 액션(수정·삭제)도 셸 몫이다 — `MobileShell.actions`(아이콘 액션)가 그 자리다.
import type { ReactNode } from 'react';
import { Title } from './Title';
import { Text } from './Text';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Progress } from './Progress';
import { MobileSection } from './MobileSection';
import { MobileListRow } from './MobileListRow';
import { MobileFileRow } from './MobileFileRow';
import { MobileComment } from './MobileComment';
import { fmtNumber } from './_cells';
import type { BoardAttachment, BoardComment } from './BoardView';
import './board.css';      // 공지·필독·NEW 솔리드 배지 어휘는 데스크탑과 *같은 클래스*를 쓴다(같은 신호 = 같은 형태)
import './mobileboard.css';

type Props = {
  category?: string;
  notice?: boolean;
  mustRead?: boolean;
  title: string;
  author: { name: string; dept?: string; role?: string };
  date: string;                 // 표시 문자열(포맷은 소비처)
  views?: number;
  content: ReactNode;           // 본문(도메인 슬롯 — 보통 RichText)
  attachments?: BoardAttachment[];
  readState?: { read: number; total: number; acknowledged?: boolean; onAcknowledge?: () => void };
  prev?: { title: string; date?: string; onClick?: () => void };
  next?: { title: string; date?: string; onClick?: () => void };
  comments?: BoardComment[];
  commentsAllowed?: boolean;
  onReply?: (id: string) => void;   // 대상만 올려보낸다(칩·초안은 하단 MobileComposer가 갖는다)
};

export function MobileBoardView({
  category, notice, mustRead, title, author, date, views, content, attachments,
  readState, prev, next, comments, commentsAllowed = true, onReply,
}: Props) {
  const pct = readState && readState.total > 0 ? Math.round((readState.read / readState.total) * 100) : 0;
  const initial = author.dept ?? author.name.slice(0, 2);
  // parentId로 부모 아래 묶는다 — 배열 순서에 기대지 않는다(BoardView와 같은 규칙).
  const roots = comments?.filter((c) => !c.parentId) ?? [];
  const repliesOf = (id: string) => comments?.filter((c) => c.parentId === id) ?? [];
  const unread = readState ? Math.max(0, readState.total - readState.read) : 0;

  return (
    <>
      <MobileSection>
        {/* 셋 다 없으면 줄 자체를 안 그린다 — 껍데기만 남으면 margin-bottom(8)이 제목 위 정체불명 여백이 된다.
            (분류 없는 일반 글이 정확히 그 경우다.) */}
        {(notice || mustRead || category) && (
          <div className="mbv-badges">
            {notice && <Badge color="info" strength="fill">공지</Badge>}
            {mustRead && <Badge color="danger" strength="fill">필독</Badge>}
            {!notice && category && <Badge color="neutral">{category}</Badge>}
          </div>
        )}
        <Title variant="subheading">{title}</Title>
        {/* 작성자 신원 — 폰에서도 "누가 올린 글인가"는 업무 판단의 일부라 아바타·부서·직책을 유지한다. */}
        <div className="mbv-who">
          <Avatar size="sm">{initial}</Avatar>
          <div className="mbv-who-t">
            <Text variant="body-strong">{author.name}</Text>
            <Text variant="caption" color="secondary">
              {[author.dept, author.role].filter(Boolean).join(' · ')}
              {[author.dept, author.role].filter(Boolean).length > 0 ? ' · ' : ''}
              {date}
              {views != null ? ` · 조회 ${fmtNumber(views)}` : ''}
            </Text>
          </div>
        </div>
      </MobileSection>

      {/* 필독 읽음확인 — 배너는 *위*(읽기 전에 무엇을 요구받는지), CTA는 본문 *뒤*(읽고 나서 누른다). */}
      {mustRead && readState && (
        <MobileSection>
          <div className="mbv-must">
            <div className="hd"><Icon name="alert-triangle" size="sm" /><Text variant="body-strong">필독 공지입니다</Text></div>
            <Text variant="caption" color="secondary">내용 확인 후 아래 ‘읽음 확인’을 눌러주세요.</Text>
            <div className="prog">
              <div className="bar"><Progress value={pct} tone="primary" /></div>
              <Text variant="caption" color="secondary">읽음 {readState.read} / {readState.total}</Text>
            </div>
          </div>
        </MobileSection>
      )}

      {attachments && attachments.length > 0 && (
        <MobileSection title={`첨부파일 ${attachments.length}`} flush>
          {attachments.map((f) => (
            <MobileFileRow key={f.id} name={f.name} size={f.size} onDownload={f.onDownload} />
          ))}
        </MobileSection>
      )}

      <MobileSection>{content}</MobileSection>

      {mustRead && readState && (
        <MobileSection>
          {readState.acknowledged ? (
            <div className="mbv-ackdone"><Icon name="check-circle" size="sm" /><Text variant="body-strong">읽음 확인 완료</Text></div>
          ) : (
            <div className="mbv-ack">
              <Text variant="body-strong">이 공지를 확인하셨나요?</Text>
              <Text variant="caption" color="secondary">아직 읽지 않은 동료가 {unread}명 있습니다.</Text>
              <Button variant="primary" fullWidth leftIcon={<Icon name="check" size="sm" />}
                onClick={readState.onAcknowledge ?? (() => {})}>읽음 확인</Button>
            </div>
          )}
        </MobileSection>
      )}

      {/* 이전/다음글 — 데스크탑은 좌우 두 칸, 폰은 위아래 두 행(같은 정보, 축만 회전). */}
      {(prev || next) && (
        <MobileSection flush>
          {prev && <MobileListRow title={prev.title} meta={['이전글', prev.date].filter(Boolean).join(' · ')}
            leading={<Icon name="chevron-up" size="sm" color="secondary" />} onClick={prev.onClick} />}
          {next && <MobileListRow title={next.title} meta={['다음글', next.date].filter(Boolean).join(' · ')}
            leading={<Icon name="chevron-down" size="sm" color="secondary" />} onClick={next.onClick} />}
        </MobileSection>
      )}

      {commentsAllowed ? (
        <MobileSection title={`댓글 ${comments?.length ?? 0}`} flush>
          {roots.map((c) => (
            <div key={c.id}>
              <MobileComment comment={c} onReply={onReply} />
              {repliesOf(c.id).map((r) => <MobileComment key={r.id} comment={r} />)}
            </div>
          ))}
        </MobileSection>
      ) : (
        // 댓글이 막힌 글은 *조용히 비우지 않는다* — 작성란이 없는 이유를 화면이 말해야 한다.
        <MobileSection>
          <Text variant="caption" color="secondary">이 글은 댓글을 받지 않습니다.</Text>
        </MobileSection>
      )}
    </>
  );
}
