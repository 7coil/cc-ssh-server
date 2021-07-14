import { exec, execSync } from "child_process";
import { Server } from "ws";
import { Client } from "ssh2";
import AnsiParser from "node-ansiparser";
import { readFileSync } from "fs";
import { KeyPacket, Packet, PacketType } from "./Packet";

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

  const terminateConnection = (reason: string = 'Connection ended without a reason.') => {
    const packet = new Packet(PacketType.disconnect, { s: reason });

    ws.send(packet.encode(), () => {
      ssh.end();
      ws.close();
    })
  }

  ssh.on("ready", () => {
    ssh.shell(
      {
        cols: 51,
        rows: 19,
      },
      (err, stream) => {
        stream.on("close", () => {
          terminateConnection('SSH Connection Ended')
        });

        stream.on("data", (data: Buffer) => {
          parser.parse(data.toString());
        });

        ws.on("message", (data: Buffer) => {
          const packet = Packet.parse(data.toString());
          switch(packet.type) {
            case PacketType.keypress:
              const keyPacket = packet as KeyPacket
              if (keyPacket.payload.kc >= 65 && keyPacket.payload.kc <= 90) {
                stream.stdin.write(String.fromCharCode(keyPacket.payload.kc).toLowerCase())
              } else if (keyPacket.payload.kc >= 32 && keyPacket.payload.kc <= 126) {
                stream.stdin.write(String.fromCharCode(keyPacket.payload.kc))
              } else if (keyPacket.payload.kc === 257) {
                stream.stdin.write('\r\n')
              } else if (keyPacket.payload.kc === 259) {
                stream.stdin.write('\b')
              } else {
                console.log(keyPacket.payload.kc)
              }
          }
        });
      }
    );
  });

  ssh.on("error", (err) => {
    console.log(err);
    terminateConnection(err.message)
  });

  ws.on('close', () => {
    ssh.end();
  })

  ssh.connect({
    host: "127.0.0.1",
    username: "leond",
    privateKey: readFileSync("id_rsa"),
    tryKeyboard: true,
  });
});
