export const AGE_GUIDE = {
  '6-7': '建议：泥糊状，1~2次/天，单一食材连续观察 3 天。',
  '8-9': '建议：末碎状，2次/天，逐步增加食材搭配。',
  '10-12': '建议：软颗粒，2~3次/天，向家庭饮食过渡。',
};

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function nextStatus(status) {
  if (status === 'neutral') return 'safe';
  if (status === 'safe') return 'allergy';
  return 'neutral';
}
