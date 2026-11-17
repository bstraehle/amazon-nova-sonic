import Link from 'next/link';
import { Mic } from 'lucide-react';
import BrandMark from '@/components/brand-mark';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function SignInPage() {
  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground py-8 px-6 shadow rounded-xl sm:px-10 border">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="size-14 rounded-2xl mb-4" />
            <h1 className="text-2xl font-semibold">DemoBank</h1>
            <p className="mt-1 text-sm font-medium text-primary">Voice Assistant (STS)</p>
            <p className="mt-4 mb-6 text-sm text-muted-foreground">
              Your AI-powered banking assistant for DemoBank high yield savings accounts. Ask a question out loud and
              get a spoken answer.
            </p>

            <Link
              href={`/api/auth/sign-in`}
              className={cn(buttonVariants({ size: 'lg' }), 'w-full h-12')}
              prefetch={false} // prevent CORS error
            >
              Sign in
            </Link>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mic className="size-3.5 shrink-0" />
              You&apos;ll need a microphone.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
