import { BitwiseOperator } from "typescript";

export function Assert(b: boolean, msg: string="Unspecified assertion")
{
    if(!b)
        throw msg;
}
export function AssertRange(arr: any[], indx: number, msg: string = "Index out of range!")
{
    Assert(indx >= 0 && indx < arr.length, msg);
}
export function AssertInteger32(n: number, msg: string="The number does not represent a possible 32-bit unsigned integer")
{
    Assert(n >= 0 && n <= REG32_MAX, msg);
    Assert(Math.round(n) == n, msg);
}
export function AssertBits(n: number, bits: number, msg?: string)
{
    if(msg == null)
    {
        msg = "Not a valid " + bits + " bit unsigned integer";
    }
    AssertInteger32(n, msg);
    Assert(n < (1 << n), msg);
}
export function BitReverse(n: number, nbits: number=32)
{
    let r=  0;
    for(let i = 0; i < nbits; i++)
    {
        r |= (n & (1 << (nbits-i-1)));
    }
    return r;
}
export function BitRange(n: number, low: number, high: number, reverse = false)
{
    let r = 0;
    if(low > high)
    {
        reverse = !reverse;
        const o = low;
        low = high;
        high = o;
    }
    high++;
    for(let i = 0; i < (high-low); i++)
    {
        r |= (+!!(n & (1 << (low+i))) << i);
    }
    if(reverse)
        r = BitReverse(r, (high-low));
    return r;
}
export function Mod(n: number, m: number): number 
{
    return ((n % m) + m) % m;
}
export const REG32_MAX = Math.pow(2, 32)-1;
export function LikeInteger32(n: number): number
{
    return Mod(n, REG32_MAX+1);
}
export function msleep(n: number) 
{
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
export function sleep(n: number) 
{
    msleep(n*1000);
}
export enum ShiftDir
{
    LEFT=0,
    RIGHT=1, 
    DEFAULT=1,
}

export function ShiftInDir(v: number, n: number, dir: ShiftDir): number
{
    AssertInteger32(v);
    if(dir == ShiftDir.RIGHT)
        return v >> n;
    return LikeInteger32(v << n);
}
export function BitsFromDir(v: number, n: number, dir: ShiftDir): number
{
    AssertInteger32(v);
    if(dir == ShiftDir.RIGHT)
        return BitRange(v, 0, n-1);
    return BitRange(v, (31-n)+1,31);
}
export function ShiftIntoFromDir(initial: number, toinsert: number, toshift: number, dir: ShiftDir): number
{
    return ShiftInDir(initial, toshift, dir) | BitsFromDir(toinsert, toshift, dir);
}