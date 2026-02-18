(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/lib/supabase.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase,
    "supabaseAdmin",
    ()=>supabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@supabase/supabase-js/dist/index.mjs [client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://flydacnsbsnpwpqezuof.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseWRhY25zYnNucHdwcWV6dW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTcxNzQsImV4cCI6MjA4NjU5MzE3NH0.OgOwNZiiT0IUX_mlNaAVCNnhk1_9k4gNVBHLefsuDMs");
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/log-out.js [client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/settings.js [client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/supabase.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function Navbar({ session, cartCount, onCartClick }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleSignOut = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        router.push('/');
    };
    const isAdmin = session?.user?.email === ("TURBOPACK compile-time value", "info@eiscafe-langenfeld.de") || session?.user?.user_metadata?.role === 'admin';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        style: {
            backgroundColor: '#fdfcfb',
            borderBottom: '1px solid #eee'
        },
        className: "sticky top-0 z-50 animate-slide-down",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-6 lg:px-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center h-20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "flex items-center space-x-3 group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-4xl group-hover:scale-110 transition-transform duration-300",
                                children: "🍦"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-display font-bold italic",
                                        style: {
                                            color: '#4a5d54'
                                        },
                                        children: [
                                            "Simonetti",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: '#8da399'
                                                },
                                                children: "."
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                                lineNumber: 35,
                                                columnNumber: 26
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 34,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs font-semibold tracking-widest",
                                        style: {
                                            color: '#8da399'
                                        },
                                        children: "GELATERIA"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 37,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 33,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                        lineNumber: 31,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onCartClick,
                                className: "relative flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                                style: {
                                    backgroundColor: '#4a5d54',
                                    color: '#fdfcfb'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "hidden sm:inline",
                                        children: "Warenkorb"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this),
                                    cartCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        style: {
                                            backgroundColor: '#8da399',
                                            color: '#fdfcfb'
                                        },
                                        children: cartCount
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 53,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 45,
                                columnNumber: 13
                            }, this),
                            session ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                    isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/admin",
                                        className: "flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300",
                                        style: {
                                            color: '#4a5d54'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                                lineNumber: 68,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden md:inline font-semibold text-sm",
                                                children: "Admin"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                                lineNumber: 69,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 64,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/account",
                                        className: "flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300",
                                        style: {
                                            color: '#4a5d54'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                                lineNumber: 76,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden md:inline font-semibold text-sm",
                                                children: "Konto"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                                lineNumber: 77,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 72,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleSignOut,
                                        className: "flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors duration-300",
                                        style: {
                                            color: '#8da399'
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                            lineNumber: 83,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 79,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 62,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/auth/login",
                                className: "flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300",
                                style: {
                                    border: '2px solid #4a5d54',
                                    color: '#4a5d54'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 91,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Anmelden"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                        lineNumber: 92,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                                lineNumber: 87,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
                lineNumber: 28,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
            lineNumber: 27,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(Navbar, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Navbar;
var _c;
__turbopack_context__.k.register(_c, "Navbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/lib/langenfeld-streets.ts [client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Checkout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$2f$lib$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/stripe-js/lib/index.mjs [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/stripe-js/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@stripe/react-stripe-js/dist/react-stripe.esm.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$paypal$2f$react$2d$paypal$2d$js$2f$dist$2f$esm$2f$react$2d$paypal$2d$js$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/@paypal/react-paypal-js/dist/esm/react-paypal-js.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/components/Navbar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/lib/langenfeld-streets.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/clock.js [client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/map-pin.js [client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/credit-card.js [client] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/simonetti-hybrid/node_modules/lucide-react/dist/esm/icons/alert-circle.js [client] (ecmascript) <export default as AlertCircle>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
const stripePromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$stripe$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["loadStripe"])(("TURBOPACK compile-time value", "pk_test_51T0ricIKYKwGm2BoGP9JNtIEcSQukwi6qOseFBIBRB5OorzPCf4Hps0cDNHxiCy8X68Zfdgfk9S04islduWcoHCh009OX5yVUl"));
const DELIVERY_FEE = 3.00;
const MINIMUM_ORDER = 15.00;
function Checkout({ session }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { guest } = router.query;
    const isGuest = guest === 'true';
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [tip, setTip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [clientSecret, setClientSecret] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [paymentMethod, setPaymentMethod] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('stripe');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Checkout.useEffect": ()=>{
            const savedCart = localStorage.getItem('cart');
            const savedTip = localStorage.getItem('orderTip');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setCart(parsedCart);
                setTip(parseFloat(savedTip || '0'));
                const subtotal = parsedCart.reduce({
                    "Checkout.useEffect.subtotal": (sum, item)=>sum + item.price * item.quantity
                }["Checkout.useEffect.subtotal"], 0);
                if (subtotal < MINIMUM_ORDER) {
                    alert('Mindestbestellwert nicht erreicht!');
                    router.push('/');
                    return;
                }
                createPaymentIntent(parsedCart, parseFloat(savedTip || '0'));
            } else {
                router.push('/');
            }
        }
    }["Checkout.useEffect"], []);
    const createPaymentIntent = async (cartItems, tipAmount)=>{
        const subtotal = cartItems.reduce((sum, item)=>sum + item.price * item.quantity, 0);
        const total = subtotal + DELIVERY_FEE + tipAmount;
        try {
            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: total,
                    payment_method_types: [
                        'card',
                        'sepa_debit',
                        'giropay',
                        'sofort'
                    ],
                    metadata: {
                        items: JSON.stringify(cartItems),
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
    const total = cart.reduce((sum, item)=>sum + item.price * item.quantity, 0);
    const grandTotal = total + DELIVERY_FEE + tip;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                session: session,
                cartCount: 0,
                onCartClick: ()=>{}
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto px-4 py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-4xl font-display font-bold mb-8",
                        children: "Kasse"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid lg:grid-cols-5 gap-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "card sticky top-24",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-display font-bold mb-4",
                                            children: "Bestellübersicht"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 98,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3 mb-6",
                                            children: cart.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between py-2 border-b",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                item.quantity,
                                                                "x ",
                                                                item.name
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 105,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-semibold",
                                                            children: [
                                                                (item.price * item.quantity).toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 108,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, item.id, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 104,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 102,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2 text-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Zwischensumme:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 117,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                total.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 118,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 116,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Lieferung:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 121,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                DELIVERY_FEE.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 122,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 120,
                                                    columnNumber: 17
                                                }, this),
                                                tip > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between text-secondary",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Trinkgeld:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 126,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                "+",
                                                                tip.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 127,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 125,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between font-bold text-2xl pt-3 border-t-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Gesamt:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 131,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-primary",
                                                            children: [
                                                                grandTotal.toFixed(2),
                                                                " €"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                            lineNumber: 132,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                    lineNumber: 130,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 115,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "card mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-2xl font-display font-bold mb-4 flex items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"], {
                                                        className: "mr-2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 143,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Zahlungsmethode wählen"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 142,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 gap-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setPaymentMethod('stripe'),
                                                        className: `p-6 rounded-xl border-2 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xl font-bold mb-2",
                                                                children: "Karte / SEPA"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 156,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Kreditkarte, SEPA, giropay, Sofort"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 157,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 148,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setPaymentMethod('paypal'),
                                                        className: `p-6 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xl font-bold mb-2",
                                                                children: "PayPal"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 170,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Schnell & sicher"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 171,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 162,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 147,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 141,
                                        columnNumber: 13
                                    }, this),
                                    paymentMethod === 'stripe' && clientSecret && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Elements"], {
                                        stripe: stripePromise,
                                        options: {
                                            clientSecret
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StripeCheckoutForm, {
                                            session: session,
                                            isGuest: isGuest,
                                            cart: cart,
                                            total: grandTotal,
                                            tip: tip
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 181,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 180,
                                        columnNumber: 15
                                    }, this),
                                    paymentMethod === 'paypal' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$paypal$2f$react$2d$paypal$2d$js$2f$dist$2f$esm$2f$react$2d$paypal$2d$js$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PayPalScriptProvider"], {
                                        options: {
                                            clientId: ("TURBOPACK compile-time value", "") || 'test',
                                            currency: 'EUR'
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PayPalCheckoutForm, {
                                            session: session,
                                            isGuest: isGuest,
                                            cart: cart,
                                            total: grandTotal,
                                            tip: tip
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                            lineNumber: 197,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
_s(Checkout, "p1mF9od8JDFMrxV26+zn5Avv7G0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Checkout;
function StripeCheckoutForm({ session, isGuest, cart, total, tip }) {
    _s1();
    const stripe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["useStripe"])();
    const elements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["useElements"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(session?.user?.email || '');
    const [street, setStreet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [houseNumber, setHouseNumber] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [zip, setZip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('40764');
    const [city, setCity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('Langenfeld');
    const [deliveryTime, setDeliveryTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('asap');
    const [notes, setNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [streetSuggestions, setStreetSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [addressError, setAddressError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const handleStreetInput = (value)=>{
        setStreet(value);
        setAddressError('');
        if (value.length >= 2) {
            const suggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["searchStreets"])(value);
            setStreetSuggestions(suggestions);
        } else {
            setStreetSuggestions([]);
        }
    };
    const selectStreet = (streetName)=>{
        setStreet(streetName);
        setStreetSuggestions([]);
    };
    const validateAddress = ()=>{
        if (zip !== '40764') {
            setAddressError('Lieferung nur nach Langenfeld (PLZ 40764) möglich!');
            return false;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$lib$2f$langenfeld$2d$streets$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["isValidLangenfeldAddress"])(street, zip)) {
            setAddressError('Diese Straße ist nicht in unserem Liefergebiet in Langenfeld.');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!stripe || !elements) return;
        if (!validateAddress()) return;
        setLoading(true);
        setError('');
        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required'
            });
            if (stripeError) {
                throw new Error(stripeError.message);
            }
            // Create order in database
            const orderData = {
                user_id: session?.user?.id || null,
                guest_email: isGuest ? email : null,
                items: cart,
                total,
                tip,
                delivery_address: {
                    name,
                    street: `${street} ${houseNumber}`,
                    zip,
                    city
                },
                delivery_time: deliveryTime,
                notes,
                payment_intent_id: paymentIntent?.id
            };
            await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            localStorage.removeItem('cart');
            localStorage.removeItem('orderTip');
            router.push('/order-success');
        } catch (error) {
            setError(error.message || 'Zahlung fehlgeschlagen');
        } finally{
            setLoading(false);
        }
    };
    const deliveryTimeOptions = [
        {
            value: 'asap',
            label: 'So schnell wie möglich (~30 Min)'
        },
        ...generateTimeSlots()
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "card space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-display font-bold flex items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, this),
                    isGuest ? 'Gast-Checkout' : 'Lieferung'
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 334,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl",
                children: error
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 340,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-blue-50 border-2 border-blue-200 p-4 rounded-xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start space-x-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                            className: "text-blue-600 flex-shrink-0 mt-1",
                            size: 20
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 347,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-blue-900",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Liefergebiet:"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                    lineNumber: 349,
                                    columnNumber: 13
                                }, this),
                                " Wir liefern nur innerhalb von Langenfeld (PLZ 40764)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 348,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                    lineNumber: 346,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 345,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-lg mb-4",
                        children: "Lieferadresse"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 356,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold mb-2",
                                        children: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 360,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: name,
                                        onChange: (e)=>setName(e.target.value),
                                        required: true,
                                        className: "input",
                                        placeholder: "Max Mustermann"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 361,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 359,
                                columnNumber: 11
                            }, this),
                            isGuest && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold mb-2",
                                        children: "E-Mail"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 373,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "email",
                                        value: email,
                                        onChange: (e)=>setEmail(e.target.value),
                                        required: true,
                                        className: "input",
                                        placeholder: "max@beispiel.de"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 374,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 372,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-3 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "col-span-2 relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-semibold mb-2",
                                                children: "Straße"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 387,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: street,
                                                onChange: (e)=>handleStreetInput(e.target.value),
                                                onBlur: ()=>setTimeout(()=>setStreetSuggestions([]), 200),
                                                required: true,
                                                className: `input ${addressError ? 'border-red-500' : ''}`,
                                                placeholder: "Hauptstraße"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 388,
                                                columnNumber: 15
                                            }, this),
                                            streetSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute z-10 w-full bg-white border-2 border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto",
                                                children: streetSuggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>selectStreet(suggestion.name),
                                                        className: "w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-semibold",
                                                                children: suggestion.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 23
                                                            }, this),
                                                            suggestion.district && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-600",
                                                                children: suggestion.district
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                                lineNumber: 409,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, index, true, {
                                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                        lineNumber: 401,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 399,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 386,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-semibold mb-2",
                                                children: "Nr."
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 418,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: houseNumber,
                                                onChange: (e)=>setHouseNumber(e.target.value),
                                                required: true,
                                                className: "input",
                                                placeholder: "42"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 419,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 417,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 385,
                                columnNumber: 11
                            }, this),
                            addressError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                        size: 20,
                                        className: "flex-shrink-0 mt-0.5"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 432,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm",
                                        children: addressError
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 433,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 431,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-semibold mb-2",
                                                children: "PLZ"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 439,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: zip,
                                                onChange: (e)=>{
                                                    setZip(e.target.value);
                                                    setAddressError('');
                                                },
                                                required: true,
                                                className: `input ${zip !== '40764' ? 'border-red-500' : ''}`,
                                                placeholder: "40764"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 440,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 438,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-semibold mb-2",
                                                children: "Stadt"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 454,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: city,
                                                onChange: (e)=>setCity(e.target.value),
                                                required: true,
                                                className: "input",
                                                placeholder: "Langenfeld"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                                lineNumber: 455,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                        lineNumber: 453,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 437,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 358,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 355,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-lg mb-4 flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                className: "mr-2",
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 471,
                                columnNumber: 11
                            }, this),
                            "Lieferzeit"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 470,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: deliveryTime,
                        onChange: (e)=>setDeliveryTime(e.target.value),
                        className: "input",
                        children: deliveryTimeOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: option.value,
                                children: option.label
                            }, option.value, false, {
                                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                                lineNumber: 480,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 474,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 469,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-sm font-semibold mb-2",
                        children: "Anmerkungen (optional)"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 489,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        value: notes,
                        onChange: (e)=>setNotes(e.target.value),
                        className: "input",
                        rows: 3,
                        placeholder: "z.B. Klingel defekt, bitte anrufen"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 492,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 488,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-lg mb-4",
                        children: "Zahlungsinformationen"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 503,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["PaymentElement"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                        lineNumber: 504,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 502,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-gray-50 p-4 rounded-xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between text-2xl font-bold",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Gesamtbetrag:"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 509,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                total.toFixed(2),
                                " €"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 510,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                    lineNumber: 508,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 507,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: !stripe || loading || !!addressError,
                className: `w-full text-lg ${!stripe || loading || addressError ? 'bg-gray-300 text-gray-500 cursor-not-allowed py-4 px-6 rounded-xl' : 'btn-secondary'}`,
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center space-x-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "spinner !w-5 !h-5 !border-2 !border-dark"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 525,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Zahlung wird verarbeitet..."
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                            lineNumber: 526,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                    lineNumber: 524,
                    columnNumber: 11
                }, this) : `Jetzt bezahlen ${total.toFixed(2)} €`
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 514,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
        lineNumber: 333,
        columnNumber: 5
    }, this);
}
_s1(StripeCheckoutForm, "AZ5GQbvGq212TPSRwdVD8ClvoJg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["useStripe"],
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f40$stripe$2f$react$2d$stripe$2d$js$2f$dist$2f$react$2d$stripe$2e$esm$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["useElements"],
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = StripeCheckoutForm;
function PayPalCheckoutForm({ session, isGuest, cart, total, tip }) {
    _s2();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        email: session?.user?.email || '',
        street: '',
        houseNumber: '',
        zip: '40764',
        city: 'Langenfeld',
        deliveryTime: 'asap',
        notes: ''
    });
    // Similar form as Stripe but with PayPal button at the end
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-display font-bold mb-6",
                children: "PayPal Checkout"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 564,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-yellow-900",
                    children: "PayPal-Integration folgt in Kürze. Bitte nutzen Sie vorerst die Kreditkarten-Zahlung."
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                    lineNumber: 569,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
                lineNumber: 568,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx",
        lineNumber: 563,
        columnNumber: 5
    }, this);
}
_s2(PayPalCheckoutForm, "9ZVGSZX0avYNHbHRzoTLCRhfkPw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$simonetti$2d$hybrid$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c2 = PayPalCheckoutForm;
function generateTimeSlots() {
    const slots = [];
    const now = new Date();
    const startHour = now.getHours() + 1;
    for(let hour = startHour; hour <= 22; hour++){
        for (let minute of [
            0,
            30
        ]){
            if (hour === 22 && minute === 30) continue;
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({
                value: time,
                label: `Heute um ${time} Uhr`
            });
        }
    }
    return slots.slice(0, 10) // Max 10 slots
    ;
}
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Checkout");
__turbopack_context__.k.register(_c1, "StripeCheckoutForm");
__turbopack_context__.k.register(_c2, "PayPalCheckoutForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/checkout";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/simonetti-hybrid/pages/checkout.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__96c0fd05._.js.map