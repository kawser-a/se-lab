'use client';

import { usePathname } from 'next/navigation';
import NewsletterSection from '../NewsLetter';

export default function ConditionalNewsletter() {
    const pathname = usePathname();
    return pathname === '/' ? <NewsletterSection /> : null;
}
