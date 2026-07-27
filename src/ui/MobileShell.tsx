'use client';
// MobileShell (유기체) — 모바일 셸. AppShell(데스크탑·태블릿)의 *형제*이지 축소판이 아니다.
//  · 왜 분리했나: 데스크탑 전제로 만든 page 템플릿(PageHeader + bento 면 + elevation)을 폭만 좁혀
//    넣으면 성립하지 않는다. 셸만 반응형으로 만들어도 안쪽 어휘가 안 따라오므로 층 전체를 갈랐다.
//    → AppShell은 데스크탑·태블릿 2티어만, 모바일은 이 부품 + 모바일 전용 page 어휘가 받는다.
//  · 시각 체계가 데스크탑과 정반대다: 면(surface)·그림자(elevation)를 쓰지 않고 **배경 + 가로 헤어라인**
//    으로만 나눈다. 이는 무테 지향(tenet)의 반대이지만 *모바일의 정체성*이라 정체성이 지향을 이긴다
//    (tenet vs 부품 정체성 — 선례 있음). 근거: TDS가 `Border`를 코어 부품으로 두고 리스트 어휘를
//    ListRow·ListHeader로 세운 것 / Apple HIG가 inset grouped를 "compact 폭, 특히 현지화 콘텐츠에서
//    텍스트 줄바꿈을 유발한다"며 말리는 것(iPhone 세로 = compact, 한국어 = localized).
//  · 상단은 두 층으로 본다(TDS Navigation / Top 분리): 이 셸은 **Navigation(뒤로·우측 아이콘 액션)만**
//    소유하고, 화면 제목(Top)은 본문 첫 블록으로 *화면*이 갖는다. 데스크탑 PageHeader의 우측 CTA는
//    여기 없다 — CTA는 헤더가 아니라 하단 고정(cta)이 받는다.
//  · 탭은 3~5개(HIG). **오버플로('더보기') 없음** — HIG가 "오버플로 탭은 가능한 한 피하라, 숨은 탭은
//    도달·인지가 어렵다"고 말리는 패턴이라, 넘치면 좁아지는 게 그대로 드러나게 둔다(소비처가 추려서 준다).
//  · 셸 골격(고정 높이 바·본문 내부 스크롤·safe-area)은 우리 콘텐츠 프리미티브가 노출 안 한 탈출구라
//    격리 구역 내 raw CSS(헌법 7 명시 예외 — AppShell 골격과 동류). 바 *안의 콘텐츠*는 우리 부품으로 조립.
import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { mobileTypoVars } from './theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { CountBadge } from './CountBadge';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { Stack } from './Stack';
import { type Action } from './_cells';
import './mobileshell.css';

export type MobileTab = { label: string; icon: IconName; path: string; count?: number };

type Props = {
  // ── Navigation(셸 크롬) ──
  title?: string;              // 2뎁스에서 "여기가 어디인지". 최상위 화면은 생략하고 본문 Top이 제목을 갖는다.
  onBack?: () => void;         // 있으면 ‹ 노출
  backLabel?: string;          // 접근성 라벨(기본 '뒤로')
  actions?: Action[];          // 우측 아이콘 액션(iconOnly 전제 — 텍스트 CTA 자리가 아니다)
  // ── 탭(3~5 권장) ──
  tabs: MobileTab[];
  activePath: string;
  onNavigate: (path: string) => void;
  // ── 본문 ──
  children: ReactNode;
  // ── 하단 고정 CTA(선택) ──
  //  이 셸은 GW의 *부분집합*(주로 조회·가벼운 상호작용)이라 CTA는 지양한다. 다만 화면 하나가 행동을
  //  요구할 때 셸을 다시 뜯지 않도록 자리만 열어둔다. 주지 않으면 렌더 0(높이도 0).
  cta?: Action;
};

export function MobileShell({
  title, onBack, backLabel = '뒤로', actions,
  tabs, activePath, onNavigate, children, cta,
}: Props) {
  // 문서 스크롤·고무줄 바운스 잠금 — 이 셸은 정의상 *화면 전체*라 문서가 따로 스크롤될 이유가 없다.
  //  CSS로 무조건 걸면 전역 부작용이 되므로, 마운트 동안만 걸고 언마운트에 되돌린다(부품이 자기 뒷정리를 한다).
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add('erp-mobile-lock');
    return () => el.classList.remove('erp-mobile-lock');
  }, []);

  const hasNav = Boolean(onBack || title || (actions && actions.length > 0));

  return (
    // 모바일 타이포 스케일을 루트에 깐다 — 자손의 Text·Title·Badge가 전부 이 값을 읽는다(역할 변수 통로).
    <div className="ms" style={mobileTypoVars as CSSProperties}>
      {/* Navigation — 뒤로 / 제목 / 우측 아이콘 액션. 아무것도 없으면 바 자체를 렌더하지 않는다. */}
      {hasNav && (
        <header className="ms-nav">
          <span className="ms-nav-lead">
            {onBack && <IconButton icon="chevron-left" label={backLabel} variant="ghost" size="sm" onClick={onBack} />}
          </span>
          <span className="ms-nav-title">{title}</span>
          <span className="ms-nav-trail">
            {actions?.map((a, i) =>
              a.icon ? (
                <IconButton key={i} icon={a.icon} label={a.label} variant="ghost" size="sm" onClick={a.onClick} />
              ) : null,
            )}
          </span>
        </header>
      )}

      {/* 본문 — 유일한 스크롤 영역. 배경은 단일 평면(--bg-primary), 구분은 안쪽 부품의 헤어라인이 맡는다. */}
      <main className="ms-body">{children}</main>

      {/* 하단 고정 CTA — 탭 위. 지양하되 자리는 있다. */}
      {cta && (
        <div className="ms-cta">
          <Button variant={cta.variant === 'danger' ? 'danger' : 'primary'} fullWidth onClick={cta.onClick}>
            {cta.label}
          </Button>
        </div>
      )}

      {/* 탭 — 균등 분배. 활성은 색 역할(primary) vs secondary. safe-area만큼 아래를 비운다. */}
      <nav className="ms-tabs" aria-label="주 메뉴">
        {tabs.map((t) => {
          const active = t.path === activePath;
          return (
            <button key={t.path} type="button" className="ms-tab" data-active={active}
              aria-current={active ? 'page' : undefined} onClick={() => onNavigate(t.path)}>
              <Stack gap="xxs" align="center">
                <span className="ms-tab-ico">
                  <Icon name={t.icon} size="sm" color={active ? 'primary' : 'secondary'} />
                  {t.count != null && t.count > 0 && (
                    <span className="ms-tab-badge"><CountBadge count={t.count} /></span>
                  )}
                </span>
                <Text variant="caption" color={active ? 'primary' : 'secondary'}>{t.label}</Text>
              </Stack>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
