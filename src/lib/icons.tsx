import {
  ArrowLeftRight,
  Book,
  Bus,
  HeartPulse,
  Home,
  LucideIcon,
  MoreHorizontal,
  Plane,
  PlusCircle,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  HelpCircle,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  bus: Bus,
  zap: Zap,
  'heart-pulse': HeartPulse,
  repeat: Repeat,
  bag: ShoppingBag,
  plane: Plane,
  book: Book,
  'more-horizontal': MoreHorizontal,
  'trending-up': TrendingUp,
  wallet: Wallet,
  'plus-circle': PlusCircle,
  'arrow-left-right': ArrowLeftRight,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? HelpCircle
  return <Icon className={className} strokeWidth={2} />
}
