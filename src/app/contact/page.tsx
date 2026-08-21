'use client';

// Rendered directly (no next/dynamic wrapper): the app is already
// client-only via the root layout, so a dynamic boundary here only added
// a chunk waterfall and defeated <Link> prefetching.
import ContactPage from '@/features/contact/components/ContactPage';

export default ContactPage;
