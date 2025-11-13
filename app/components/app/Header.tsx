import Link from 'next/link';
import { Logo } from '../../lib/icons';
import { Button } from '../ui/button';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center gap-4">
        <Link href="/" className="flex items-center" prefetch={false}>
          <Logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">DeepView AI</span>
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" prefetch={false} className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" prefetch={false} className="hover:text-foreground transition-colors">How it works</Link>
          <Link href="#testimonials" prefetch={false} className="hover:text-foreground transition-colors">Testimonials</Link>
          <Link href="mailto:contact@deepview.ai" prefetch={false} className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="ml-2">
          <Button asChild size="sm">
            <Link href="#analyze" prefetch={false}>Analyze URL</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
