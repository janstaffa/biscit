interface options {
  fullDate?: boolean;
  noSeconds?: boolean;
}

export const formatTime = (time: string, options: options = { fullDate: false, noSeconds: false }) => {
  let date = new Date(time);
  if (Number.isNaN(Date.parse(time))) {
    date = new Date(parseInt(time));
  }
  const today = new Date();

  if (options.fullDate) {
    return `${date.getDate()}.${date.getMonth() + 1} ${date.getFullYear()} ${('00' + date.getHours()).slice(-2)}:${
      ('00' + date.getMinutes()).slice(-2) + (options.noSeconds ? `:${('00' + date.getSeconds()).slice(-2)}` : '')
    }`;
  }
  if (date.getDate() !== today.getDate()) {
    if (date.getFullYear() !== today.getFullYear()) {
      return `${date.getDate()}.${date.getMonth() + 1}. ${date.getFullYear()}`;
    }
    return `${date.getDate()}.${date.getMonth() + 1}. ${('00' + date.getHours()).slice(-2)}:${(
      '00' + date.getMinutes()
    ).slice(-2)}`;
  }
  return `${('00' + date.getHours()).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}`;
};
