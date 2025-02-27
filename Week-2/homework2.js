function collatzSequenceLength(number) {
  let length = 1;
  while (number !== 1) {
    number = (number % 2 === 0) ? number / 2 : 3 * number + 1;
    length++;
  }

  return length;
}

let maxLength = 0;
let number = 0;

for (let i = 1; i < 1000000; i++) {
  const length = collatzSequenceLength(i);
  if (length > maxLength) {
    maxLength = length;
    number = i;
  }
}

console.log('1.000.000 altındaki en uzun Collatz dizisini üreten sayı:', number);