import readline from 'node:readline';

// Prompt interaktif; hidden = input disembunyikan (password tidak tampil di terminal).
export const ask = (q: string, hidden = false) =>
  new Promise<string>((ok) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });
    const w = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    if (hidden)
      w._writeToOutput = (s) => {
        if (!muted) w.output.write(s);
      };
    rl.question(q, (a) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      ok(a.trim());
    });
    if (hidden) muted = true;
  });
