export var js_example_program = `
    let prog = api.GetProgram("program_0");
    prog.SetSidesetPins(1, 1, true);
    prog.Start(true);
    prog.PushInput(16);
    prog.PushInput(7);
    api.Advancems(0.1);
`;