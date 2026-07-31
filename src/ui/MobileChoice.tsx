'use client';
// MobileChoice (분자) — 닫힌 선택지에서 하나 고르기. 가로 스크롤 **칩 줄**.
//
//  왜 드롭다운이 아닌가: 폰에서 Select는 (1)탭해서 열고 (2)고르는 두 동작이고, 그 사이 화면 절반을
//   오버레이가 덮는다. 선택지가 손에 꼽을 만큼이면 **전부 보여주고 한 번에 고르게** 하는 편이 빠르고,
//   무엇보다 *지금 뭘 고를 수 있는지*가 화면에 남는다(선택지가 숨지 않는다).
//  그리고 신호가 갈린다: 꺽쇠(⌄)는 **펼침**(수신자 조직도)에만 남는다 — 오버레이로 열리는 것과
//   제자리에서 펼쳐지는 것이 같은 글리프를 쓰면 화면이 거짓말을 한다(실화면 지적).
//  선택지가 많아지면(대략 6~7개 넘게) 이 줄이 가로로 길어져 뒤쪽이 숨는다 — 그때는 Select가 맞다.
//
//  같은 칩 줄을 게시판 목록의 말머리 필터가 이미 쓴다. 형태가 같으니 부품 하나로 모은다
//   (필터냐 폼 값이냐는 *데이터*의 차이지 컨트롤의 차이가 아니다).
import { Chip } from './Chip';
import './mobilelist.css';

type Option = { label: string; value: string };
type Props = {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function MobileChoice({ options, value, onChange, ariaLabel }: Props) {
  return (
    // 가로 스크롤 한 줄 — 줄바꿈하면 선택지가 늘 때마다 화면을 세로로 먹는다. 스크롤바는 숨기고 민다(폰 관습).
    <div className="mchoice" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <Chip key={o.value} variant="legend" selected={o.value === value} onChange={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
