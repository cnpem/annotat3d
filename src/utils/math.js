function mean(a) {
  let sum = 0.0;
  const len = a.length;
  for (let i=0; i<len; ++i) {
    sum += a[i]/len;
  }
  return sum;
}

function std(a) {
  const m = mean(a);
  let sum = 0.0;
  const len = a.length;
  for (let i=0; i<len; ++i) {
    const diff = a[i]-m;
    sum += (diff*diff)/(len-1);
  }
  return Math.sqrt(sum);
}

function clamp(minimum, value, maximum) {
    return Math.max(Math.min(value, maximum), minimum);
}

export {mean, std, clamp};
