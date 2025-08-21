
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import type { Post } from '@/lib/types';
import { PostForm } from '@/components/post-form';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function BoardPage() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold">お知らせ</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          運営からのお知らせや更新情報をご確認いただけます。
        </p>
      </div>

      {userProfile?.role === '管理者' && (
        <div className="my-8">
          <Separator />
          <PostForm />
          <Separator />
        </div>
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          </>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            まだお知らせはありません。
          </p>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <p>
                  投稿者: {post.authorName} -{' '}
                  {new Date(post.createdAt?.toDate()).toLocaleString()}
                </p>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
