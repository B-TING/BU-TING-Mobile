/** SVG viewBox 좌표 → 레이아웃 픽셀 (preserveAspectRatio xMidYMid meet) */
export function parseViewBox(viewBox: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [x, y, width, height] = viewBox.split(/\s+/).map(Number);
  return { x, y, width, height };
}

export function svgPointToLayout(
  svgX: number,
  svgY: number,
  viewBox: string,
  layoutWidth: number,
  layoutHeight: number,
): { x: number; y: number } | null {
  if (layoutWidth <= 0 || layoutHeight <= 0) {
    return null;
  }

  const vb = parseViewBox(viewBox);
  const scale = Math.min(layoutWidth / vb.width, layoutHeight / vb.height);
  const renderedW = vb.width * scale;
  const renderedH = vb.height * scale;
  const offsetX = (layoutWidth - renderedW) / 2;
  const offsetY = (layoutHeight - renderedH) / 2;

  return {
    x: offsetX + (svgX - vb.x) * scale,
    y: offsetY + (svgY - vb.y) * scale,
  };
}
