'use client';
// AppShell 유기체 — ERP 공통 셸(모든 페이지 상속). 셸 크롬만 소유. 3티어 반응형.
//  · 경계: AppShell은 children만 받는다 — PageHeader는 페이지 템플릿이 소유(셸 비소유).
//  · **2티어**: 태블릿 768–1279(72px 아이콘 레일) / 데스크탑 ≥1280(260px 풀 넷바). JS 티어가 넷바 width·내용을 스왑.
//  · **모바일은 이 셸이 안 맡는다** — 잊은 게 아니라 의도적으로 범위 밖이다(v0.51.0에서 `MobileShell`로 분리).
//    분리 이유: 데스크탑 전제로 만든 page 템플릿을 폭만 좁혀 넣으면 성립하지 않는다(면·PageHeader·bento).
//    셸만 반응형으로 만들어도 안쪽 어휘가 안 따라오므로 층 전체를 갈랐다. 폰 티어(상단바·하단탭·더보기
//    오버플로·문서 스크롤 잠금)는 git 이력에 있고, 대응물은 MobileShell 계열이 갖고 있다.
//  · 하한 = MIN_WIDTH(768). 그 아래는 *지원 범위 밖*이라 가로 스크롤로 예측 가능하게 무너진다(레이아웃이
//    깨지는 대신). 소비처는 이 상수를 import해 같은 값으로 모바일 라우팅을 판정해야 틈이 안 생긴다.
//  · 상단바 없음: 유틸리티(알림·프로필)는 넷바 하단 존이 갖는다.
//    근거: 헌법상 상단바 좌측은 비고(넷바가 전체 경로 제공)·정체성은 PageHeader 소유 → 상단바에 남은
//    책임이 유틸리티(알림·프로필)뿐이라 해체하고, 그 둘을 넷바 하단 유틸리티 존으로 이관.
//  · 유틸리티 존(알림+프로필)은 티어마다 같은 데이터·다른 배치(menuItems가 넷바↔탭 재배치되는 것과 동형).
//    데스크탑=넷바 하단 [프로필 확장행 + 알림], 태블릿=레일 하단 [알림·아바타 아이콘].
//  · 로고: 데스크탑 넷바 최상단. 태블릿 레일(72px)엔 로고 없음 — 그 폭엔 정사각 마크만 들어가 부실해서
//    밴드 제거(메뉴부터 시작). 즉 logo는 데스크탑만 쓴다.
//  · 셸 골격(M.Header/Navbar/Main/Footer 슬롯·바 정렬·safe-area)은 우리 콘텐츠 프리미티브가 노출 안 한
//    탈출구라 격리 구역 내 raw Mantine/CSS(헌법 7) — Modal raw flex·Calendar raw grid와 같은 명시 예외.
//    단 슬롯 *안의 콘텐츠*(탭 타일·메뉴 행·유틸리티)는 우리 Stack/Group/Icon/Text로 조립(도그푸드).
import { AppShell as M, NavLink, Group as MGroup, Stack as MStack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { CountBadge } from './CountBadge';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';
import { Popover } from './Popover';
import { Menu } from './Menu';
import { Stack } from './Stack';
import { Group } from './Group';
import { type Action } from './_cells';

type MenuItem = { label: string; icon: IconName; path: string; group?: string; count?: number };
// 프로필 더보기: menu(Action[]) 주면 Popover로 메뉴, 없으면 onMenuClick 폴백(경쟁 경로 아님).
type Profile = { name: string; role?: string; email?: string; avatarSrc?: string; onMenuClick?: () => void; menu?: Action[] };
// 알림: content 주면 Popover로 목록, 없으면 onClick 폴백.
type Notification = { hasUnread?: boolean; onClick?: () => void; content?: ReactNode };
type Props = {
  logo: ReactNode;
  onLogoClick?: () => void;
  menuItems: MenuItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  profile?: Profile;
  notification?: Notification;
  children: ReactNode;
};

// 셸 치수(px) — 시중 표준 참조로 확정.
//  NAV_WIDTH_DESKTOP : 데스크탑 풀 넷바 260 (표준 240~300).
//  NAV_WIDTH_RAIL    : 태블릿 아이콘 레일 72 (아이콘+짧은 라벨 세로 타일; 하단탭과 같은 tile()).
//  LOGO_BAND/SLOT    : 데스크탑 넷바 최상단 정체성 블록 88 / 로고 박스 56(밴드를 거의 채움, 종횡비 최대 적합).
//  MIN_WIDTH         : 지원 하한 768 — 그 아래는 모바일(MobileShell)이 받는다. 소비처가 같은 값을 써야 틈이 없다.
// 브레이크포인트: 태블릿 48–79.99em(768–1279) · 데스크탑 ≥80em(1280). em=브라우저 16px 기준(font-scale 무관).
//  1280 경계 근거: iPad 가로(≤Pro11 1194)를 태블릿 레일에 담기(결정 2). 값은 프리뷰 갤러리에서 튜닝 가능.
const NAV_WIDTH_DESKTOP = 260;
const NAV_WIDTH_RAIL = 72;
const LOGO_BAND = 88;
const LOGO_SLOT_HEIGHT = 56;
/** 셸이 지원하는 최소 뷰포트 폭(px). 이 아래는 모바일 전용 화면(MobileShell)이 받는다.
 *  소비처는 이 상수를 import해 같은 값으로 판정할 것 — 각자 숫자를 들면 언젠가 반드시 어긋난다. */
export const APPSHELL_MIN_WIDTH = 768;

function groupItems(items: MenuItem[]): Array<{ group?: string; items: MenuItem[] }> {
  const out: Array<{ group?: string; items: MenuItem[] }> = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.group === it.group) last.items.push(it);
    else out.push({ group: it.group, items: [it] });
  }
  return out;
}

export function AppShell({
  logo, onLogoClick, menuItems, activePath, onNavigate, profile, notification, children,
}: Props) {
  const [notifOpen, notifH] = useDisclosure();
  // 티어 감지 — 데스크탑↔태블릿을 JS로 가른다. 기본값 데스크탑(SSR/첫 렌더 안정) → 마운트 후 실제 뷰포트 반영.
  //  경계 1280(80em): iPad 가로(≤Pro11 1194)를 태블릿 레일에 담기 위함(패드는 가로 얇은 레일).
  //  하한(768) 아래는 이 셸의 범위가 아니다 — 소비처가 APPSHELL_MIN_WIDTH로 모바일 화면에 라우팅한다.
  const isDesktop = useMediaQuery('(min-width: 80em)', true);
  const tier: 'tablet' | 'desktop' = isDesktop ? 'desktop' : 'tablet';
  const groups = groupItems(menuItems);

  // 타일(아이콘 위 라벨) — 레일 전용. 활성은 색 역할(primary) vs secondary.
  const tile = (icon: IconName, label: string, active: boolean, count?: number) => (
    <Stack gap="xxs" align="center">
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <Icon name={icon} size="sm" color={active ? 'primary' : 'secondary'} />
        {count != null && count > 0 && (
          <span style={{ position: 'absolute', top: -7, left: '100%', marginLeft: -8 }}><CountBadge count={count} /></span>
        )}
      </span>
      <Text variant="caption" color={active ? 'primary' : 'secondary'}>{label}</Text>
    </Stack>
  );

  // ── 유틸리티 컨트롤(알림·프로필) — 티어마다 같은 데이터, 배치·형태만 다름 ──
  const unreadDot = (top: number, right: number) =>
    notification?.hasUnread ? (
      <span aria-hidden="true" style={{
        position: 'absolute', top, right, width: 8, height: 8,
        borderRadius: 'var(--mantine-radius-full)',
        background: 'var(--mantine-color-danger-6)', border: '2px solid var(--bg-primary)',
      }} />
    ) : null;

  // 알림 — kind 'icon'(넷바 하단) / 'tile'(레일). content 있으면 Popover, 없으면 onClick 폴백.
  const notifControl = (position: 'top' | 'right', kind: 'icon' | 'tile') => {
    if (!notification) return null;
    const hasContent = Boolean(notification.content);
    const trigger = kind === 'tile' ? (
      <span className="erp-rail-item" role="button" tabIndex={0}
        onClick={hasContent ? undefined : notification.onClick}>
        {tile('bell', '알림', false)}
        {unreadDot(6, 16)}
      </span>
    ) : (
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton icon="bell" label="알림" variant="ghost" onClick={hasContent ? undefined : notification.onClick} />
        {unreadDot(6, 6)}
      </span>
    );
    return hasContent ? (
      // 데스크탑(top)=넷바 하단 앵커에서 위로 솟는 패널 — 프로필 메뉴와 방향 통일(좌하단 유틸리티 문법).
      //  벨 중앙 정렬(align center): 벨이 넷바 우측 끝이라 우변 flush(end)면 좌변이 화면 밖으로 계산돼 shift 보정에 의존.
      //  폭은 셋 다 lg — 알림은 목록·본문이 들어가 넷바 폭(260)으로 좁히면 옹색(패널 구성이 lg 전제).
      //  태블릿(right)=레일 오른쪽 플라이아웃, 하단정렬(end)로 위로 안 부풂.
      <Popover opened={notifOpen} onChange={(o) => (o ? notifH.open() : notifH.close())}
        position={position} align={position === 'right' ? 'end' : 'center'} width="lg" content={notification.content}>
        {trigger}
      </Popover>
    ) : trigger;
  };

  // 프로필 — kind 'full'(넷바 하단, 아바타+이름·직책+caret) / 'rail'(레일, 아바타-only).
  const profileControl = (position: 'top' | 'right', kind: 'full' | 'rail') => {
    if (!profile) return null;
    const avatar = <Avatar src={profile.avatarSrc} size="md">{profile.name.slice(0, 1)}</Avatar>;
    const inner = kind === 'full' ? (
      <>
        {avatar}
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <Text variant="body-strong">{profile.name}</Text>
          {profile.role && <Text variant="caption" color="secondary">{profile.role}</Text>}
        </span>
        <Icon name="chevron-down" size="sm" color="secondary" />
      </>
    ) : avatar;
    const cls = kind === 'rail' ? 'erp-rail-item' : 'erp-profile-trigger';
    const menuHeader = (
      <MGroup gap="sm" align="center" wrap="nowrap">
        {avatar}
        <MStack gap={2}>
          <Text variant="body-strong">{profile.name}</Text>
          {(profile.email || profile.role) && (
            <Text variant="caption" color="secondary">{profile.email ?? profile.role}</Text>
          )}
        </MStack>
      </MGroup>
    );
    // 'full': justify space-between 컨테이너 안에서 아바타 카드는 자연폭(좌측 앵커), 알림 벨은 우측 끝으로 밀림.
    const style = kind === 'full' ? { display: 'flex', alignItems: 'center', gap: 'var(--mantine-spacing-sm)', minWidth: 0 } : undefined;
    // 데스크탑 'full'(넷바 하단 프로필)만 넷바폭 메뉴가 좌변 flush로 위로 솟음(좌하단 프로필 관습·알림과 통일).
    //  레일/상단바의 아바타-only는 기본(좁게·중앙 정렬) 유지.
    const menuWidth = kind === 'full' ? 'md' : 'sm';
    const menuAlign: 'start' | 'center' = kind === 'full' ? 'start' : 'center';
    return profile.menu && profile.menu.length > 0 ? (
      <Menu trigger={<span className={cls} style={style}>{inner}</span>} items={profile.menu} position={position} width={menuWidth} align={menuAlign} header={menuHeader} />
    ) : (
      <span className={cls} role="button" tabIndex={0} style={style}
        onClick={profile.onMenuClick}
        onKeyDown={profile.onMenuClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); profile.onMenuClick!(); }
        } : undefined}>
        {inner}
      </span>
    );
  };

  return (
    <M
      layout="alt"
      navbar={{ width: tier === 'desktop' ? NAV_WIDTH_DESKTOP : NAV_WIDTH_RAIL, breakpoint: 'sm', collapsed: { mobile: false, desktop: false } }}
      padding="lg"
      // 지원 하한 — 그 아래는 레이아웃이 깨지는 대신 가로 스크롤로 *예측 가능하게* 무너진다.
      //  정상 경로에선 보이지 않는다(소비처가 이 폭 아래를 모바일 화면으로 보내므로). 안전망이다.
      style={{ minWidth: APPSHELL_MIN_WIDTH }}
    >
      {/* 넷바 — 데스크탑(풀 260)·태블릿(레일 72). 3존: 로고(위) · 메뉴(grow) · 유틸리티(아래).
          우측 그림자로 "떠 있는 패널". */}
      <M.Navbar p={tier === 'tablet' ? 'xs' : 'md'} style={{ boxShadow: '2px 0 8px rgba(11, 26, 53, 0.08)', borderRight: 'none', zIndex: 2 }}>
        <>
            {/* 로고 — 데스크탑 넷바 최상단(a형). 밴드 하단 구분선이 정체성 블록을 드러냄.
                태블릿 레일(72px)은 로고 밴드 없음 — 그 폭엔 정사각 마크만 들어가 부실해서 제거(메뉴부터 시작). */}
            {tier === 'desktop' && (
              <M.Section style={{
                height: LOGO_BAND,
                display: 'flex', alignItems: 'center',
                marginBottom: 'var(--mantine-spacing-md)', borderBottom: '1px solid var(--border-default)',
              }}>
                <span className="erp-logo-slot" onClick={onLogoClick} style={{
                  height: LOGO_SLOT_HEIGHT, width: '100%',
                  display: 'flex', alignItems: 'center',
                  cursor: onLogoClick ? 'pointer' : 'default',
                }}>
                  {logo}
                </span>
              </M.Section>
            )}

            {/* 메뉴 — 가운데 grow. 데스크탑=NavLink(라벨+아이콘+카운트), 태블릿=세로 타일 레일. 넘치면 이 존만 스크롤. */}
            <M.Section grow style={{ overflowY: 'auto', minHeight: 0 }}>
              {tier === 'desktop' ? (
                <MStack gap="md">
                  {groups.map((g, gi) => (
                    <MStack gap={4} key={gi}>
                      {g.group && <Text variant="caption" color="secondary">{g.group}</Text>}
                      {g.items.map((it) => (
                        <NavLink key={it.path} label={it.label}
                          leftSection={<Icon name={it.icon} size="sm" />}
                          rightSection={it.count != null && it.count > 0 ? <CountBadge count={it.count} /> : undefined}
                          active={activePath === it.path} onClick={() => onNavigate(it.path)} />
                      ))}
                    </MStack>
                  ))}
                </MStack>
              ) : (
                <MStack gap="xxs">
                  {menuItems.map((it) => {
                    const active = activePath === it.path;
                    return (
                      <button key={it.path} type="button" className="erp-rail-item" data-active={active}
                        aria-current={active ? 'page' : undefined} onClick={() => onNavigate(it.path)}>
                        {tile(it.icon, it.label, active, it.count)}
                      </button>
                    );
                  })}
                </MStack>
              )}
            </M.Section>

            {/* 유틸리티 존(아래) — 데스크탑=[프로필 확장행 + 알림], 태블릿=[알림·아바타 아이콘]. 상단 구분선. */}
            {(profile || notification) && (
              <M.Section style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--mantine-spacing-sm)', marginTop: 'var(--mantine-spacing-sm)' }}>
                {tier === 'desktop' ? (
                  <MGroup gap="xs" justify="space-between" align="center" wrap="nowrap">
                    {profileControl('top', 'full')}
                    {notifControl('top', 'icon')}
                  </MGroup>
                ) : (
                  <MStack gap="xxs" align="center">
                    {notifControl('right', 'tile')}
                    {profileControl('right', 'rail')}
                  </MStack>
                )}
              </M.Section>
            )}
        </>
      </M.Navbar>

      {/* 문서 스크롤(데스크탑·태블릿 공통). */}
      <M.Main className="erp-appshell-main" style={{ background: 'var(--bg-tertiary)', minHeight: '100vh' }}>
        {children}
      </M.Main>

    </M>
  );
}
