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
import { useId } from 'react';
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
  // 라디오 묶음 이름 — 한 화면에 MobileChoice가 여럿이면(분류·품목 등) 이름이 같아선 안 된다.
  //  같은 name은 네이티브 규칙상 *한 그룹*이라, 분류를 고르면 품목 선택이 풀린다. useId가 인스턴스마다 다른 값을 준다.
  const groupName = useId();
  return (
    // 가로 스크롤 한 줄 — 줄바꿈하면 선택지가 늘 때마다 화면을 세로로 먹는다. 스크롤바는 숨기고 민다(폰 관습).
    //
    // role="radiogroup"이 이제 **참**이다: 자식이 실제 <input type="radio">이고 같은 name으로 묶인다.
    //  한동안 이 선언이 거짓이었다(자식이 Mantine 기본값 checkbox였다) — 스크린리더가 없는 구조를 읽어줬다.
    //  껍데기(role)가 아니라 원자(Chip.type)를 고쳐야 닫히는 문제였고, R4에서 Chip에 type/name을 열어 닫았다.
    <div className="mchoice" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        // color를 **명시**한다. legend variant는 원래 *범례*용이라 "켜짐 = 자기가 거는 바와 같은 색"이
        //  전제인데, 이 줄은 항목별 색이 없는 **단일 선택 컨트롤**이다. 색을 안 넘기면 기본 neutral이 되어
        //  켜짐(neutral-2 연회색)과 꺼짐(투명+회색 윤곽)이 **둘 다 무채색**이라 무엇이 켜졌는지 안 보인다(실화면).
        //  컨트롤의 켜짐은 primary다 — MobileSegment 활성 밑줄·탭바 캡슐과 같은 어휘라 셋이 한 이야기를 한다.
        //  축으로 열지 않는다: 이 부품은 정의상 색이 없는 선택지라 소비처가 고를 것이 없다.
        <Chip key={o.value} variant="legend" color="primary" type="radio" name={groupName}
          selected={o.value === value} onChange={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
