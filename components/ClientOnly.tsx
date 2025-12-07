"use client";

import { ReactNode, useState, useEffect } from "react";

type ClientOnlyProps = {
    children: ReactNode;
    fallback?: ReactNode;
};

export default function ClientOnly({ fallback = null, children }: ClientOnlyProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // Reason: effect should only run once on mount
    }, []);

    if (!mounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

