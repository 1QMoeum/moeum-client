const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * HTML 특수문자를 이스케이프. 카카오 InfoWindow 등 문자열 content 에 서버 값을 넣을 때
 * XSS 를 막기 위해 사용한다.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE[ch])
}
