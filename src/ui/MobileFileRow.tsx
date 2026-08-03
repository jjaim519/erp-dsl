'use client';
// MobileFileRow (분자) — 첨부 파일 한 줄(읽기). 아이콘 + 이름 + 크기 + 우측 동작.
//  · MobileListRow로 대신하지 않는 이유: 그 행은 *누르면 다른 화면으로 간다*(chevron)인데,
//    첨부는 누르면 내려받는다. 행동이 다르므로 별개 named 부품(§11-3 — 옵션으로 얹지 않는다).
//  · 이름은 길고 확장자는 끝에 있다 → 가운데를 자르지 않고 끝을 살린다(말줄임은 왼쪽에서).
//  · 파일 크기·형식 문자열은 소비처가 준다(부품은 바이트를 포맷하지 않는다 — 도메인/로케일).
import { Icon } from './Icon';
import './mobilelist.css';

type Props = {
  name: string;
  size?: string;              // '24 KB' 등 — 포맷은 소비처
  onOpen?: () => void;        // 있으면 행 본체가 *뷰어를 연다*. 내려받기는 우측 버튼으로 갈라진다.
  onDownload?: () => void;    // onOpen이 없으면 행 전체가 이것. 있으면 우측 아이콘 버튼.
};

// onOpen이 생기면 한 행에 행위가 둘이 된다(열기 / 내려받기). 그때는 **행 본체 = 주 행위(열기)**,
//  보조 행위는 우측 버튼으로 갈라낸다 — MobileListRow가 chevron과 trailing을 가르는 것과 같은 규율이다.
//  (한 행 안에서 같은 표적이 두 행위를 하면 어느 쪽이 일어날지 손가락이 알 수 없다.)
export function MobileFileRow({ name, size, onOpen, onDownload }: Props) {
  const body = (
    <>
      <span className="mfr-ico"><Icon name="file" size="sm" color="primary" /></span>
      <span className="mfr-name">{name}</span>
      {size && <span className="mfr-size">{size}</span>}
    </>
  );

  // 열기가 주 행위인 경우 — 본체는 버튼, 내려받기는 형제 버튼(중첩 버튼 금지).
  if (onOpen) {
    return (
      <div className="mfr" data-split>
        <button type="button" className="mfr-main" onClick={onOpen}>{body}</button>
        {onDownload && (
          <button type="button" className="mfr-dl" onClick={onDownload} aria-label={`${name} 내려받기`}>
            <Icon name="download" size="sm" color="secondary" />
          </button>
        )}
      </div>
    );
  }

  const inner = (
    <>
      {body}
      {onDownload && <span className="mfr-dl"><Icon name="download" size="sm" color="secondary" /></span>}
    </>
  );
  return onDownload
    ? <button type="button" className="mfr" onClick={onDownload}>{inner}</button>
    : <div className="mfr">{inner}</div>;
}
