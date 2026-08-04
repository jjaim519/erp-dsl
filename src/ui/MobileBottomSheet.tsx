'use client';
// MobileBottomSheet (유기체) — 폰에서 "화면을 떠나지 않고" 짧은 일을 끝내는 표면.
//
//  **범위를 좁게 닫는다(06 §2-2).** 생성·편집·피커에만 쓴다. 액션 목록 시트는 만들지 않는다
//   — 액션 목록은 `Menu`다(06 §5). 여기 들어오는 건 *값을 만들거나 고르는* 일이다.
//
//  왜 Drawer(position="bottom")를 그냥 안 쓰나: 그 부품은 데스크탑 흐름용이라 헤더에 heading·닫기 X를
//   세우고 푸터 버튼을 우측 정렬한다. 폰에서는 셋 다 틀리다 — 제목은 작고, 닫기는 X보다 배경 탭이며,
//   버튼은 우측이 아니라 폭을 다 쓴다. 표면 체계가 갈리므로 형제 부품으로 세운다(Mobile* 규율 그대로).
//   다만 **포털·포커스 트랩·Escape·배경 스크롤 잠금은 Mantine Drawer가 이미 옳게 한다** — 그건 재사용한다.
//
//  높이: **내용만큼, 최대 90dvh.** 여러 단 스냅(peek/half/full)은 안 만든다 —
//   그건 드래그가 유일 경로인 어포던스인데 06 §1-4가 금지하고, 우리 시트는 필드 상한 6이라 길지도 않다.
//   내용이 넘치면 *본문만* 스크롤한다(제목·푸터는 고정).
//
//  키보드: 폰에서 입력칸을 누르면 키보드가 시트를 덮는다. visualViewport로 겹친 높이를 재서 그만큼 띄운다
//   — position:fixed는 *레이아웃* 뷰포트 기준이라 키보드가 떠도 안 밀린다(iOS에서 특히).
import { useEffect, useState, type ReactNode } from 'react';
import { Drawer as D } from '@mantine/core';
import { Icon } from './Icon';
import { renderAction, type Action } from './_cells';
import './mobilesheet.css';

type Props = {
  opened: boolean;
  onClose: () => void;
  title?: string;              // 없으면 제목 줄을 안 그린다(피커처럼 제목이 군더더기인 경우)
  // 커밋 자리. **상한 2를 타입에 못박는다** — MobileShell.actions와 같은 판단(주석 상한은 안 지켜진다).
  //  1개면 폭을 다 쓰고, 2개면 균등 분할한다. 셋째가 필요하면 그건 시트가 아니라 화면이다(06 §4).
  actions?: readonly [Action] | readonly [Action, Action];
  closeOnOverlayClick?: boolean;
  children: ReactNode;
};

/** 키보드가 시트를 덮은 높이(px). 키보드가 없으면 0. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;                                  // 미지원 브라우저는 0 — 덮이더라도 깨지진 않는다
    const measure = () => {
      // 레이아웃 뷰포트에서 시각 뷰포트(키보드 위 영역)를 뺀 만큼이 가려진 높이다.
      //  offsetTop은 확대(pinch) 중 시각 뷰포트가 위로 밀린 양 — 빼지 않으면 확대할 때마다 시트가 뛴다.
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      setInset(hidden > 0 ? Math.round(hidden) : 0);
    };
    measure();
    vv.addEventListener('resize', measure);
    vv.addEventListener('scroll', measure);
    return () => { vv.removeEventListener('resize', measure); vv.removeEventListener('scroll', measure); };
  }, []);
  return inset;
}

export function MobileBottomSheet({
  opened, onClose, title, actions, closeOnOverlayClick = true, children,
}: Props) {
  const kb = useKeyboardInset();
  return (
    <D
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"                 /* 내용 높이 — 상한은 CSS(max-height:90dvh)가 건다 */
      closeOnClickOutside={closeOnOverlayClick}
      withCloseButton={false}     /* 기본 헤더 끔 — 폰 제목 줄은 우리가 조립한다 */
      padding={0}
      classNames={{ content: 'mbs' }}
      /* 키보드가 덮은 만큼만 띄운다. 인라인인 이유: 값이 런타임 측정치라 CSS 변수로 내려도 결국 인라인이다. */
      styles={{ content: { marginBottom: kb ? `${kb}px` : undefined } }}
    >
      {/* 손잡이 — 끄는 어포던스가 아니라 **"이건 위에 얹힌 면"이라는 표지**다.
          우리 시트는 드래그로 닫지 않는다(배경 탭·Escape·푸터가 경로다 — 제스처는 유일 경로가 아니다). */}
      <span className="mbs-grip" aria-hidden />

      {title && (
        <div className="mbs-hd">
          <span className="mbs-hd-t">{title}</span>
          {/* 닫기는 배경 탭이 주 경로지만, 배경이 안 보이는 만큼 높은 시트에서는 그것만으론 막힌다.
              그래서 표적을 하나 남긴다 — 데스크탑 Drawer와 같은 자리, 크기만 44px. */}
          <button type="button" className="mbs-hd-x" aria-label="닫기" onClick={onClose}>
            <Icon name="x" size="sm" color="secondary" />
          </button>
        </div>
      )}

      <div className="mbs-body">{children}</div>

      {actions && actions.length > 0 && (
        <div className="mbs-ft">
          {/* 폭은 CSS가 준다 — renderAction은 fullWidth를 안 받고, 그걸 받게 여는 건
              모든 호출처(표·PageHeader·Modal…)에 축을 하나 여는 일이라 값이 안 맞는다. */}
          {actions.map((a, i) => (
            <span key={i} className="mbs-ft-a">{renderAction(a, i)}</span>
          ))}
        </div>
      )}
    </D>
  );
}
