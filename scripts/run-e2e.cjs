const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function resolveMaestro() {
  const home = os.homedir();
  const names =
    process.platform === 'win32'
      ? ['maestro.bat', 'maestro.cmd', 'maestro.exe']
      : ['maestro'];
  const extraDirs = [
    path.join(home, 'maestro', 'maestro', 'bin'),
    path.join(home, 'maestro', 'bin'),
    path.join(home, '.maestro', 'bin'),
  ];
  const pathDirs = (process.env.PATH || process.env.Path || '')
    .split(path.delimiter)
    .filter(Boolean);
  const dirs = [...extraDirs, ...pathDirs];

  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

const maestro = resolveMaestro();
if (!maestro) {
  console.error('[Bu-Ting] Maestro CLI를 찾을 수 없습니다. Cursor를 재시작해도 같으면 CLI를 설치하세요.');
  console.error(
    '  Windows: https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip',
  );
  console.error(
    `  압축을 푼 뒤 bin을 PATH에 넣거나 ${path.join(os.homedir(), 'maestro', 'maestro', 'bin')} 에 두세요.`,
  );
  process.exit(1);
}

const result = spawnSync(maestro, process.argv.slice(2), {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
