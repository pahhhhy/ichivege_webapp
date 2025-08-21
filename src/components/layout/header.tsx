
'use client';

import Link from 'next/link';
import { Leaf, ShoppingCart, Menu, User, History, UserPlus, LogIn, LogOut, UserCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import React from 'react';


const navLinks = [
  { href: '/', label: '商品一覧', icon: Leaf },
  { href: '/orders', label: '注文履歴', icon: History },
];

function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-4 md:flex lg:gap-6">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col gap-4 py-4">
          <Link href="/" className="mb-4 flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold">ICHIVEGE</span>
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md p-2 text-lg font-medium transition-colors hover:bg-accent',
                pathname === link.href
                  ? 'bg-accent text-primary'
                  : 'text-foreground'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}


export function Header() {
  const { cartCount } = useCart();
  const { user, userProfile, loading, logout } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '??';
    return userProfile?.username
      ? userProfile.username.substring(0, 2).toUpperCase()
      : email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="hidden items-center gap-2 md:flex">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold">ICHIVEGE</span>
          </Link>
          {isMobile ? <MobileNav /> : <MainNav />}
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">ようこそ</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                {userProfile?.role === '農家' && (
                  <DropdownMenuItem asChild>
                    <Link href="/products/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>新しい商品を追加</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='hidden md:flex md:items-center md:gap-4'>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  ログイン
                </Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  新規登録
                </Link>
              </Button>
            </div>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" aria-label="カートを開く">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 transform px-2">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
