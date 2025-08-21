
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

function OrderCompleteContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
            <Card className="w-full max-w-lg text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <CardTitle className="mt-4 text-3xl">ご注文ありがとうございました！</CardTitle>
                    <CardDescription className="mt-2 text-lg text-muted-foreground">
                        ご注文が正常に完了しました。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {orderId && (
                        <p className="mb-6 text-base">
                            あなたの注文番号は: <span className="font-bold text-primary">{orderId}</span>
                        </p>
                    )}
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                            <Link href="/">お買い物を続ける</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/orders">注文履歴を見る</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderCompletePage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
            <OrderCompleteContent />
        </Suspense>
    )
}
