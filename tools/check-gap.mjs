// tools/check-gap.mjs
//
// Room 09's wall quotes exact decimal expansions dozens of digits long. Nobody
// can proofread those, so nothing here is proofread: every one is recomputed
// and compared against the digits on the wall, and the expansions themselves
// are checked against an independent BigInt reconstruction of the same value.
//
//   node tools/check-gap.mjs

import {
  decompose,
  bitString,
  exactDecimal,
  nextUp,
  nextDown,
  gap,
  errorAgainst,
} from '../lib/binary64.js';

let failures = 0;

function eq(label, got, want) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}`);
  if (!ok) console.log(`         got ${got}\n         want ${want}`);
}

function ok(label, cond) {
  if (!cond) failures++;
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}`);
}

console.log('\nThe expansions quoted on the wall');

// The famous one. 55 significant digits, and every one of them is the truth
// about what the machine holds when a program says 0.1.
eq(
  'the double nearest 0.1',
  exactDecimal(0.1),
  '0.1000000000000000055511151231257827021181583404541015625',
);
eq(
  'the double nearest 0.2',
  exactDecimal(0.2),
  '0.200000000000000011102230246251565404236316680908203125',
);
eq(
  'the double nearest 0.3',
  exactDecimal(0.3),
  '0.299999999999999988897769753748434595763683319091796875',
);
// And the sum, which is a different number from the double nearest 0.3 — one
// step further up the grid. This is the entire folklore, written out.
eq(
  '0.1 + 0.2 lands here instead',
  exactDecimal(0.1 + 0.2),
  '0.3000000000000000444089209850062616169452667236328125',
);
ok('0.1 + 0.2 is not 0.3', 0.1 + 0.2 !== 0.3);
ok('and it is exactly one step above it', nextUp(0.3) === 0.1 + 0.2);

console.log('\nThe expansions are self-consistent');

// Independent reconstruction: significand * 2**exponent, done a different way
// (BigInt shifts and a rational reduction), must agree digit for digit.
for (const x of [0.1, 0.2, 0.3, 1 / 3, 1e-7, 12345.6789, 2 ** -60, Number.MIN_VALUE]) {
  const { sign, significand, exponent } = decompose(x);
  let want;
  if (exponent >= 0) {
    want = (significand << BigInt(exponent)).toString();
  } else {
    const k = BigInt(-exponent);
    const s = (significand * 5n ** k).toString().padStart(Number(k) + 1, '0');
    const w = s.slice(0, s.length - Number(k));
    const f = s.slice(s.length - Number(k)).replace(/0+$/, '');
    want = f ? `${w}.${f}` : w;
  }
  eq(`exact decimal of ${x}`, exactDecimal(x), (sign ? '-' : '') + want);
}

// Every expansion must read back as the number it came from. This is the check
// that would catch a subtly wrong digit anywhere in the middle.
for (const x of [0.1, 0.2, 0.3, 0.1 + 0.2, 1 / 3, 1e300, 5e-324, 2 ** 52 + 1]) {
  ok(`${x} round-trips through its exact decimal`, Number(exactDecimal(x)) === x);
}

console.log('\nThe steps between numbers');

ok('nextUp then nextDown returns', nextDown(nextUp(0.1)) === 0.1);
ok('nextUp(0) is the smallest subnormal', nextUp(0) === 5e-324);
ok('the smallest subnormal is exactly a power of two', exactDecimal(5e-324).endsWith('5'));
ok('nextUp crosses zero from below', nextUp(-Number.MIN_VALUE) === -0);
ok('nextUp of the largest finite double is Infinity', nextUp(Number.MAX_VALUE) === Infinity);

// The grid spacing at the magnitudes the wall names.
eq('between 1 and 2 the step is 2^-52', gap(1), 2 ** -52);
eq('the step at 1 written out', exactDecimal(gap(1)), '0.0000000000000002220446049250313080847263336181640625');
eq('between 2^52 and 2^53 the step is exactly 1', gap(2 ** 52), 1);
eq('between 2^53 and 2^54 the step is exactly 2', gap(2 ** 53), 2);

// Which is why counting stops working out there. Not "loses precision" — the
// odd number is simply not in the grid, so it lands on its neighbour.
ok('2^53 + 1 is not representable', 2 ** 53 + 1 === 2 ** 53);
ok('but 2^52 + 1 still is', 2 ** 52 + 1 !== 2 ** 52);
eq('the first integer that is not there', 2 ** 53, 9007199254740992);

console.log('\nAccumulating the error');

// Ten tenths. The room shows this running, so the endpoint has to be pinned.
let sum = 0;
const partials = [];
for (let i = 0; i < 10; i++) {
  sum += 0.1;
  partials.push(sum);
}
ok('ten tenths is not one', sum !== 1);

// The wall points at the fifth line: the drift is not monotonic, it cancels
// exactly at a half and then resumes. If that ever stopped being true the
// paragraph about it would be fiction.
eq('five tenths is exactly a half', exactDecimal(partials[4]), '0.5');
ok('but three tenths is not three tenths', partials[2] !== 0.3);
ok('and eight tenths is not eight tenths', partials[7] !== 0.8);
eq('ten tenths lands here', exactDecimal(sum), '0.99999999999999988897769753748434595763683319091796875');
ok('and it is one step below 1', nextUp(sum) === 1);

console.log('\nThe error against what was typed');

eq('0.1 is stored slightly high', errorAgainst('0.1').low, false);
eq(
  'by exactly this much',
  errorAgainst('0.1').error,
  '+0.0000000000000000055511151231257827021181583404541015625',
);
eq('0.3 is stored slightly low', errorAgainst('0.3').low, true);
eq('0.5 is exact', errorAgainst('0.5').error, '0');
eq('0.25 is exact', errorAgainst('0.25').error, '0');
eq('2 is exact', errorAgainst('2').error, '0');
ok('a non-decimal is refused rather than guessed', errorAgainst('abc') === null);

console.log('\nThe bits');

eq('1.0 is one bit of exponent bias and nothing else', bitString(1), '0'.repeat(1) + '01111111111' + '0'.repeat(52));
eq('the bit string is always 64 long', bitString(-0.1).length, 64);
eq('−0 differs from 0 in exactly one bit', bitString(-0), '1' + '0'.repeat(63));
ok('0.1 is a recurring pattern in binary', /(0011){4}/.test(bitString(0.1)));

console.log(
  failures === 0
    ? '\nEvery digit on room 09’s wall is the digit the format gives.\n'
    : `\n${failures} of room 09’s claims are wrong.\n`,
);

process.exit(failures === 0 ? 0 : 1);
