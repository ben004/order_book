const PRECISION = ['P0', 'P1'];

export const calculateTotal = (data) => {
  return Object.keys(data).slice(0, 21).reduce((acc, k, i) => {
    const total = Object.keys(data).slice(0, i + 1).reduce((t, i) => {
      t = t + data[i].amount;
      return t;
    }, 0);
    const item = data[k];
    acc[k] = { ...item, total };
    return acc;
  }, {});
};

export const getMaxTotal = (data) => {
  return Object.keys(data).reduce((t, i) => {
    if (t < data[i].total) {
      return data[i].total;
    } else {
      return t;
    }
  }, 0);
};

export const getPrecision = (precision) => precision % PRECISION.length;

export const numberWithCommas = (x) => {
  x = x.toString();
  let pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
  return x;
}
