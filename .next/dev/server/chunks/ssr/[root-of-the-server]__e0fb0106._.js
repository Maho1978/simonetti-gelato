module.exports = [
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [ssr] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/user.js [ssr] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/log-out.js [ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/settings.js [ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/heart.js [ssr] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/supabase.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/router.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
function Navbar({ session, cartCount, onCartClick }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleSignOut = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        router.push('/');
    };
    const isAdmin = session?.user?.email === ("TURBOPACK compile-time value", "info@eiscafe-simonetti.de") || session?.user?.user_metadata?.role === 'admin';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
        className: "bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-6 lg:px-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center h-20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "flex items-center space-x-4 group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "text-3xl transition-transform group-hover:scale-105",
                                children: "🍦"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-display font-bold tracking-tight",
                                        style: {
                                            color: '#1a1a1a'
                                        },
                                        children: "Simonetti"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 33,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-xs font-medium tracking-[0.2em] text-gray-500 uppercase",
                                        children: "Gelateria"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 36,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                        lineNumber: 30,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "hidden md:flex items-center space-x-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    window.location.href = '/#speisekarte';
                                    setTimeout(()=>{
                                        document.getElementById('speisekarte')?.scrollIntoView({
                                            behavior: 'smooth'
                                        });
                                    }, 100);
                                },
                                className: "text-sm font-medium text-gray-700 hover:text-black transition",
                                children: "Speisekarte"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 44,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/ueber-uns",
                                className: "text-sm font-medium text-gray-700 hover:text-black transition",
                                children: "Über uns"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 55,
                                columnNumber: 13
                            }, this),
                            session && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/favorites",
                                className: "flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 60,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        children: "Favoriten"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 61,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 59,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                        lineNumber: 43,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: onCartClick,
                                className: "relative flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium tracking-wide uppercase transition hover:bg-gray-900",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "hidden sm:inline",
                                        children: "Warenkorb"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 75,
                                        columnNumber: 15
                                    }, this),
                                    cartCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#c9a66b] text-black text-xs font-bold rounded-full flex items-center justify-center",
                                        children: cartCount
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 77,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 70,
                                columnNumber: 13
                            }, this),
                            session ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/admin",
                                        className: "text-gray-700 hover:text-black transition",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                            lineNumber: 88,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 87,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/account",
                                        className: "text-gray-700 hover:text-black transition",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                            lineNumber: 92,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 91,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: handleSignOut,
                                        className: "text-gray-400 hover:text-gray-700 transition",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                            lineNumber: 95,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 94,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 85,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/auth/login",
                                className: "text-sm font-medium text-gray-700 hover:text-black transition",
                                children: "Anmelden"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 99,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                lineNumber: 27,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/OneDrive/Desktop/simonetti-hybrid/lib/langenfeld-streets.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Langenfeld Straßen für Autocomplete
// Quelle: OpenStreetMap Langenfeld (40764)
__turbopack_context__.s([
    "LANGENFELD_STREETS",
    ()=>LANGENFELD_STREETS,
    "VALID_ZIPCODES",
    ()=>VALID_ZIPCODES,
    "isValidLangenfeldAddress",
    ()=>isValidLangenfeldAddress,
    "searchStreets",
    ()=>searchStreets
]);
const LANGENFELD_STREETS = [
    // Zentrum
    {
        name: "Hauptstraße",
        zip: "40764"
    },
    {
        name: "Bahnstraße",
        zip: "40764"
    },
    {
        name: "Solinger Straße",
        zip: "40764"
    },
    {
        name: "Düsseldorfer Straße",
        zip: "40764"
    },
    {
        name: "Marktplatz",
        zip: "40764"
    },
    {
        name: "Kirchstraße",
        zip: "40764"
    },
    {
        name: "Kaiserstraße",
        zip: "40764"
    },
    {
        name: "Friedrich-Ebert-Platz",
        zip: "40764"
    },
    {
        name: "Konrad-Adenauer-Platz",
        zip: "40764"
    },
    {
        name: "Rathaus Galerie",
        zip: "40764"
    },
    // Wiescheid
    {
        name: "Immigrather Straße",
        zip: "40764",
        district: "Wiescheid"
    },
    {
        name: "Winkelsweg",
        zip: "40764",
        district: "Wiescheid"
    },
    {
        name: "Hardt",
        zip: "40764",
        district: "Wiescheid"
    },
    {
        name: "Langforter Straße",
        zip: "40764",
        district: "Wiescheid"
    },
    {
        name: "Am Wald",
        zip: "40764",
        district: "Wiescheid"
    },
    // Reusrath
    {
        name: "Opladener Straße",
        zip: "40764",
        district: "Reusrath"
    },
    {
        name: "Richrather Straße",
        zip: "40764",
        district: "Reusrath"
    },
    {
        name: "Reusrather Straße",
        zip: "40764",
        district: "Reusrath"
    },
    {
        name: "Beethovenstraße",
        zip: "40764",
        district: "Reusrath"
    },
    {
        name: "Mozartstraße",
        zip: "40764",
        district: "Reusrath"
    },
    // Berghausen
    {
        name: "Berghausener Straße",
        zip: "40764",
        district: "Berghausen"
    },
    {
        name: "Jahnstraße",
        zip: "40764",
        district: "Berghausen"
    },
    {
        name: "Schulstraße",
        zip: "40764",
        district: "Berghausen"
    },
    {
        name: "Zur Wasserburg",
        zip: "40764",
        district: "Berghausen"
    },
    // Weitere wichtige Straßen
    {
        name: "Elisabethstraße",
        zip: "40764"
    },
    {
        name: "Fahlerweg",
        zip: "40764"
    },
    {
        name: "Schneiderstraße",
        zip: "40764"
    },
    {
        name: "Klotzstraße",
        zip: "40764"
    },
    {
        name: "Rheindorfer Straße",
        zip: "40764"
    },
    {
        name: "Monheimer Straße",
        zip: "40764"
    },
    {
        name: "Kölner Straße",
        zip: "40764"
    },
    {
        name: "Auf dem Sand",
        zip: "40764"
    },
    {
        name: "Ginsterweg",
        zip: "40764"
    },
    {
        name: "Heideweg",
        zip: "40764"
    },
    {
        name: "Tannenweg",
        zip: "40764"
    },
    {
        name: "Birkenweg",
        zip: "40764"
    },
    {
        name: "Eschenweg",
        zip: "40764"
    },
    {
        name: "Ahornweg",
        zip: "40764"
    },
    {
        name: "Eichenweg",
        zip: "40764"
    },
    {
        name: "Rosenweg",
        zip: "40764"
    },
    {
        name: "Tulpenweg",
        zip: "40764"
    },
    {
        name: "Nelkenweg",
        zip: "40764"
    },
    {
        name: "Veilchenweg",
        zip: "40764"
    },
    {
        name: "Am Markt",
        zip: "40764"
    },
    {
        name: "Am Stadtpark",
        zip: "40764"
    },
    {
        name: "Parkstraße",
        zip: "40764"
    },
    {
        name: "Gartenstraße",
        zip: "40764"
    },
    {
        name: "Feldstraße",
        zip: "40764"
    },
    {
        name: "Waldstraße",
        zip: "40764"
    },
    {
        name: "Bergstraße",
        zip: "40764"
    },
    {
        name: "Talstraße",
        zip: "40764"
    },
    {
        name: "Ringstraße",
        zip: "40764"
    },
    {
        name: "Mittelstraße",
        zip: "40764"
    },
    {
        name: "Querstraße",
        zip: "40764"
    },
    {
        name: "Kurze Straße",
        zip: "40764"
    },
    {
        name: "Lange Straße",
        zip: "40764"
    },
    {
        name: "Neue Straße",
        zip: "40764"
    },
    {
        name: "Alte Straße",
        zip: "40764"
    },
    {
        name: "Lindenstraße",
        zip: "40764"
    },
    {
        name: "Buchenstraße",
        zip: "40764"
    },
    {
        name: "Kastanienallee",
        zip: "40764"
    },
    {
        name: "Eichendorffstraße",
        zip: "40764"
    },
    {
        name: "Schillerstraße",
        zip: "40764"
    },
    {
        name: "Goethestraße",
        zip: "40764"
    },
    {
        name: "Lessingstraße",
        zip: "40764"
    },
    {
        name: "Heinestraße",
        zip: "40764"
    },
    {
        name: "Breite Straße",
        zip: "40764"
    },
    {
        name: "Schmale Straße",
        zip: "40764"
    },
    {
        name: "Hohe Straße",
        zip: "40764"
    },
    {
        name: "Niedere Straße",
        zip: "40764"
    },
    {
        name: "Oberstraße",
        zip: "40764"
    },
    {
        name: "Unterstraße",
        zip: "40764"
    },
    {
        name: "Vorderstraße",
        zip: "40764"
    },
    {
        name: "Hinterstraße",
        zip: "40764"
    },
    {
        name: "Seitenstraße",
        zip: "40764"
    },
    {
        name: "Eckstraße",
        zip: "40764"
    },
    {
        name: "Winkelstraße",
        zip: "40764"
    },
    {
        name: "Kronenstraße",
        zip: "40764"
    },
    {
        name: "Schloßstraße",
        zip: "40764"
    },
    {
        name: "Burgstraße",
        zip: "40764"
    },
    {
        name: "Turmstraße",
        zip: "40764"
    },
    {
        name: "Torstraße",
        zip: "40764"
    },
    {
        name: "Mühlenstraße",
        zip: "40764"
    },
    {
        name: "Brückenstraße",
        zip: "40764"
    },
    {
        name: "Uferstraße",
        zip: "40764"
    },
    {
        name: "Dammstraße",
        zip: "40764"
    },
    {
        name: "Grabenstraße",
        zip: "40764"
    },
    {
        name: "Wiesenstraße",
        zip: "40764"
    },
    {
        name: "Heidestraße",
        zip: "40764"
    },
    {
        name: "Moorstraße",
        zip: "40764"
    },
    {
        name: "Sandstraße",
        zip: "40764"
    },
    {
        name: "Steinstraße",
        zip: "40764"
    },
    {
        name: "Lehmstraße",
        zip: "40764"
    },
    {
        name: "Tonstraße",
        zip: "40764"
    },
    {
        name: "Ziegelstraße",
        zip: "40764"
    },
    {
        name: "Kalkstraße",
        zip: "40764"
    },
    {
        name: "Kreidestraße",
        zip: "40764"
    },
    {
        name: "Mergelstraße",
        zip: "40764"
    },
    {
        name: "Schieferstraße",
        zip: "40764"
    },
    {
        name: "Granitstraße",
        zip: "40764"
    },
    {
        name: "Marmorstraße",
        zip: "40764"
    },
    {
        name: "Quarzstraße",
        zip: "40764"
    },
    {
        name: "Bernsteinstraße",
        zip: "40764"
    }
];
const VALID_ZIPCODES = [
    "40764"
];
function isValidLangenfeldAddress(street, zip) {
    if (!VALID_ZIPCODES.includes(zip)) {
        return false;
    }
    // Case-insensitive search
    const streetLower = street.toLowerCase().trim();
    return LANGENFELD_STREETS.some((s)=>s.name.toLowerCase().includes(streetLower) || streetLower.includes(s.name.toLowerCase()));
}
function searchStreets(query) {
    if (!query || query.length < 2) return [];
    const queryLower = query.toLowerCase();
    return LANGENFELD_STREETS.filter((street)=>street.name.toLowerCase().includes(queryLower)).slice(0, 10) // Max 10 Vorschläge
    ;
}
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Checkout
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/supabase.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$stripe$2d$js$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$29$__ = __turbopack_context__.i("[externals]/@stripe/stripe-js [external] (@stripe/stripe-js, cjs, [project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/stripe-js)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__ = __turbopack_context__.i("[externals]/@stripe/react-stripe-js [external] (@stripe/react-stripe-js, esm_import, [project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/react-stripe-js)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/langenfeld-streets.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/clock.js [ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/map-pin.js [ssr] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/credit-card.js [ssr] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/circle-alert.js [ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/chevron-left.js [ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/shield-check.js [ssr] (ecmascript) <export default as ShieldCheck>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
const stripePromise = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$stripe$2d$js$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$29$__["loadStripe"])(("TURBOPACK compile-time value", "pk_test_51T0ricIKYKwGm2BoGP9JNtIEcSQukwi6qOseFBIBRB5OorzPCf4Hps0cDNHxiCy8X68Zfdgfk9S04islduWcoHCh009OX5yVUl"));
function Checkout({ session }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { guest } = router.query;
    const isGuest = guest === 'true';
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [tip, setTip] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const [clientSecret, setClientSecret] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [paymentMethod, setPaymentMethod] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('stripe');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    // Dynamische Shop-Einstellungen
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        delivery_fee: 3.0,
        min_order_value: 15.0
    });
    // ✅ NEU: Feature Toggles laden
    const [enabledPaymentMethods, setEnabledPaymentMethods] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const fetchSettings = async ()=>{
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["supabase"].from('shop_settings').select('*').eq('id', 'main').single();
            if (data) setSettings({
                delivery_fee: data.delivery_fee,
                min_order_value: data.min_order_value
            });
        };
        // ✅ NEU: Feature Toggles laden
        const fetchFeatureToggles = async ()=>{
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["supabase"].from('feature_toggles').select('id, enabled').in('id', [
                'card',
                'sepa',
                'giropay',
                'sofort',
                'paypal'
            ]);
            if (data) {
                const methods = [];
                // Stripe Payment Methods
                data.forEach((feature)=>{
                    if (feature.enabled) {
                        if (feature.id === 'card') methods.push('card');
                        if (feature.id === 'sepa') methods.push('sepa_debit');
                        if (feature.id === 'giropay') methods.push('giropay');
                        if (feature.id === 'sofort') methods.push('sofort');
                    }
                });
                setEnabledPaymentMethods(methods);
                // PayPal separat prüfen
                const paypalEnabled = data.find((f)=>f.id === 'paypal')?.enabled;
                if (!paypalEnabled && paymentMethod === 'paypal') {
                    setPaymentMethod('stripe'); // Fallback auf Stripe wenn PayPal deaktiviert
                }
            }
        };
        fetchSettings();
        fetchFeatureToggles();
        const savedCart = localStorage.getItem('simonetti-cart') || localStorage.getItem('cart');
        const savedTip = localStorage.getItem('orderTip');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
            const tipVal = parseFloat(savedTip || '0');
            setTip(tipVal);
            const subtotal = parsedCart.reduce((sum, item)=>sum + item.price * item.quantity, 0);
            if (subtotal < settings.min_order_value) {
            // Optional: Warnung oder Redirect
            }
        } else {
            router.push('/');
        }
    }, []);
    // ✅ NEU: Payment Intent erst erstellen wenn Payment Methods geladen sind
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (cart.length > 0 && enabledPaymentMethods.length > 0) {
            createPaymentIntent(cart, tip);
        }
    }, [
        cart,
        enabledPaymentMethods
    ]);
    const createPaymentIntent = async (cartItems, tipAmount)=>{
        const subtotal = cartItems.reduce((sum, item)=>sum + item.price * item.quantity, 0);
        const total = subtotal + settings.delivery_fee + tipAmount;
        try {
            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: total,
                    // ✅ FIXED: Dynamische Payment Methods aus Feature Toggles
                    payment_method_types: enabledPaymentMethods.length > 0 ? enabledPaymentMethods : [
                        'card'
                    ],
                    metadata: {
                        items: JSON.stringify(cartItems.map((i)=>({
                                name: i.name,
                                qty: i.quantity
                            }))),
                        tip: tipAmount.toFixed(2)
                    }
                })
            });
            const data = await response.json();
            setClientSecret(data.clientSecret);
        } catch (error) {
            console.error('Error creating payment intent:', error);
        }
    };
    const subtotal = cart.reduce((sum, item)=>sum + (item.totalPrice || item.price * item.quantity), 0);
    const grandTotal = subtotal + settings.delivery_fee + tip;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            backgroundColor: '#fdfcfb'
        },
        className: "jsx-563de27e0338a6bd" + " " + "min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                session: session,
                cartCount: 0,
                onCartClick: ()=>{}
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "jsx-563de27e0338a6bd" + " " + "max-w-6xl mx-auto px-6 py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.back(),
                        className: "jsx-563de27e0338a6bd" + " " + "flex items-center gap-2 text-[#8da399] font-bold text-sm mb-6 hover:text-[#4a5d54] transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this),
                            " ZURÜCK ZUM WARENKORB"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        style: {
                            color: '#4a5d54'
                        },
                        className: "jsx-563de27e0338a6bd" + " " + "text-5xl font-display font-bold italic mb-10",
                        children: "Kasse"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-563de27e0338a6bd" + " " + "grid lg:grid-cols-5 gap-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-563de27e0338a6bd" + " " + "lg:col-span-3 space-y-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-563de27e0338a6bd" + " " + "bg-white rounded-3xl p-8 shadow-sm border border-gray-100",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                                style: {
                                                    color: '#4a5d54'
                                                },
                                                className: "jsx-563de27e0338a6bd" + " " + "text-2xl font-display font-bold italic mb-6 flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"], {}, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 17
                                                    }, this),
                                                    " Zahlungsmethode"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 148,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-563de27e0338a6bd" + " " + "grid grid-cols-2 gap-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setPaymentMethod('stripe'),
                                                        className: "jsx-563de27e0338a6bd" + " " + `p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'stripe' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    color: '#4a5d54'
                                                                },
                                                                className: "jsx-563de27e0338a6bd" + " " + "font-bold text-lg",
                                                                children: "Karte / SEPA"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 161,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "jsx-563de27e0338a6bd" + " " + "text-xs text-gray-400 mt-1 font-medium",
                                                                children: enabledPaymentMethods.map((m)=>{
                                                                    if (m === 'card') return 'Kreditkarte';
                                                                    if (m === 'sepa_debit') return 'SEPA';
                                                                    if (m === 'giropay') return 'giropay';
                                                                    if (m === 'sofort') return 'Sofort';
                                                                    return m;
                                                                }).join(', ')
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 162,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 153,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setPaymentMethod('paypal'),
                                                        className: "jsx-563de27e0338a6bd" + " " + `p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'paypal' ? 'border-[#4a5d54] bg-[#f9f8f4]' : 'border-gray-100 hover:border-gray-200'}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    color: '#4a5d54'
                                                                },
                                                                className: "jsx-563de27e0338a6bd" + " " + "font-bold text-lg",
                                                                children: "PayPal"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 182,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "jsx-563de27e0338a6bd" + " " + "text-xs text-gray-400 mt-1 font-medium",
                                                                children: "Schnell & sicher bezahlen"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 183,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 174,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 152,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 147,
                                        columnNumber: 13
                                    }, this),
                                    paymentMethod === 'stripe' && clientSecret && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__["Elements"], {
                                        stripe: stripePromise,
                                        options: {
                                            clientSecret,
                                            appearance: {
                                                theme: 'flat',
                                                variables: {
                                                    colorPrimary: '#4a5d54',
                                                    borderRadius: '12px',
                                                    fontFamily: 'system-ui, sans-serif',
                                                    fontSizeBase: '16px',
                                                    spacingUnit: '4px'
                                                },
                                                rules: {
                                                    '.Input': {
                                                        border: '2px solid #f3f4f6',
                                                        padding: '14px 18px',
                                                        fontSize: '0.95rem',
                                                        fontWeight: '600'
                                                    },
                                                    '.Input:focus': {
                                                        borderColor: '#4a5d54',
                                                        boxShadow: '0 0 0 4px rgba(74, 93, 84, 0.05)'
                                                    },
                                                    '.Tab': {
                                                        border: '2px solid #f3f4f6',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600'
                                                    },
                                                    '.Tab:hover': {
                                                        borderColor: '#e5e7eb'
                                                    },
                                                    '.Tab--selected': {
                                                        borderColor: '#4a5d54',
                                                        backgroundColor: '#f9f8f4'
                                                    }
                                                }
                                            }
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(StripeCheckoutForm, {
                                            session: session,
                                            isGuest: isGuest,
                                            cart: cart,
                                            total: grandTotal,
                                            subtotal: subtotal,
                                            deliveryFee: settings.delivery_fee,
                                            tip: tip
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 231,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 189,
                                        columnNumber: 15
                                    }, this),
                                    paymentMethod === 'paypal' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-563de27e0338a6bd" + " " + "bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center py-16",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-563de27e0338a6bd" + " " + "text-4xl mb-4",
                                                children: "⏳"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 245,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "jsx-563de27e0338a6bd" + " " + "font-bold text-xl mb-2",
                                                children: "PayPal folgt in Kürze"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 246,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-563de27e0338a6bd" + " " + "text-gray-400 max-w-xs mx-auto",
                                                children: "Wir arbeiten an der PayPal-Integration. Bitte nutze vorerst die Kartenzahlung."
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 247,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 244,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 146,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-563de27e0338a6bd" + " " + "lg:col-span-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "jsx-563de27e0338a6bd" + " " + "bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-28",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                            style: {
                                                color: '#4a5d54'
                                            },
                                            className: "jsx-563de27e0338a6bd" + " " + "text-2xl font-display font-bold italic mb-6",
                                            children: "Übersicht"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 255,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "jsx-563de27e0338a6bd" + " " + "space-y-4 mb-8",
                                            children: cart.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "border-b border-gray-100 pb-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "jsx-563de27e0338a6bd" + " " + "flex justify-between items-start mb-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-563de27e0338a6bd" + " " + "text-sm",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                            className: "jsx-563de27e0338a6bd" + " " + "font-bold text-[#4a5d54]",
                                                                            children: [
                                                                                item.quantity,
                                                                                "x"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                            lineNumber: 262,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        " ",
                                                                        item.name
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                    lineNumber: 261,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-563de27e0338a6bd" + " " + "font-bold text-sm",
                                                                    children: [
                                                                        (item.totalPrice || item.price * item.quantity).toFixed(2),
                                                                        " €"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                    lineNumber: 264,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 260,
                                                            columnNumber: 21
                                                        }, this),
                                                        item.selectedFlavors && item.selectedFlavors.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "jsx-563de27e0338a6bd" + " " + "text-xs text-gray-600 ml-4 mt-1",
                                                            children: [
                                                                "🍦 ",
                                                                item.selectedFlavors.join(', ')
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 23
                                                        }, this),
                                                        item.selectedExtras && item.selectedExtras.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "jsx-563de27e0338a6bd" + " " + "text-xs text-gray-600 ml-4 mt-1",
                                                            children: [
                                                                "➕ ",
                                                                item.selectedExtras.map((e)=>e.name).join(', ')
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 274,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, item.cartId || item.id, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 259,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 257,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "jsx-563de27e0338a6bd" + " " + "space-y-3 pt-6 border-t border-gray-50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "flex justify-between text-gray-400 text-sm font-medium",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: "Zwischensumme"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 284,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: [
                                                                subtotal.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 283,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "flex justify-between text-gray-400 text-sm font-medium",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: "Liefergebühr"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 288,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: [
                                                                settings.delivery_fee.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 289,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 17
                                                }, this),
                                                tip > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "flex justify-between text-[#8da399] text-sm font-bold",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: "Trinkgeld"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 293,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "jsx-563de27e0338a6bd",
                                                            children: [
                                                                "+",
                                                                tip.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 294,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 292,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "flex justify-between items-end pt-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                color: '#4a5d54'
                                                            },
                                                            className: "jsx-563de27e0338a6bd" + " " + "font-display font-bold text-xl italic",
                                                            children: "Gesamt"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 298,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                color: '#4a5d54'
                                                            },
                                                            className: "jsx-563de27e0338a6bd" + " " + "font-bold text-3xl",
                                                            children: [
                                                                grandTotal.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 299,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 282,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "jsx-563de27e0338a6bd" + " " + "mt-8 p-4 bg-[#f9f8f4] rounded-2xl flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                                    className: "text-[#4a5d54]",
                                                    size: 20
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 304,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "jsx-563de27e0338a6bd" + " " + "text-[10px] font-bold uppercase tracking-wider text-[#8da399]",
                                                    children: "Sichere SSL-Verschlüsselung"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 305,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 303,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                    lineNumber: 254,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 253,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "563de27e0338a6bd",
                children: ".font-display{font-family:Playfair Display,serif}.input-simonetti{background-color:#fff;border:2px solid #f3f4f6;border-radius:16px;width:100%;padding:14px 18px;font-size:.95rem;font-weight:600;transition:all .2s}.input-simonetti:focus{border-color:#4a5d54;outline:none;box-shadow:0 0 0 4px #4a5d540d}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
function StripeCheckoutForm({ session, isGuest, cart, total, subtotal, deliveryFee, tip }) {
    const stripe = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__["useStripe"])();
    const elements = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__["useElements"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        name: '',
        email: session?.user?.email || '',
        phone: '',
        street: '',
        houseNumber: '',
        zip: '40764',
        city: 'Langenfeld',
        deliveryTime: 'asap',
        notes: ''
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [streetSuggestions, setStreetSuggestions] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [addressError, setAddressError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const handleStreetInput = (value)=>{
        setFormData({
            ...formData,
            street: value
        });
        setAddressError('');
        if (value.length >= 2) {
            setStreetSuggestions((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["searchStreets"])(value));
        } else {
            setStreetSuggestions([]);
        }
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!stripe || !elements) return;
        // Validierung
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["isValidLangenfeldAddress"])(formData.street, formData.zip)) {
            setAddressError('Diese Straße liegt leider nicht in unserem Liefergebiet (Langenfeld).');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required'
            });
            if (stripeError) throw new Error(stripeError.message);
            // Erstelle Order in Supabase
            const { data: order, error: orderError } = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["supabase"].from('orders').insert({
                customer_name: formData.name,
                customer_email: isGuest ? formData.email : session?.user?.email,
                customer_phone: formData.phone || '',
                delivery_address: `${formData.street} ${formData.houseNumber}, ${formData.zip} ${formData.city}`,
                notes: formData.notes,
                items: cart.map((item)=>({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        flavors: item.selectedFlavors || [],
                        extras: item.selectedExtras || []
                    })),
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                total: total,
                tip: tip || 0,
                status: 'OFFEN',
                payment_method: 'STRIPE',
                payment_intent_id: paymentIntent?.id,
                user_id: session?.user?.id || null
            }).select().single();
            if (orderError) {
                console.error('Order creation error:', orderError);
                throw new Error('Bestellung konnte nicht erstellt werden');
            }
            // Emails senden (optional - kann fehlschlagen ohne den Flow zu brechen)
            try {
                await fetch('/api/emails/send-order-notification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'order_confirmed',
                        order: {
                            ...order,
                            order_number: order.id
                        },
                        recipientEmail: isGuest ? formData.email : session?.user?.email
                    })
                });
            } catch (emailError) {
                console.log('Email notification failed (non-critical)', emailError);
            }
            localStorage.removeItem('simonetti-cart');
            localStorage.removeItem('cart');
            localStorage.removeItem('orderTip');
            router.push(`/order-success?order_id=${order.id}`);
        } catch (error) {
            console.error('Checkout error:', error);
            setError(error.message || 'Zahlung fehlgeschlagen');
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "space-y-8 animate-fade-in",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-3xl p-8 shadow-sm border border-gray-100",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-display font-bold italic mb-6 flex items-center gap-3",
                        style: {
                            color: '#4a5d54'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {}, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 452,
                                columnNumber: 11
                            }, this),
                            " Lieferadresse"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 451,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "grid md:grid-cols-2 gap-4 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "Vollständiger Name"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 457,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        required: true,
                                        className: "input-simonetti",
                                        value: formData.name,
                                        onChange: (e)=>setFormData({
                                                ...formData,
                                                name: e.target.value
                                            }),
                                        placeholder: "Max Mustermann"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 458,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 456,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "Telefonnummer"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 461,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "tel",
                                        required: true,
                                        className: "input-simonetti",
                                        value: formData.phone,
                                        onChange: (e)=>setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            }),
                                        placeholder: "0173 1234567"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 462,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 460,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 455,
                        columnNumber: 9
                    }, this),
                    isGuest && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                children: "E-Mail für Bestätigung"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 468,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                type: "email",
                                required: true,
                                className: "input-simonetti",
                                value: formData.email,
                                onChange: (e)=>setFormData({
                                        ...formData,
                                        email: e.target.value
                                    }),
                                placeholder: "max@beispiel.de"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 469,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 467,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-4 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "col-span-2 relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "Straße"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 475,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        required: true,
                                        className: "input-simonetti",
                                        value: formData.street,
                                        onChange: (e)=>handleStreetInput(e.target.value),
                                        placeholder: "Straße"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 476,
                                        columnNumber: 13
                                    }, this),
                                    streetSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "absolute z-20 w-full bg-white border-2 border-gray-100 rounded-2xl mt-1 shadow-xl overflow-hidden",
                                        children: streetSuggestions.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    setFormData({
                                                        ...formData,
                                                        street: s.name
                                                    });
                                                    setStreetSuggestions([]);
                                                },
                                                className: "w-full text-left px-4 py-3 hover:bg-[#f9f8f4] text-sm font-semibold transition-colors border-b last:border-0 border-gray-50",
                                                children: [
                                                    s.name,
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-gray-400 ml-2",
                                                        children: s.district
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 481,
                                                        columnNumber: 30
                                                    }, this)
                                                ]
                                            }, i, true, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 480,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 478,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 474,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "Nr."
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 488,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        required: true,
                                        className: "input-simonetti",
                                        value: formData.houseNumber,
                                        onChange: (e)=>setFormData({
                                                ...formData,
                                                houseNumber: e.target.value
                                            }),
                                        placeholder: "1a"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 489,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 487,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 473,
                        columnNumber: 9
                    }, this),
                    addressError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-red-500 text-xs font-bold mb-4 bg-red-50 p-3 rounded-xl border border-red-100",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 495,
                                columnNumber: 13
                            }, this),
                            " ",
                            addressError
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 494,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "PLZ"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 501,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        disabled: true,
                                        className: "input-simonetti bg-gray-50 text-gray-400",
                                        value: formData.zip
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 502,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 500,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-[#8da399] uppercase tracking-widest mb-1.5 ml-1",
                                        children: "Stadt"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 505,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        disabled: true,
                                        className: "input-simonetti bg-gray-50 text-gray-400",
                                        value: formData.city
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 506,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 504,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 499,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 450,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-3xl p-8 shadow-sm border border-gray-100",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-display font-bold italic mb-6 flex items-center gap-3",
                        style: {
                            color: '#4a5d54'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {}, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 513,
                                columnNumber: 11
                            }, this),
                            " Lieferzeit & Details"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 512,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                className: "input-simonetti appearance-none",
                                value: formData.deliveryTime,
                                onChange: (e)=>setFormData({
                                        ...formData,
                                        deliveryTime: e.target.value
                                    }),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: "asap",
                                        children: "So schnell wie möglich (ca. 30-45 Min)"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 517,
                                        columnNumber: 13
                                    }, this),
                                    generateTimeSlots().map((slot)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                            value: slot.value,
                                            children: slot.label
                                        }, slot.value, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 519,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 516,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                className: "input-simonetti",
                                rows: 3,
                                placeholder: "Anmerkungen zur Lieferung (z.B. 2. Etage, Klingel Name...)",
                                value: formData.notes,
                                onChange: (e)=>setFormData({
                                        ...formData,
                                        notes: e.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 522,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 515,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 511,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-3xl p-8 shadow-sm border border-gray-100",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-display font-bold italic mb-6",
                        style: {
                            color: '#4a5d54'
                        },
                        children: "Zahlungsinformationen"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 527,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "stripe-payment-element",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$stripe$2f$react$2d$stripe$2d$js__$5b$external$5d$__$2840$stripe$2f$react$2d$stripe$2d$js$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$29$__["PaymentElement"], {}, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 530,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 529,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 532,
                        columnNumber: 19
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 526,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: loading || !stripe,
                className: "w-full py-6 rounded-3xl font-bold text-white text-xl shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none",
                style: {
                    backgroundColor: '#4a5d54'
                },
                children: loading ? 'Wird verarbeitet...' : `Jetzt kostenpflichtig bestellen (${total.toFixed(2)} €)`
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 535,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
        lineNumber: 449,
        columnNumber: 5
    }, this);
}
function generateTimeSlots() {
    const slots = [];
    const now = new Date();
    let hour = now.getHours();
    let min = now.getMinutes() > 30 ? 0 : 30;
    if (min === 0) hour++;
    for(let h = Math.max(hour, 14); h <= 21; h++){
        for (let m of [
            0,
            30
        ]){
            if (h === hour && m < now.getMinutes() + 20) continue;
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            slots.push({
                value: time,
                label: `Heute um ${time} Uhr`
            });
        }
    }
    return slots.slice(0, 8);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e0fb0106._.js.map