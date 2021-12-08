import { Assert, AssertBits, BitRange } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";
import { Instruction } from "./instruction";
import { IRQCalculateAddress } from "./irq";

export class WAIT extends Instruction
{
    pol: boolean;
    index: number;
    state_getter: (m: Machine, pol: boolean, index: number) => boolean;
    private irq_getter(m: Machine, pol: boolean, index: number) : boolean
    {
        const address = IRQCalculateAddress(m, index);
        if(m.pio.GetIRQ(address))
        {
            if(pol)
                m.pio.ClearIRQ(address);
            m.wait_on_irq_flag = false;
            return pol;
        }
        m.wait_on_irq_flag = true;
        return !pol;
    }
    protected TickFunc(machine: Machine): boolean
    {
        return this.state_getter(machine, this.pol, this.index) == this.pol;
    }
    constructor(pol: boolean, source: number, index: number, sideset_delay: number)
    {
        super(sideset_delay);
        AssertBits(source, 2);
        AssertBits(index, 5);
        this.pol = pol;
        this.index = index;
        this.state_getter = 
        {
            0b00 : (m: Machine, pol: boolean, index: number) => m.pio.GetPin(index),
            0b01 : (m: Machine, pol: boolean, index: number) => 
            {
                Assert(index >= m.config!.in_pins_base && index < m.config!.in_pins_base + m.config!.in_pins_n, 
                    "WAIT pin out of range");
                return m.pio.GetPin(m.config!.in_pins_base + index)
            },
            0b10 : this.irq_getter,
        }[source]!;

    }
}