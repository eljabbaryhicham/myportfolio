(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/video-player.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$mobile$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-mobile.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$plyr$2d$react$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/plyr-react/esm/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const VideoPlayer = ({ source, poster, previewThumbnailsSrc, autoplay, loop, muted, controls = true, onReady })=>{
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isClient, setIsClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const isMobile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$mobile$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsMobile"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VideoPlayer.useEffect": ()=>{
            setIsClient(true);
        }
    }["VideoPlayer.useEffect"], []);
    // Effect to attach the 'ready' event listener
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VideoPlayer.useEffect": ()=>{
            const plyrInstance = ref.current?.plyr;
            if (plyrInstance && onReady) {
                const handleReady = {
                    "VideoPlayer.useEffect.handleReady": ()=>{
                        onReady();
                    }
                }["VideoPlayer.useEffect.handleReady"];
                plyrInstance.on('ready', handleReady);
                // Cleanup function to remove the event listener
                return ({
                    "VideoPlayer.useEffect": ()=>{
                        if (plyrInstance) {
                            plyrInstance.off('ready', handleReady);
                        }
                    }
                })["VideoPlayer.useEffect"];
            }
        }
    }["VideoPlayer.useEffect"], [
        ref,
        onReady,
        isClient
    ]); // Depend on isClient to ensure it runs client-side
    if (!isClient) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "plyr-react plyr"
        }, void 0, false, {
            fileName: "[project]/src/components/video-player.tsx",
            lineNumber: 59,
            columnNumber: 12
        }, this); // Render an empty div on the server
    }
    const useThumbnails = !isMobile && !!previewThumbnailsSrc;
    const options = {
        settings: [
            'quality',
            'speed',
            'loop'
        ],
        quality: {
            default: isMobile ? 576 : 1080,
            options: [
                4320,
                2160,
                1440,
                1080,
                720,
                576,
                480,
                360,
                240
            ]
        },
        previewThumbnails: {
            enabled: useThumbnails,
            src: useThumbnails ? previewThumbnailsSrc : ''
        },
        fullscreen: {
            enabled: true,
            fallback: true,
            iosNative: true
        },
        autoplay: autoplay || false,
        loop: {
            active: loop || false
        },
        muted: muted || false,
        controls: controls ? [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen'
        ] : []
    };
    const fullSource = {
        ...source,
        poster
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$plyr$2d$react$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        ref: ref,
        source: fullSource,
        options: options
    }, void 0, false, {
        fileName: "[project]/src/components/video-player.tsx",
        lineNumber: 101,
        columnNumber: 10
    }, this);
};
_s(VideoPlayer, "3CVcp9eVqS080dppKp622E8BprA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$mobile$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsMobile"]
    ];
});
_c = VideoPlayer;
const __TURBOPACK__default__export__ = VideoPlayer;
var _c;
__turbopack_context__.k.register(_c, "VideoPlayer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/video-player.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/video-player.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=src_components_video-player_tsx_6385fadb._.js.map