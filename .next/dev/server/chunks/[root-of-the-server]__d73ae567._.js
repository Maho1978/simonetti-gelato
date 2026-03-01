module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/lib/stripe.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "stripe",
    ()=>stripe,
    "stripePromise",
    ()=>stripePromise
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$stripe$2d$js$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$29$__ = __turbopack_context__.i("[externals]/@stripe/stripe-js [external] (@stripe/stripe-js, cjs, [project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/stripe-js)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$stripe__$5b$external$5d$__$28$stripe$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$stripe$29$__ = __turbopack_context__.i("[externals]/stripe [external] (stripe, esm_import, [project]/OneDrive/Desktop/simonetti-hybrid/node_modules/stripe)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$stripe__$5b$external$5d$__$28$stripe$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$stripe$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$stripe__$5b$external$5d$__$28$stripe$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$stripe$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const stripePromise = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$stripe$2d$js$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$29$__["loadStripe"])(("TURBOPACK compile-time value", "pk_test_51T0ricIKYKwGm2BoGP9JNtIEcSQukwi6qOseFBIBRB5OorzPCf4Hps0cDNHxiCy8X68Zfdgfk9S04islduWcoHCh009OX5yVUl"));
const stripe = new __TURBOPACK__imported__module__$5b$externals$5d2f$stripe__$5b$external$5d$__$28$stripe$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$stripe$29$__["default"](process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/OneDrive/Desktop/simonetti-hybrid/pages/api/stripe/create-payment-intent.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$stripe$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/stripe.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$stripe$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$stripe$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }
    try {
        const { amount, metadata, payment_method_types } = req.body;
        // ✅ DEBUG LOGGING
        console.log('🔍 Payment Intent Request:', {
            amount,
            payment_method_types,
            hasStripe: !!__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$stripe$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["stripe"],
            stripeKey: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING'
        });
        // Validierung
        if (!amount || amount < 0.5) {
            throw new Error('Invalid amount: ' + amount);
        }
        if (!payment_method_types || payment_method_types.length === 0) {
            throw new Error('No payment methods provided');
        }
        // Create payment intent
        const paymentIntent = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$stripe$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["stripe"].paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'eur',
            payment_method_types: payment_method_types,
            metadata: metadata || {}
        });
        console.log('✅ PaymentIntent created:', paymentIntent.id);
        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        // ✅ BESSERES ERROR LOGGING
        console.error('❌ Payment Intent Error:', {
            message: error.message,
            type: error.type,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({
            error: error.message || 'Failed to create payment intent',
            details: error.type || 'unknown_error'
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d73ae567._.js.map