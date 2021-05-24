import { urlRegExp } from '../constants';
import { escapeString } from './escapeString';

export const formatMessage = (content: string): string => {
  if (urlRegExp.test(content)) {
    return content.replace(urlRegExp, (url) => {
      return `<a href="${url}" target="_blank">${escapeString(url)}</a>`;
    });
  }
  if (/\*\*\*(.*?)\*\*\*/.test(content)) {
    return content.replace(/\*\*\*(.*?)\*\*\*/, (inner) => {
      const realContent = inner.substring(3, inner.length - 3);
      return `<b><i>${escapeString(realContent)}</i></b>`;
    });
  }
  if (/\*\*(.*?)\*\*/.test(content)) {
    return content.replace(/\*\*(.*?)\*\*/, (inner) => {
      const realContent = inner.substring(2, inner.length - 2);
      return `<i>${escapeString(realContent)}</i>`;
    });
  }
  if (/\*(.*?)\*/.test(content) && !/\*\*(.*?)\*\*/.test(content)) {
    return content.replace(/\*(.*?)\*/, (inner) => {
      const realContent = inner.substring(1, inner.length - 1);
      return `<b>${escapeString(realContent)}</b>`;
    });
  }
  return escapeString(content);
};
