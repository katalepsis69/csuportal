/**
 * Icon contract (v2): lucide-react re-exports under the legacy Icon* names so
 * page markup never changes. Decorative by default (aria-hidden).
 */
import type { ComponentType, SVGProps } from 'react';
import {
  PieChart, ClipboardList, FileText, Save, Gauge, Settings,
  Hourglass, BadgeCheck, PenLine, LogOut, Star,
  Users, TriangleAlert,
} from 'lucide-react';

type IconProps = { className?: string };
type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

function wrap(Icon: LucideIcon) {
  return function IconShim({ className = 'h-5 w-5' }: IconProps) {
    return <Icon className={className} aria-hidden />;
  };
}

export const IconChartPie = wrap(PieChart);
export const IconClipboardText = wrap(ClipboardList);
export const IconFileText = wrap(FileText);
export const IconFloppyDisk = wrap(Save);
export const IconGauge = wrap(Gauge);
export const IconGear = wrap(Settings);
export const IconHourglass = wrap(Hourglass);
export const IconSealCheck = wrap(BadgeCheck);
export const IconSignature = wrap(PenLine);
export const IconSignOut = wrap(LogOut);
export const IconStar = wrap(Star);
export const IconUsers = wrap(Users);
export const IconWarning = wrap(TriangleAlert);
