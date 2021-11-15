
export function Assert(b: boolean, msg: string="Unspecified assertion")
{
    if(!b)
        throw msg;
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
        r |= (n & (1 << (low+i)));
    }
    if(reverse)
        r = BitReverse(r, (high-low));
    return r;
}
export function Mod(n: number, m: number): number 
{
    return ((n % m) + m) % m;
}
const REG32_MAX = Math.pow(2, 32)-1;
export function LikeInteger32(n: number): number
{
    return Mod(n, REG32_MAX);
}