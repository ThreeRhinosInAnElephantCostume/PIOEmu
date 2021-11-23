import { Assert } from "./utils";

export class FIFO<T>
{
    private data: T[] = [];
    private _size;

    get empty() 
    {
        return this.data.length == 0
    };

    get full()
    {
        return this.count == this.capacity;
    }

    get count()
    {
        return this.data.length;
    }

    get capacity()
    {
        return this._size;
    }
    Peek(): T
    {
        Assert(!this.empty);
        return this.data[0];
    }
    Pop(def: T | null = null): T
    {
        if(def != null && this.empty)
            return def;
        Assert(!this.empty);
        return this.data.splice(0, 1)[0];
    }
    Push(v: T)
    {
        if(this.data.length == this.capacity)
            this.Pop(); 
        this.data.push(v);
    }
    Clear()
    {
        this.data = [];
    }

    constructor(size: number)
    {
        Assert(size >= 0); // size == 0 is an actual use case.
        this._size = size;
    }
}