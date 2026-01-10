export const SITE_NAME = 'AI Generated Base App';

export function buildTitle(pageTitle?: string) {
  if (!pageTitle) {
    return SITE_NAME;
  }

  return `${pageTitle} - ${SITE_NAME}`;
}
