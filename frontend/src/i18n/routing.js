import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
    locales: ['my', 'en'],
    defaultLocale: 'my',
});

// This helps you use <Link />, useRouter(), etc. later
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);