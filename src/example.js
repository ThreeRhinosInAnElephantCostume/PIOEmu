export var js_example_program =
    `
    let prog = api.GetProgram("program_0");
    prog.SetSidesetPins(1, 1, true);
    prog.Start(true);
    prog.PushInput(16);
    prog.PushInput(7);
    api.Advancems(0.1);
`;
export var pio_example_program =
    `
; Side-set pin 0 is used for PWM output

.program pwm
.side_set 1 opt
    pull block      side 0
    mov isr, osr
start:
    pull noblock    side 0 ; Pull from FIFO to OSR if available, else copy X to OSR.
    mov x, osr             ; Copy most-recently-pulled value back to scratch X
    mov y, isr             ; ISR contains PWM period. Y used as counter.
countloop:
    jmp x!=y noset         ; Set pin high if X == Y, keep the two paths length matched
    jmp skip        side 1
noset:
    nop                    ; Single dummy cycle to keep the two paths the same length
skip:
    jmp y-- countloop      ; Loop until Y hits 0, then pull a fresh PWM value from FIFO
    jmp start
`;