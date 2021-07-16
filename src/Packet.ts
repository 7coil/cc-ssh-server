import { json } from "./json";

enum PacketType {
  login = "login",
  disconnect = "disconnect",
  error = "error",
  keypress = "keypress",
  char = "char",
  inst_p = "inst_p",
  inst_o = "inst_o",
  inst_x = "inst_x",
  inst_c = "inst_c",
  inst_e = "inst_e",
  inst_H = "inst_H",
  inst_P = "inst_P",
  inst_U = "inst_U",
}

interface GenericPayload {
  s?: string;
  flag?: string;
  collected?: string;
  params?: number[];
  dcs?: string;
  kc?: number;
  char?: string;
  held?: boolean;
  width?: number;
  height?: number;
  remote?: string;
  username?: string
}

class Packet<Type = PacketType, Payload = GenericPayload> {
  type: Type;
  payload: Payload;

  constructor(type: Type, payload: Payload) {
    this.type = type;
    this.payload = payload;
  }

  encode(): string {
    const data = {
      t: this.type,
      p: this.payload,
    };
    console.log(data);
    return json.stringify(data);
  }

  static parse(data: string): Packet {
    const parsed = json.parse(data);
    return new Packet(parsed.t, parsed.p);
  }
}

interface KeyPacket
  extends Packet<
    PacketType.keypress,
    {
      kc: number;
      held: boolean;
    }
  > {}

interface CharPacket
  extends Packet<
    PacketType.char,
    {
      char: string;
    }
  > {}

interface TerminalInstpPacket
  extends Packet<
    PacketType.inst_p,
    {
      s: string;
    }
  > {}

interface TerminalInstxPacket
  extends Packet<
    PacketType.inst_x,
    {
      flag: string;
    }
  > {}

interface TerminalInstcPacket
  extends Packet<
    PacketType.inst_c,
    {
      collected: string,
      params: number[],
      flag: string,
    }
  > {}

interface TerminalLoginPacket
  extends Packet<
    PacketType.login,
    {
      width: number;
      height: number;
      remote: string;
      username: string;
    }
  > {}

interface TerminalDisconnectPacket
  extends Packet<
    PacketType.disconnect,
    {
      s: string;
    }
  > {}

export {
  Packet,
  PacketType,
  KeyPacket,
  CharPacket,
  TerminalInstpPacket,
  TerminalInstxPacket,
  TerminalInstcPacket,
  TerminalLoginPacket,
  TerminalDisconnectPacket,
};
