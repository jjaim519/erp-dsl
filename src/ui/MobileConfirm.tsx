'use client';
// MobileConfirm (유기체) — "정말 할까요?" 한 번 묻는 표면. `window.confirm`을 대신한다.
//
//  왜 필요한가: 패키지에 확인 표면이 없어 소비처가 `window.confirm`을 쓰고 있었다.
//   그건 **브라우저 크롬이 앱 표면 밖으로 튀어나오는** 것이라 폰에서 특히 이질적이고,
//   문구·버튼 라벨·파괴성 톤을 하나도 못 정한다(브라우저가 "확인/취소"로 고정한다).
//
//  왜 BottomSheet가 아닌가: 06 §2-2가 시트를 **생성·편집·피커**로 닫아뒀다.
//   확인은 값을 만들지도 고르지도 않는다 — 한 질문에 예/아니오다. iOS도 이 둘을 가른다
//   ("경고는 화면 가운데, 액션 시트는 아래"). 가운데 띄우면 **뒤 화면과의 연결이 끊겨** 흐름이 멈추는데,
//   확인이 원하는 게 정확히 그 멈춤이다. 시트는 반대로 "이어서 하는 중"을 말한다.
//
//  선언형이다(`opened`를 소비처가 쥔다) — Modal·Drawer·BottomSheet와 같은 계약.
//   `await confirm()` 같은 명령형 표면을 새로 만들지 않는다: 그건 부품이 아니라 장치이고,
//   포커스 복귀·중첩·언마운트 처리를 우리가 새로 떠안게 된다.
import { Modal as M } from '@mantine/core';
import { Button } from './Button';
import './mobilesheet.css';

type Props = {
  opened: boolean;
  title: string;
  // 왜 그런지 한 줄. 없으면 제목만 — 제목이 이미 질문이면 설명이 군더더기다.
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // 되돌릴 수 없는 일이면 danger. 색이 아니라 **되돌림 가능성**이 기준이다
  //  — 삭제는 danger고, 제출은 되돌릴 수 있으면 default다.
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

export function MobileConfirm({
  opened, title, message, confirmLabel = '확인', cancelLabel = '취소',
  tone = 'default', onConfirm, onCancel,
}: Props) {
  return (
    <M
      opened={opened}
      onClose={onCancel}
      withCloseButton={false}   /* X를 안 둔다 — 취소 버튼이 이미 그 경로고, 둘이면 어느 쪽이 "아니오"인지 흐려진다 */
      centered
      padding={0}
      size="auto"
      classNames={{ content: 'mcf' }}
      /* 배경 탭으로 안 닫는다. 확인은 **의도적으로 막는 자리**라, 손이 스쳐서 닫히면
         "아니오"를 누른 것과 구분이 안 된다(위험한 쪽으로 조용히 진행되진 않지만, 물음이 사라진다). */
      closeOnClickOutside={false}
    >
      <div className="mcf-t">{title}</div>
      {message && <div className="mcf-m">{message}</div>}
      {/* 취소가 먼저다 — 되돌릴 수 없는 쪽을 손가락 기본 경로에서 떼어 놓는다. */}
      <div className="mcf-ft">
        <span className="mcf-ft-a"><Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button></span>
        <span className="mcf-ft-a">
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </span>
      </div>
    </M>
  );
}
