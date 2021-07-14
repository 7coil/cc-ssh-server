enum PacketType {
  login = "login",
  disconnect = "disconnect",
  error = "error",
  keypress = "keypress",
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
  params?: string;
  dcs?: string;
  kc?: number;
  held?: boolean;
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
    console.log("encoded", data);
    return JSON.stringify(data);
  }

  static parse(data: string): Packet {
    const json = JSON.parse(data);
    return new Packet(json.t, json.p);
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
  TerminalInstpPacket,
  TerminalInstxPacket,
  TerminalInstcPacket,
  TerminalDisconnectPacket,
};
