import { urlRegExp } from '../constants';

export const formatMessage = (content: string): string => {
  if (urlRegExp.test(content)) {
    return content.replace(urlRegExp, (url) => {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }
  if (/\*\*\*(.*?)\*\*\*/.test(content)) {
    return content.replace(/\*\*\*(.*?)\*\*\*/, (inner) => {
      const realContent = inner.substring(3, inner.length - 3);
      return `<b><i>${realContent}</i></b>`;
    });
  }
  if (/\*\*(.*?)\*\*/.test(content)) {
    return content.replace(/\*\*(.*?)\*\*/, (inner) => {
      const realContent = inner.substring(2, inner.length - 2);
      return `<i>${realContent}</i>`;
    });
  }
  if (/\*(.*?)\*/.test(content) && !/\*\*(.*?)\*\*/.test(content)) {
    return content.replace(/\*(.*?)\*/, (inner) => {
      const realContent = inner.substring(1, inner.length - 1);
      return `<b>${realContent}</b>`;
    });
  }
  return content;
};
