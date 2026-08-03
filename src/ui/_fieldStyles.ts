// 입력칸 테두리 통로. 평소엔 --border-field, FormField(분자)가 에러 시 --field-border를
// 자식 영역에 깔면 그 값으로 덮인다. 입력칸은 자기가 에러인지 모른다(역할 변수 통로).
//  ※ 폴백이 --border-default였을 때는 입력칸이 *구분선*과 같은 색이었다(1.27:1 — 칸과 선이 구분 불가).
//    --border-field는 입력칸 경계만을 위한 역할이다(theme.ts border.field, 06 §1-3).
export const fieldBorder = { borderColor: 'var(--field-border, var(--border-field))' };
