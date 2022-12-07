const instructions: { [key: string]: string } = {
    add: "",
    addi: "Adds an immediate value to the value in $Rs, stores result in $Rt",
    addiu: "Adds an immediate value to the value in $Rs, stores result in $Rt, unsigned",
    addu: "",
    and: "",
    andi: "Bitwise and of the value in $Rs and the immediate value, stores the result in $Rt",
    beq: "Branch to the immediate address if the values in $Rs == $Rt",
    bgez: "Branch to the immediate address if the value in $Rs >= 0",
    bgezal: "Branch-and-link to the immediate address if the value in $Rs >= 0",
    bgtz: "Branch to the immediate address if the value in $Rs > 0",
    blez: "Branch to the immediate address if the value in $Rs <= 0",
    bltz: "Branch to the immediate address if the value in $Rs < 0",
    bltzal: "Branch-and-link to the immediate address if the value in $Rs < 0",
    bne: "Branch to the immediate address if the values in $Rs != $Rt",
    break: "Causes a break interrupt",
    clo: "Count leading ones of $Rs, store in $Rd",
    clz: "Count leading zeroes of $Rs, store in $Rd",
    div: "Divides the values in $Rs and $Rt, storing the $Rs / $Rt in HI, and $Rs % $Rt in LO",
    divu: "Divides the values in $Rs and $Rt, storing the $Rs / $Rt in HI, and $Rs % $Rt in LO, unsigned",
    j: "Jump to the immediate address",
    jal: "Jump-and-link to the immediate address",
    jalr: "Jump-and-links to the address stored in the register $Rs, storing the return address in $Rd ($31 if not specified)",
    jr: "Jumps to the address stored in the register $Rs",
    lb: "Load one byte at the immediate address + $Rs into $Rt",
    lbu: "Load one byte at the immediate address + $Rs into $Rt, don't sign extend",
    lh: "Load two bytes at the immediate address + $Rs into $Rt",
    lhu: "Load two bytes at the immediate address + $Rs into $Rt, don't sign extend",
    lui: "Load the immediate value into the upper 16 bits of $Rt",
    lw: "Load four bytes at the immediate address + $Rs into $Rt",
    lwc1: "Load a word from the immediate address + $Rs into $Rt (floating point register)",
    lwl: "Load Word Left",
    lwr: "Load Word Right",
    madd: "",
    maddu: "",
    mfhi: "Copies the value from the HI register to $Rd",
    mflo: "Copies the value from the LO register to $Rd",
    movn: "Move Conditional on Not Zero",
    movz: "Move Conditional on Zero",
    msub: "",
    msubu: "",
    mthi: "Copies the value from $Rs to the HI register",
    mtlo: "Copies the value from $Rs to the LO register",
    mult: "Multiplies the values in $Rs and $Rt, storing the result in the HI and LO registers",
    multu: "Multiplies the values in $Rs and $Rt, storing the result in the HI and LO registers, unsigned",
    nor: "",
    or: "",
    ori: "Bitwise or of the value in $Rs and the immediate value, stores the result in $Rt",
    rotr: "Rotates the value in $Rt right by Sa logically, storing the result in $Rd",
    rotrv: "Rotates the value in $Rt right by the value in $Rs logically, storing the result in $Rd",
    sb: "Store one byte from $Rt into the immediate address + $Rs",
    seb: "Sign-Extend Byte",
    seh: "Sign-Extend Halfword",
    sh: "Store two bytes from $Rt into the immediate address + $Rs",
    sll: "Shifts the value in $Rt left by Sa logically, storing the result in $Rd",
    sllv: "Shifts the value in $Rt left by the value in $Rs logically, storing the result in $Rd",
    slt: "Set $Rd to 1 if $Rs < $Rt, otherwise set $Rd to 0, unsigned",
    slti: "Sets $Rt to 1 if the value in $Rs is less than the immediate value, otherwise sets $Rt to 0",
    sltiu: "Sets $Rt to 1 if the value in $Rs is less than the immediate value, otherwise sets $Rt to 0, unsigned",
    sltu: "Set $Rd to 1 if $Rs < $Rt, otherwise set $Rd to 0, unsigned",
    sra: "Shifts the value in $Rt right by Sa arithmetically, storing the result in $Rd",
    srav: "Shifts the value in $Rt right by the value in $Rs arithmetically, storing the result in $Rd",
    srl: "Shifts the value in $Rt right by Sa logically, storing the result in $Rd",
    srlv: "Shifts the value in $Rt right by the value in $Rs logically, storing the result in $Rd",
    sub: "",
    subu: "",
    sw: "Store four bytes from $Rt into the immediate address + $Rs",
    swc1: "Store a word from $Rt (floating point register) into the immediate address + $Rs",
    syscall: "Causes a system-call interrupt",
    teq: "Trap if Equal",
    teqi: "Trap if Equal Immediate",
    tge: "Trap if Greater or Equal",
    tgei: "Trap if Greater or Equal Immediate",
    tgeiu: "Trap if Greater or Equal Immediate Unsigned",
    tgeu: "Trap if Greater or Equal Unsigned",
    tlt: "Trap if Less Than",
    tlti: "Trap if Less Than Immediate",
    tltiu: "Trap if Less Than Immediate Unsigned",
    tltu: "Trap if Less Than Unsigned",
    tne: "Trap if Not Equal",
    tnei: "Trap if Not Equal Immediate",
    wsbh: "Word Swap Bytes Within Halfwords",
    xor: "",
    xori: "Bitwise xor of the value in $Rs and the immediate value, stores the result in $Rt",
};

const pseudoInstructions: { [key: string]: string } = {
    abs: "$Rs = |$Rt|",
    b: "Branch unconditionally",
    bal: "",
    begin: "Begin a new stack frame",
    beqz: "Branch if $Rs == 0",
    bge: "Branch if $Rs >= $Rt",
    bgeu: "Branch if $Rs >= $Rt unsigned",
    bgt: "Branch if $Rs > $Rt",
    bgtu: "Branch if $Rs > $Rt unsigned",
    ble: "Branch if $Rs <= $Rt",
    bleu: "Branch if $Rs <= $Rt",
    blt: "Branch if $Rs < $Rt",
    bltu: "Branch if $Rs < $Rt unsigned",
    bnez: "Branch if $Rs != 0",
    copy: "Copy the value from $Rs into $Rd",
    dbg_print_char: "Print the value of $Rs as a character without modifying any registers",
    dbg_print_int: "Print the value of $Rs as an integer without modifying any registers",
    dbg_print_str: "Print the value of $Rs as a string without modifying any registers",
    decr: "Decrement the value of $Rs",
    end: "End the current stack frame",
    incr: "Increment the value of $Rs",
    la: "",
    li: "",
    mod: "Store the remainder of $Rs / $Rt into $Rd",
    modu: "Store the remainder of $Rs / $Rt (unsigned) into $Rd",
    move: "Copy the value from $Rs into $Rd",
    mul: "$Rd = $Rs * $Rt",
    neg: "Flip all the bits in $Rs, store result in $Rd",
    negu: "Flip all the bits in $Rs, store result in $Rd",
    nop: "No-Operation - doesn't do anything",
    not: "$Rd = ! $Rs",
    pop: "Pop the top of the stack into $Rd",
    push: "Push $Rs to the top of the stack",
    rem: "Store the remainder of $Rs / $Rt into $Rd",
    remu: "Store the remainder of $Rs / $Rt (unsigned) into $Rd",
    rol: "Rotate Left",
    ror: "Rotate Right",
    seq: "",
    sge: "",
    sgeu: "",
    sgt: "",
    sgtu: "",
    sle: "",
    sleu: "",
    sne: "",
    zeb: "Zero-Extend Byte",
    zeh: "Zero-Extend Half",
};

const allInstructions = {
    ...instructions,
    ...pseudoInstructions,
};

export { instructions, pseudoInstructions, allInstructions };
