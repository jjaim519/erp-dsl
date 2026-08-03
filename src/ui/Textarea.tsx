// Textarea 원자 — 여러 줄 입력.
//  · variant는 "이 칸이 무엇인가"를 가른다(크기 조절 손잡이가 아니다):
//      field(기본)  = 폼의 한 칸. 내용이 높이를 정한다(01 크기 원칙 — 높이는 내용에서 도출).
//      canvas       = *글을 쓰는 면*(게시글 본문·메모). 비어 있어도 여러 줄로 시작한다.
//    canvas가 따로 있는 이유: M3가 텍스트 영역을 텍스트 필드와 다른 물건으로 규정하며
//    **"큰 초기 크기가 긴 응답이 가능하고 권장됨을 알린다"**고 못박는다. 한 줄로 시작하는 본문칸은
//    제목칸과 구분되지 않아 그 신호가 통째로 사라진다(모바일 게시판 작성 실화면에서 확인).
//  · 그래도 minRows/maxRows는 안 연다 — 열면 소비처마다 "몇 줄짜리 본문"이 달라져 화면이 갈린다.
//    닫힌 두 어휘 중 고르게 하고, 줄 수는 부품이 정한다(Card·Button variant와 같은 형태).
import { Textarea as M } from '@mantine/core';
import { fieldBorder } from './_fieldStyles';

type TextareaVariant = 'field' | 'canvas';

type Props = {
  size?: 'sm' | 'md'; disabled?: boolean; placeholder?: string; autosize?: boolean;
  variant?: TextareaVariant;
  value: string; onChange: (value: string) => void; name?: string;
};

// canvas의 시작 줄 수 — 폰(body 17px·행간 1.55)에서 약 160px. 화면 잔여고의 1/4쯤이라
// "여기가 본문"이 한눈에 서면서도 아래 첨부·옵션이 화면 밖으로 밀리지 않는다.
const CANVAS_ROWS = 6;

export function Textarea({
  size = 'md', disabled, placeholder, autosize, variant = 'field', value, onChange, name,
}: Props) {
  const canvas = variant === 'canvas';
  return (
    <M
      size={size} disabled={disabled} placeholder={placeholder}
      // canvas는 항상 성장한다(쓰는 면인데 내부 스크롤이 생기면 쓴 글이 안 보인다).
      autosize={canvas ? true : autosize}
      minRows={canvas ? CANVAS_ROWS : undefined}
      value={value} name={name}
      onChange={(e) => onChange(e.currentTarget.value)} radius="sm" styles={{ input: fieldBorder }}
      // canvas 표식 — 모바일 셸이 입력 원자에 면을 깔 때 *이것만* 뺀다(mobileshell.css).
      //  본문 캔버스는 섹션 안의 한 칸이 아니라 그 섹션의 주인공 면이라, 면을 입으면 상자 안 상자가 된다.
      classNames={canvas ? { input: 'erp-canvas' } : undefined}
    />
  );
}
