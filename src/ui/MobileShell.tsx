'use client';
// MobileShell (유기체) — 모바일 셸. AppShell(데스크탑·태블릿)의 *형제*이지 축소판이 아니다.
//  · 왜 분리했나: 데스크탑 전제로 만든 page 템플릿(PageHeader + bento 면 + elevation)을 폭만 좁혀
//    넣으면 성립하지 않는다. 셸만 반응형으로 만들어도 안쪽 어휘가 안 따라오므로 층 전체를 갈랐다.
//    → AppShell은 데스크탑·태블릿 2티어만, 모바일은 이 부품 + 모바일 전용 page 어휘가 받는다.
//  · 시각 체계가 데스크탑과 정반대다: 면(surface)·그림자(elevation)를 쓰지 않고 **배경 + 가로 헤어라인**
//    으로만 나눈다. 이는 무테 지향(tenet)의 반대이지만 *모바일의 정체성*이라 정체성이 지향을 이긴다
//    (tenet vs 부품 정체성 — 선례 있음). 근거: **M3**가 "여백·구분선으로 더 단순한 위계가 되면 카드에
//    넣지 마라 / compact에서는 카드를 리스트로 / contained 리스트는 선이 아니라 gap"이라고 명문화한 것 /
//    TDS가 `Border`를 코어 부품으로 두고 리스트 어휘를 ListRow·ListHeader로 세운 것.
//    ⚠ 이전 판은 "Apple HIG가 inset grouped를 compact 폭·현지화 콘텐츠에서 말린다"를 근거로 썼으나
//      **현행 HIG 원문에서 확인 실패**했다(구 HIG 미러에만 있는 문장). 결론은 유지하고 근거만 교체한다.
//    ※ 단 이 규칙은 *묶음 컨테이너*에 대한 것이다. **입력칸은 예외로 면을 쓴다**(mobileshell.css 입력칸
//      어휘 절) — M3 자신이 카드를 말리면서 filled text field는 면으로 받는 것과 같은 구분이다.
//  · **상단은 한 층이다 — 헤더 행 하나, 고정, 항상.** 예전엔 두 층(셸 Navigation / 본문 MobileTop)이었고
//    iOS처럼 큰 제목이 스크롤로 접히는 구성을 검토했으나 **기각**했다: iOS의 접힘은 blur/material 위에서
//    "제목이 재질 뒤로 흘러들어간다"로 읽혀야 성립하는 문법인데, 우리는 면·그림자를 안 쓰기로 한 체계라
//    그 재질이 없다. 없는 재질 위에 동형을 만들면 두 층이 그냥 따로 노는 두 덩어리가 된다(06 §6).
//    → 제목은 헤더 행이 갖고, MobileTop은 폐기했다.
//  · 헤더 행에 **무엇이 들어가는지는 소비처가 정한다**(header prop). 다만 자유 슬롯(ReactNode)이 아니라
//    닫힌 어휘다 — 탈출구를 열면 화면마다 헤더가 달라진다. 데스크탑 PageHeader의 우측 CTA는 여기 없다:
//    **커밋은 하단 고정(bottom)**, 헤더는 진입·조작(accent)이다(06 §2).
//  · 탭은 3~5개(**M3**. 현행 HIG는 숫자를 안 박는다 — 3~5는 M3 규정이다). **오버플로('더보기') 없음**
//    — HIG도 "이런 상황을 제한하라"고 말리는 패턴이라, 넘치면 좁아지는 게 그대로 드러나게 둔다
//    (소비처가 추려서 준다).
//  · 셸 골격(고정 높이 바·본문 내부 스크롤·safe-area)은 우리 콘텐츠 프리미티브가 노출 안 한 탈출구라
//    격리 구역 내 raw CSS(헌법 7 명시 예외 — AppShell 골격과 동류). 바 *안의 콘텐츠*는 우리 부품으로 조립.
import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { mobileTypoVars } from './theme';
import { useMobileScope } from './_mobileScope';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { CountBadge } from './CountBadge';
import { IconButton } from './IconButton';
import { Stack } from './Stack';
import { renderAction, type Action } from './_cells';
import './mobileshell.css';

export type MobileTab = { label: string; icon: IconName; path: string; count?: number };

/**
 * ‹ › 로 바뀌는 제목 — 화면이 보고 있는 *범위*가 곧 이름인 경우(달력의 'YYYY년 M월').
 * 스테퍼는 **제목에 붙는다**(우측 액션 존이 아니다): ‹ ›는 화면의 액션이 아니라 제목을 바꾸는 컨트롤이라,
 * 액션 존에 두면 두 성격이 섞이고 상한 2도 다 먹는다.
 */
export type MobileHeaderValue = {
  value: string;
  onPrev: () => void;
  onNext: () => void;
  prevLabel?: string;   // 낭독용. 기본 '이전'
  nextLabel?: string;   // 기본 '다음'
};

/** 둘째 액션 — 반드시 아이콘 전용. 타입으로 못박는다(주석으로 적힌 상한은 지켜지지 않는다). */
type IconAction = Action & { iconOnly: true; icon: IconName };

/**
 * 헤더 행에 **놓을 것**. 셋 다 선택이다.
 *
 * ⚠ 이름이 '헤더'지만 *제목 행*이 아니다.
 *   이 타입은 행에 **무엇을 놓을지**만 정한다 — **행의 유무를 정하지 않는다.**
 *   `header`를 통째로 생략해도 행은 그대로 있고(고정 52px 밴드), 그래서 탭을 오갈 때 본문 시작선이 안 튄다.
 *   **비는 게 정상인 화면이 실제로 있다** — 제목을 다른 층에서 말하는 화면이 그렇다.
 */
export type MobileHeaderContent = {
  /** 화면 이름. 고정 문자열이거나, ‹ › 로 값을 바꾸는 제목이거나. **없어도 된다.** */
  title?: string | MobileHeaderValue;
  /** 있으면 좌측에 ‹. 없으면 그 자리는 **폭 0**(좌측 정렬이라 자리를 예약하지 않는다). */
  onBack?: () => void;
  backLabel?: string;   // 접근성 라벨(기본 '뒤로')
  /**
   * 우측 액션 — **상한 2**. 첫째만 텍스트가 될 수 있고 둘째는 아이콘 전용이다(타입이 강제한다).
   * 텍스트 액션의 기본 variant는 `accent`(채우지 않는 진입·조작). **커밋은 여기 오지 않는다** —
   * 그건 하단 고정(bottom)이 받는다(06 §2 화면 유형표).
   * 왜 2인가: 좌측 ‹ 와 제목이 축을 쓰고 있어 셋째부터 제목이 밀린다. 넘치면 오버플로 메뉴다(06 §4).
   */
  actions?: readonly [Action] | readonly [Action, IconAction];
};

type Props = {
  /** 헤더 행의 내용. **행은 항상 렌더된다** — 생략하면 빈 행이다(사라지지 않는다). */
  header?: MobileHeaderContent;
  // ── 탭(3~5 권장) ──
  tabs: MobileTab[];
  activePath: string;
  onNavigate: (path: string) => void;
  // ── 본문 ──
  children: ReactNode;
  // ── 하단 고정 영역(선택) ──
  //  탭 위에 고정되는 한 칸. 행동 버튼(CTA)이든 입력 바(MobileComposer)든 여기 들어간다.
  //  자리를 하나로 둔 이유: 둘 다 "탭 위 고정"이라 슬롯을 나누면 같은 자리를 두 경로가 다투게 된다.
  //  주지 않으면 렌더 0(높이도 0). 이 셸은 조회 중심이라 CTA는 지양하되, 자리는 열어둔다.
  bottom?: ReactNode;
};

export function MobileShell({
  header, tabs, activePath, onNavigate, children, bottom,
}: Props) {
  const { title, onBack, backLabel = '뒤로', actions } = header ?? {};
  // 제목은 두 모양 중 하나다 — 문자열이면 고정 제목, 객체면 ‹ › 가 딸린 값 제목.
  const stepper = typeof title === 'object' ? title : undefined;
  const titleText = typeof title === 'string' ? title : stepper?.value;
  // 문서 스크롤·고무줄 바운스 잠금 — 이 셸은 정의상 *화면 전체*라 문서가 따로 스크롤될 이유가 없다.
  //  CSS로 무조건 걸면 전역 부작용이 되므로, 마운트 동안만 걸고 언마운트에 되돌린다(부품이 자기 뒷정리를 한다).
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add('erp-mobile-lock');
    return () => el.classList.remove('erp-mobile-lock');
  }, []);
  // 모바일 **규격**(44/48 터치 높이 · iOS 확대 봉인 · 입력 면 어휘 · 타이포)은 크롬과 분리된 관심사다.
  //  셸이 소유하면 ① 크롬 없는 자리에서 규격이 통째로 사라지고 ② 포털(시트·경고·메뉴)은 아예
  //  스코프 밖이라 데스크탑 부품 얼굴로 돌아간다. 그래서 문서 루트에 건다 — 06 §1-9.
  useMobileScope();

  return (
    // 모바일 타이포 스케일을 루트에 깐다 — 자손의 Text·Title·Badge가 전부 이 값을 읽는다(역할 변수 통로).
    <div className="ms" style={mobileTypoVars as CSSProperties}>
      {/* 헤더 행 — **조건부가 아니다.** 아무것도 안 주면 빈 채로 남는다(고정 밴드).
          예전엔 hasNav로 바 자체를 지웠는데, 그러면 최상위 탭 화면만 바가 없어져 4탭의 상단 기하가
          서로 달라졌다(실화면 지적). 빈 띠보다 **탭을 오갈 때 본문 시작선이 안 튀는 것**이 비싸다 —
          iOS도 같은 값을 치른다(설정 루트는 크롬 행이 완전히 비지만 큰 제목 y는 알람 화면과 같다). */}
      <header className="ms-nav">
        <span className="ms-nav-lead">
          {onBack && <IconButton icon="chevron-left" label={backLabel} variant="ghost" size="sm" onClick={onBack} />}
        </span>
        {titleText != null && (
          <span className="ms-nav-title">
            {/* h2다. 폐기한 MobileTop이 Title variant="heading"(=h2)이었고, MobileSection의 기본
                headingLevel 3이 그 전제 위에 서 있다. span으로 옮기면 화면 제목이 heading 목록에서
                사라져 **제목 탐색이 통째로 죽는다** — 자리를 옮기는 것이 시맨틱을 버릴 이유는 아니다.
                생김새는 CSS가 눕힌다(.mls-hd-t와 같은 수법). */}
            <h2 className="ms-nav-title-t">{titleText}</h2>
            {stepper && (
              <span className="ms-nav-step">
                <IconButton icon="chevron-left" label={stepper.prevLabel ?? '이전'} variant="ghost" size="sm" onClick={stepper.onPrev} />
                <IconButton icon="chevron-right" label={stepper.nextLabel ?? '다음'} variant="ghost" size="sm" onClick={stepper.onNext} />
              </span>
            )}
          </span>
        )}
        {/* 제목과 액션 사이를 벌리는 자리. 제목이 없어도 액션은 우변에 붙는다. */}
        <span className="ms-nav-spacer" />
        <span className="ms-nav-trail">
          {/* 텍스트 액션의 기본은 accent(채우지 않는 진입). 아이콘 액션은 ghost 그대로 — 아이콘까지
              틴트를 먹이면 ⋯ 하나가 진입 액션만큼 무거워진다. */}
          {actions?.map((a, i) =>
            renderAction(a.iconOnly ? a : { ...a, variant: a.variant ?? 'accent' }, i, 'sm'),
          )}
        </span>
      </header>

      {/* 본문 — 유일한 스크롤 영역. 배경은 단일 평면(--bg-primary), 구분은 안쪽 부품의 헤어라인이 맡는다. */}
      <main className="ms-body">{children}</main>

      {/* 하단 고정 영역 — 탭 위. CTA 버튼이든 입력 바든 이 한 칸을 쓴다. */}
      {bottom && <div className="ms-bottom">{bottom}</div>}

      {/* 탭 — 균등 분배. 활성은 색 역할(primary) vs secondary **+ 아이콘 뒤 틴트 알약**(mobileshell.css).
          색 위계만으론 16px 글리프에서 안 읽혀서, 태블릿 레일과 같은 어휘로 배경 채널을 하나 더 준다.
          간격이 xxs가 아니라 xs인 이유: 알약이 아이콘 위아래로 3px 삐져나오므로 라벨과의 거리는
          아이콘이 아니라 *알약 가장자리*에서 재야 한다(M3도 인디케이터 가장자리 기준). safe-area는 CSS. */}
      <nav className="ms-tabs" aria-label="주 메뉴">
        {tabs.map((t) => {
          const active = t.path === activePath;
          return (
            <button key={t.path} type="button" className="ms-tab" data-active={active}
              aria-current={active ? 'page' : undefined} onClick={() => onNavigate(t.path)}>
              <Stack gap="xs" align="center">
                <span className="ms-tab-ico">
                  <Icon name={t.icon} size="sm" color={active ? 'primary' : 'secondary'} />
                  {/* size="sm" — 탭 아이콘이 16px이라 기본 md(18px)를 쓰면 배지가 아이콘보다 커진다(112%).
                      sm(15px)이면 94%로 내려가 아이콘이 다시 주인공이 된다. CountBadge 주석 참조. */}
                  {t.count != null && t.count > 0 && (
                    <span className="ms-tab-badge"><CountBadge count={t.count} size="sm" /></span>
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
