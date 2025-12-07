module.exports = {
    meta: {
        type: "problem",
        messages: {
            noSSR: "Do not disable SSR via next/dynamic inside Server Components. Wrap the import in a Client Component instead.",
        },
    },
    create(ctx) {
        return {
            CallExpression(node) {
                try {
                    const { callee, arguments: args } = node;
                    if (
                        callee?.type === "Identifier" &&
                        callee.name === "dynamic" &&
                        args?.[1]?.type === "ObjectExpression"
                    ) {
                        const ssrProp = args[1].properties.find((p) => p.key?.name === "ssr");
                        if (
                            ssrProp &&
                            ssrProp.value?.type === "Literal" &&
                            ssrProp.value.value === false
                        ) {
                            // crude heuristic: if file is in app/ and has no "use client", treat as server.
                            const src = ctx.getSourceCode().getText();
                            const isClient = /^\s*["']use client["']/.test(src);
                            const isAppFile = ctx.getFilename().includes("/app/");
                            if (isAppFile && !isClient) {
                                ctx.report({ node, messageId: "noSSR" });
                            }
                        }
                    }
                } catch {
                    // ignore parsing errors
                }
            },
        };
    },
};

