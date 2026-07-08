import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML de fuentes externas antes de renderizarlo con dangerouslySetInnerHTML.
 * Permite etiquetas de formato estándar y elimina scripts, event handlers y URLs peligrosas.
 */
export const sanitizeHtml = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty);
};
