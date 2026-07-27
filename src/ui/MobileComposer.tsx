'use client';
// MobileComposer (분자) — 화면 하단에 고정되는 입력 바. 셸의 bottom 슬롯에 꽂는다.
//  · 왜 하단 고정인가: 폰에서 긴 스크롤 끝의 입력창은 손이 안 닿는다. 메신저·댓글 입력이
//    전부 하단에 붙어 있는 이유가 그것이고, 셸이 이미 그 자리를 갖고 있으므로 거기 산다.
//  · 대상(답글 걸기)은 입력 위 칩으로 보여준다 — 어디에 달리는지가 *입력 옆*에 있어야 한다.
//    데스크탑 BoardView는 해당 댓글 아래 중첩 인라인 폼을 쓰지만, 폰은 입력이 하단 고정이라
//    "위치"로 대상을 말할 수 없다. 그래서 폰에서는 태깅이 정답이다(같은 행위, 다른 매체).
//  · controlled 전용 — 값의 주인은 소비처(입력군 횡단규칙과 동형).
//  · 자동 높이: 여러 줄 입력이 되되 최대 높이에서 멈추고 안에서 스크롤한다(바가 화면을 먹지 않게).
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import './mobilelist.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  // 답글 대상 — 있으면 입력 위에 칩이 뜨고 ✕로 해제한다. 무엇에 다는지는 소비처가 문구로 준다.
  replyTo?: { label: string; onCancel: () => void };
};

export function MobileComposer({
  value, onChange, onSubmit, placeholder = '내용을 입력하세요', disabled, replyTo,
}: Props) {
  const canSend = value.trim().length > 0 && !disabled;
  return (
    <div className="mcps">
      {replyTo && (
        <div className="mcps-target">
          <Icon name="arrow-back-up" size="sm" />
          <span className="t">{replyTo.label}</span>
          <button type="button" className="x" aria-label="답글 취소" onClick={replyTo.onCancel}>
            <Icon name="x" size="sm" />
          </button>
        </div>
      )}
      <div className="mcps-row">
        {/* 격리 raw textarea — 우리 Textarea 원자는 필드 테두리·라벨 규격을 갖는데, 하단 입력 바는
            테두리 없는 한 줄 확장형이라 규격이 다르다(Tree 인라인편집·CalendarPage 태그 명명과 같은 예외). */}
        <textarea
          className="mcps-input"
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.currentTarget.value);
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 96)}px`;
          }}
        />
        <IconButton icon="send" label="등록" variant="primary" size="sm"
          disabled={!canSend} onClick={onSubmit} />
      </div>
    </div>
  );
}
