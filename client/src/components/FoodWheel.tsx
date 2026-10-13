import type { WheelItem } from '../lib/types';
import { money } from '../lib/format';

const SLICE_COLORS = ['#12356f', '#d4a017', '#1f4a8f'];
const SIZE = 320;
const R = 150;
const CX = SIZE / 2;

const polar = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180; // 0 deg = top, clockwise
  return [CX + r * Math.cos(rad), CX + r * Math.sin(rad)] as const;
};

/** The food wheel. `rotation` (degrees) is animated with a CSS transition by the parent. */
export function FoodWheel({ meals, rotation, spinning }: { meals: WheelItem[]; rotation: number; spinning: boolean }) {
  const step = 360 / Math.max(meals.length, 1);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <div aria-hidden className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-ink-900 drop-shadow" />
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full rounded-full shadow-card ring-8 ring-white" role="img" aria-label="Food wheel"
        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(0.12, 0.7, 0.1, 1)' : 'none' }}>
        {meals.length === 0 && <circle cx={CX} cy={CX} r={R} fill="#eef2f5" />}
        {meals.length === 1 && <circle cx={CX} cy={CX} r={R} fill={SLICE_COLORS[0]} />}
        {meals.length > 1 && meals.map((m, i) => {
          const [x1, y1] = polar(i * step, R);
          const [x2, y2] = polar((i + 1) * step, R);
          const mid = (i + 0.5) * step;
          const [tx, ty] = polar(mid, R * 0.62);
          // keep the label upright-ish: flip the text on the bottom half
          const textRot = mid > 180 ? mid + 90 : mid - 90;
          return (
            <g key={m._id}>
              <path d={`M${CX} ${CX} L${x1} ${y1} A${R} ${R} 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={SLICE_COLORS[i % 3]} stroke="#fff" strokeWidth="2" />
              <text x={tx} y={ty} transform={`rotate(${textRot} ${tx} ${ty})`} textAnchor="middle" fill={SLICE_COLORS[i % 3] === '#d4a017' ? '#0f1c33' : '#fff'} fontSize="11" fontWeight="800" style={{ textTransform: 'uppercase' }}>
                <tspan x={tx} dy="-2">{m.name.length > 14 ? `${m.name.slice(0, 13)}…` : m.name}</tspan>
                <tspan x={tx} dy="13" fontSize="10" fontWeight="600" opacity=".9">{money(m.price)}</tspan>
              </text>
            </g>
          );
        })}
        <circle cx={CX} cy={CX} r="30" fill="#0f1c33" stroke="#fff" strokeWidth="5" />
        <text x={CX} y={CX + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#e8b923">NUC</text>
      </svg>
    </div>
  );
}
