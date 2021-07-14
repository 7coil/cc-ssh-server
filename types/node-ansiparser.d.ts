declare module "node-ansiparser" {
  interface Methods {
    inst_p: (s: string) => void;
    inst_o: (s: string) => void;
    inst_x: (flag: string) => void;
    inst_c: (collected: string, params: string, flag: string) => void;
    inst_e: (collected: string, flag: string) => void;
    inst_H: (collected: string, params: string, flag: string) => void;
    inst_P: (dcs: string) => void;
    inst_U: () => void;
  }

  class AnsiParser {
    constructor(terminal: Methods);
    parse(input: string): void;
  }

  export = AnsiParser;
}
