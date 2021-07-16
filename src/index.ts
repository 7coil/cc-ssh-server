import { exec, execSync } from "child_process";
import { Server } from "ws";
import { Client, ClientChannel } from "ssh2";
import AnsiParser from "node-ansiparser";
import { readFileSync } from "fs";
import { CharPacket, KeyPacket, Packet, PacketType, TerminalLoginPacket } from "./Packet";

const wss = new Server({
  port: 8080,
});

wss.on("connection", (ws) => {
  const ssh = new Client();
  const parser = new AnsiParser({
    inst_p: (s: string) => {
      const packet = new Packet(PacketType.inst_p, { s });
      ws.send(packet.encode());
    },
    inst_o: (s: string) => {
      const packet = new Packet(PacketType.inst_o, { s });
      ws.send(packet.encode());
    },
    inst_x: (flag: string) => {
      const packet = new Packet(PacketType.inst_x, { flag });
      ws.send(packet.encode());
    },
    inst_c: (collected: string, params: string, flag: string) => {
      const packet = new Packet(PacketType.inst_c, { collected, params, flag });
      ws.send(packet.encode());
    },
    inst_e: (collected: string, flag: string) => {
      const packet = new Packet(PacketType.inst_e, { collected, flag });
      ws.send(packet.encode());
    },
    inst_H: (collected: string, params: string, flag: string) => {
      const packet = new Packet(PacketType.inst_H, { collected, params, flag });
      ws.send(packet.encode());
    },
    inst_P: (dcs: string) => {
      const packet = new Packet(PacketType.inst_P, { dcs });
      ws.send(packet.encode());
    },
    inst_U: () => {
      const packet = new Packet(PacketType.inst_U, {});
      ws.send(packet.encode());
    },
  });

  let stream: ClientChannel | undefined;

  const terminateConnection = (
    reason: string = "Connection ended without a reason."
  ) => {
    const packet = new Packet(PacketType.disconnect, { s: reason });

    ws.send(packet.encode(), () => {
      if (stream) stream.end();
      ssh.end();
      ws.close();
    });
  };

  ws.on("message", (data: Buffer) => {
    const packet = Packet.parse(data.toString());
    try {
      switch (packet.type) {
        case PacketType.keypress:
          const keyPacket = packet as KeyPacket;
          
          if (stream) {
            switch(keyPacket.payload.kc) {
              // left
              case 262:
                stream.stdin.write("\u001b[C");
                break;
              case 263:
                // right
                stream.stdin.write("\u001b[D");
                break;
              // down
              case 264:
                stream.stdin.write("\u001b[B");
                break;
              // up
              case 265:
                stream.stdin.write("\u001b[A");
                break;
              // enter
              case 257:
                stream.stdin.write("\r");
                break;
              // enter
              case 259:
                stream.stdin.write("\b");
                break;
              default:
                console.log(keyPacket.payload.kc);
            }
          }
          break;
        case PacketType.char:
          const charPacket = packet as CharPacket;
          stream?.stdin.write(charPacket.payload.char);
          break;
        case PacketType.login:
          if (stream)
            return terminateConnection(
              "A connection has already been established"
            );
          const loginPacket = packet as TerminalLoginPacket;
          ssh.connect({
            host: loginPacket.payload.remote,
            username: loginPacket.payload.username,
            privateKey: readFileSync("id_rsa"),
            tryKeyboard: true,
          });
          ssh.on("ready", () => {
            ssh.shell(
              {
                cols: loginPacket.payload.width,
                rows: loginPacket.payload.height,
              },
              (err, s) => {
                stream = s;
                
                stream.on("close", () => {
                  terminateConnection("SSH Connection Ended");
                });
  
                stream.on("data", (data: Buffer) => {
                  parser.parse(data.toString());
                });
              }
            );
          });
          break;
      }
    } catch(e) {
      terminateConnection(e.message);
    }
  });

  ssh.on("error", (err) => {
    console.log(err);
    terminateConnection(err.message);
  });

  ws.on("close", () => {
    ssh.end();
  });
});
