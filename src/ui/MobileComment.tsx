'use client';
// MobileComment (분자) — 댓글 한 줄. 1단 답글(parentId)까지 들여쓴다.
//  · 값 타입은 데스크탑 BoardView와 같은 `BoardComment`를 쓴다 — 소비처가 한 벌을 두 화면에 그대로 넘긴다.
//    (부모 링크는 parentId. 배열 순서에 기대지 않는다 — v0.49.0에서 boolean reply를 교체한 이유와 동일)
//  · 답글 *작성*은 여기 없다: 폰에서 입력은 화면 하단에 고정돼야 손이 닿는다(긴 스크롤 끝은 못 닿는다).
//    그래서 이 부품은 "답글 걸기" 신호만 쏘고, 실제 입력은 셸 하단의 MobileComposer가 받는다.
//    데스크탑 BoardView가 *중첩 인라인 폼*을 쓰는 것과 갈리는 지점 — 같은 행위지만 폰은 입력 위치가 다르다.
//  · 구분은 아래 헤어라인 하나(면·그림자 없음 — 모바일 체계).
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import type { BoardComment } from './BoardView';
import './mobilelist.css';

type Props = {
  comment: BoardComment;
  authorLabel?: string;              // 글쓴이 표시 문구(기본 '작성자') — 부품이 호칭을 지어내지 않는다
  onReply?: (id: string) => void;    // 있으면 답글 버튼 노출. 답글에는 안 붙는다(1단 스레드)
};

export function MobileComment({ comment: c, authorLabel = '작성자', onReply }: Props) {
  const isReply = Boolean(c.parentId);
  return (
    <div className={isReply ? 'mcmt reply' : 'mcmt'}>
      <Avatar size="sm">{c.author.dept ?? c.author.name.slice(0, 1)}</Avatar>
      <div className="mcmt-body">
        <div className="mcmt-head">
          <span className="mcmt-who">{c.author.name}</span>
          {c.author.dept && <span className="mcmt-dept">{c.author.dept}</span>}
          {c.isAuthor && <span className="mcmt-tag">{authorLabel}</span>}
          <span className="mcmt-when">{c.date}</span>
        </div>
        <div className="mcmt-text">{c.body}</div>
        {onReply && !isReply && (
          <button type="button" className="mcmt-reply" onClick={() => onReply(c.id)}>
            <Icon name="arrow-back-up" size="sm" />답글
          </button>
        )}
      </div>
    </div>
  );
}
