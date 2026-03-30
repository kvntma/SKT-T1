export function createClient() {
    return {
        from: () => ({
            select: () => ({
                order: () => ({
                    eq: () => ({
                        not: () => ({
                            neq: () => ({
                                limit: () => ({
                                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                                    single: () => Promise.resolve({ data: null, error: null })
                                }),
                            })
                        }),
                    }),
                    single: () => Promise.resolve({ data: null, error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null })
                })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: null, error: null })
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: null, error: null })
                    })
                })
            }),
        }),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        }
    } as any;
}
