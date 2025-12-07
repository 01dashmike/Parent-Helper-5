import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerComponentClient } from '@/lib/supabase';
import { getActiveMembershipForUser } from '../_lib/membership';
import { isProviderReferralsEnabled } from '@/lib/env';
import ReferralsClient from './ReferralsClient';

export const metadata: Metadata = {
    title: 'Referrals | Provider Console',
};

export default async function ReferralsPage() {
    if (!isProviderReferralsEnabled()) {
        redirect('/provider');
    }

    const supabase = createSupabaseServerComponentClient();
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session ?? null;

    if (!session?.user) {
        redirect('/provider/login');
    }

    const membershipRow = await getActiveMembershipForUser(supabase, session.user.id);

    if (!membershipRow || !membershipRow.providers) {
        redirect('/provider');
    }

    return (
        <ReferralsClient providerId={membershipRow.providers.id} />
    );
}

