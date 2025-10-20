module.exports = {

"[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button),
    "buttonVariants": (()=>buttonVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "glass-effect text-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "glass-effect text-foreground",
            secondary: "glass-effect text-foreground",
            ghost: "glass-effect text-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 px-3",
            lg: "h-11 px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 47,
        columnNumber: 7
    }, this);
});
Button.displayName = "Button";
;
}}),
"[project]/src/lib/placeholder-images.json (json)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v(JSON.parse("{\"placeholderImages\":[{\"id\":\"img1\",\"description\":\"Abstract colorful shapes\",\"imageUrl\":\"https://picsum.photos/seed/liquid1/800/600\",\"imageHint\":\"abstract colorful\"},{\"id\":\"img2\",\"description\":\"Woman portrait with flowers\",\"imageUrl\":\"https://picsum.photos/seed/liquid2/600/800\",\"imageHint\":\"woman portrait\"},{\"id\":\"img3\",\"description\":\"Serene landscape with mountains and a lake\",\"imageUrl\":\"https://picsum.photos/seed/liquid3/800/600\",\"imageHint\":\"serene landscape\"},{\"id\":\"img4\",\"description\":\"Close up of a neon sign\",\"imageUrl\":\"https://picsum.photos/seed/liquid4/600/800\",\"imageHint\":\"neon sign\"},{\"id\":\"vid1-thumb\",\"description\":\"Thumbnail for a dynamic motion graphics video\",\"imageUrl\":\"https://picsum.photos/seed/liquid5/800/450\",\"imageHint\":\"motion graphics\"},{\"id\":\"vid2-thumb\",\"description\":\"Thumbnail for a cinematic short film\",\"imageUrl\":\"https://picsum.photos/seed/liquid6/800/450\",\"imageHint\":\"cinematic film\"}]}"));}}),
"[project]/src/lib/placeholder-images.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "placeholderImages": (()=>placeholderImages)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/src/lib/placeholder-images.json (json)");
;
const placeholderImages = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$json__$28$json$29$__["default"].placeholderImages.reduce((acc, img)=>{
    acc[img.id] = img;
    return acc;
}, {});
}}),
"[project]/src/features/portfolio/data/portfolio-data.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "defaultPortfolioItems": (()=>defaultPortfolioItems)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/placeholder-images.ts [app-ssr] (ecmascript)");
;
const defaultPortfolioItems = [
    {
        id: 'vid1',
        type: 'video',
        title: 'Kinetic Motion',
        description: 'An exploration of dynamic typography and fluid motion.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['vid1-thumb'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['vid1-thumb'].imageHint,
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                size: 1080
            },
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
                size: 720
            },
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: true,
        details: `This project was created using a combination of Adobe After Effects and Cinema 4D. The goal was to create a visceral experience through motion. 

**Client:** Fictional Brand Inc.
**Year:** 2023`,
        order: 0
    },
    {
        id: 'img1',
        type: 'image',
        title: 'Chromatic Flow',
        description: 'A study of color interaction in a fluid, abstract form.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img1'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img1'].imageHint,
        sourceUrl: 'https://picsum.photos/seed/liquid1/1600/1200',
        featured: true,
        details: 'Created with a mix of digital painting and procedural generation techniques in Processing.',
        order: 1
    },
    {
        id: 'img2',
        type: 'image',
        title: 'Bloom',
        description: 'A personal project exploring the themes of growth and nature. Photoshoot combined with digital illustration.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img2'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img2'].imageHint,
        sourceUrl: 'https://picsum.photos/seed/liquid2/1200/1600',
        featured: false,
        details: `A personal project exploring the themes of growth and nature. Photoshoot combined with digital illustration.

![A behind the scenes look at the Bloom photoshoot.](https://picsum.photos/seed/bloom-bts/800/600)

The process involved several stages, including a video compilation of the digital layering process.

<video src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4" controls />
`,
        order: 2
    },
    {
        id: 'vid2',
        type: 'video',
        title: 'The Wanderer',
        description: 'A short cinematic piece about solitude and nature.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['vid2-thumb'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['vid2-thumb'].imageHint,
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                size: 1080
            },
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
                size: 720
            },
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 3
    },
    {
        id: 'img3',
        type: 'image',
        title: 'Stillness',
        description: 'Capturing the serene and silent moment of a landscape.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img3'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img3'].imageHint,
        sourceUrl: 'https://picsum.photos/seed/liquid3/1600/1200',
        featured: true,
        order: 4
    },
    {
        id: 'img4',
        type: 'image',
        title: 'Night Glow',
        description: 'The vibrant energy of city lights after dark.',
        thumbnailUrl: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img4'].imageUrl,
        thumbnailHint: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$placeholder$2d$images$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["placeholderImages"]['img4'].imageHint,
        sourceUrl: 'https://picsum.photos/seed/liquid4/1200/1600',
        featured: false,
        order: 5
    },
    {
        id: 'img5',
        type: 'image',
        title: 'Oceanic',
        description: 'The powerful waves of the sea.',
        thumbnailUrl: 'https://picsum.photos/seed/ocean/800/800',
        thumbnailHint: 'ocean waves',
        sourceUrl: 'https://picsum.photos/seed/ocean/1600/1600',
        featured: false,
        order: 6
    },
    {
        id: 'img6',
        type: 'image',
        title: 'Metropolis',
        description: 'A bustling city from above.',
        thumbnailUrl: 'https://picsum.photos/seed/city/800/800',
        thumbnailHint: 'city aerial',
        sourceUrl: 'https://picsum.photos/seed/city/1600/1600',
        featured: false,
        order: 7
    },
    {
        id: 'vid3',
        type: 'video',
        title: 'Forest Path',
        description: 'A peaceful walk through the woods.',
        thumbnailUrl: 'https://picsum.photos/seed/forest/800/800',
        thumbnailHint: 'forest path',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
                size: 720
            },
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 8
    },
    {
        id: 'img7',
        type: 'image',
        title: 'Desert Dunes',
        description: 'The shifting sands of the desert.',
        thumbnailUrl: 'https://picsum.photos/seed/desert/800/800',
        thumbnailHint: 'desert dunes',
        sourceUrl: 'https://picsum.photos/seed/desert/1600/1600',
        featured: false,
        order: 9
    },
    {
        id: 'img8',
        type: 'image',
        title: 'Mountain Peak',
        description: 'The view from the top.',
        thumbnailUrl: 'https://picsum.photos/seed/mountain/800/800',
        thumbnailHint: 'mountain peak',
        sourceUrl: 'https://picsum.photos/seed/mountain/1600/1600',
        featured: false,
        order: 10
    },
    {
        id: 'vid4',
        type: 'video',
        title: 'City Lights',
        description: 'A timelapse of a city at night.',
        thumbnailUrl: 'https://picsum.photos/seed/nightcity/800/800',
        thumbnailHint: 'city timelapse',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 11
    },
    {
        id: 'img9',
        type: 'image',
        title: 'Architectural Lines',
        description: 'A study of modern architectural geometry.',
        thumbnailUrl: 'https://picsum.photos/seed/archi1/800/800',
        thumbnailHint: 'modern architecture',
        sourceUrl: 'https://picsum.photos/seed/archi1/1600/1600',
        featured: false,
        order: 12
    },
    {
        id: 'vid5',
        type: 'video',
        title: 'Cosmic Journey',
        description: 'An animated voyage through space.',
        thumbnailUrl: 'https://picsum.photos/seed/space1/800/800',
        thumbnailHint: 'galaxy stars',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
                size: 720
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: true,
        order: 13
    },
    {
        id: 'img10',
        type: 'image',
        title: 'Street Art',
        description: 'Vibrant graffiti on a city wall.',
        thumbnailUrl: 'https://picsum.photos/seed/graffiti1/800/800',
        thumbnailHint: 'street art',
        sourceUrl: 'https://picsum.photos/seed/graffiti1/1600/1600',
        featured: false,
        order: 14
    },
    {
        id: 'vid6',
        type: 'video',
        title: 'Underwater World',
        description: 'A glimpse into the life of a coral reef.',
        thumbnailUrl: 'https://picsum.photos/seed/reef1/800/800',
        thumbnailHint: 'coral reef',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 15
    },
    {
        id: 'img11',
        type: 'image',
        title: 'Autumn Colors',
        description: 'A forest ablaze with autumn foliage.',
        thumbnailUrl: 'https://picsum.photos/seed/autumn1/800/800',
        thumbnailHint: 'autumn forest',
        sourceUrl: 'https://picsum.photos/seed/autumn1/1600/1600',
        featured: false,
        order: 16
    },
    {
        id: 'vid7',
        type: 'video',
        title: 'Skater Life',
        description: 'The energy and motion of skateboarding.',
        thumbnailUrl: 'https://picsum.photos/seed/skate1/800/800',
        thumbnailHint: 'skateboarding trick',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
                size: 720
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 17
    },
    {
        id: 'img12',
        type: 'image',
        title: 'Minimalist Interior',
        description: 'Clean lines and simple forms in home design.',
        thumbnailUrl: 'https://picsum.photos/seed/interior1/800/800',
        thumbnailHint: 'minimalist room',
        sourceUrl: 'https://picsum.photos/seed/interior1/1600/1600',
        featured: false,
        order: 18
    },
    {
        id: 'vid8',
        type: 'video',
        title: 'Culinary Creation',
        description: 'The art of cooking, from prep to plate.',
        thumbnailUrl: 'https://picsum.photos/seed/cooking1/800/800',
        thumbnailHint: 'chef cooking',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
                size: 576
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 19
    },
    {
        id: 'img13',
        type: 'image',
        title: 'Cyberpunk Cityscape',
        description: 'A futuristic city at night, bathed in neon light.',
        thumbnailUrl: 'https://picsum.photos/seed/cyberpunk1/800/800',
        thumbnailHint: 'cyberpunk city',
        sourceUrl: 'https://picsum.photos/seed/cyberpunk1/1600/1600',
        featured: true,
        order: 20
    },
    {
        id: 'vid9',
        type: 'video',
        title: 'Wildlife Documentary',
        description: 'A short feature on animals in their natural habitat.',
        thumbnailUrl: 'https://picsum.photos/seed/wildlife1/800/800',
        thumbnailHint: 'wildlife animal',
        sources: [
            {
                src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                size: 1080
            }
        ],
        previewThumbnailsSrc: 'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        featured: false,
        order: 21
    }
];
}}),
"[project]/src/features/portfolio/components/H5Player.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$h5player$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/h5player/dist/index.js [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'h5player/dist/index.min.css'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
'use client';
;
;
;
;
const H5PlayerComponent = ({ source })=>{
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const playerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // This effect runs only on the client side
        if (containerRef.current) {
            // Initialize the player
            playerRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$h5player$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["H5Player"]({
                container: containerRef.current,
                source: source,
                muted: true,
                autoplay: true,
                loop: true,
                controls: false,
                ratio: '16:9'
            });
        }
        // Cleanup function to destroy the player instance
        return ()=>{
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [
        source
    ]); // Re-run the effect if the source changes
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "w-full h-full"
    }, void 0, false, {
        fileName: "[project]/src/features/portfolio/components/H5Player.tsx",
        lineNumber: 40,
        columnNumber: 10
    }, this);
};
const __TURBOPACK__default__export__ = H5PlayerComponent;
}}),
"[project]/src/features/portfolio/components/HomePage.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>HomePage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fortawesome$2f$react$2d$fontawesome$2f$index$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fortawesome/react-fontawesome/index.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fortawesome$2f$free$2d$solid$2d$svg$2d$icons$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fortawesome/free-solid-svg-icons/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$portfolio$2f$data$2f$portfolio$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/portfolio/data/portfolio-data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$portfolio$2f$components$2f$H5Player$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/portfolio/components/H5Player.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function HomePage() {
    const featuredVideo = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$portfolio$2f$data$2f$portfolio$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultPortfolioItems"].find((item)=>item.type === 'video' && item.featured);
    // Use the highest quality source for the homepage video
    const videoSrc = featuredVideo?.sources?.find((s)=>s.size === 1080)?.src || featuredVideo?.sources?.[0]?.src || 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full w-full flex flex-col items-center justify-center gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-1/2 relative rounded-lg overflow-hidden glass-effect border border-border/50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$portfolio$2f$components$2f$H5Player$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    source: videoSrc
                }, void 0, false, {
                    fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                asChild: true,
                size: "lg",
                className: "group",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: "/work",
                    children: [
                        "Explore Work",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fortawesome$2f$react$2d$fontawesome$2f$index$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FontAwesomeIcon"], {
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fortawesome$2f$free$2d$solid$2d$svg$2d$icons$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faArrowRight"],
                            className: "ml-2 transition-transform group-hover:translate-x-1"
                        }, void 0, false, {
                            fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/portfolio/components/HomePage.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}}),
"[project]/node_modules/@radix-ui/react-slot/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// packages/react/compose-refs/src/compose-refs.tsx
__turbopack_context__.s({
    "composeRefs": (()=>composeRefs),
    "useComposedRefs": (()=>useComposedRefs)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
function setRef(ref, value) {
    if (typeof ref === "function") {
        return ref(value);
    } else if (ref !== null && ref !== void 0) {
        ref.current = value;
    }
}
function composeRefs(...refs) {
    return (node)=>{
        let hasCleanup = false;
        const cleanups = refs.map((ref)=>{
            const cleanup = setRef(ref, node);
            if (!hasCleanup && typeof cleanup == "function") {
                hasCleanup = true;
            }
            return cleanup;
        });
        if (hasCleanup) {
            return ()=>{
                for(let i = 0; i < cleanups.length; i++){
                    const cleanup = cleanups[i];
                    if (typeof cleanup == "function") {
                        cleanup();
                    } else {
                        setRef(refs[i], null);
                    }
                }
            };
        }
    };
}
function useComposedRefs(...refs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(composeRefs(...refs), refs);
}
;
 //# sourceMappingURL=index.mjs.map
}}),
"[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/slot.tsx
__turbopack_context__.s({
    "Root": (()=>Slot),
    "Slot": (()=>Slot),
    "Slottable": (()=>Slottable),
    "createSlot": (()=>createSlot),
    "createSlottable": (()=>createSlottable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)");
;
;
;
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
    const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
    const Slot2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, forwardedRef)=>{
        const { children, ...slotProps } = props;
        const childrenArray = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Children"].toArray(children);
        const slottable = childrenArray.find(isSlottable);
        if (slottable) {
            const newElement = slottable.props.children;
            const newChildren = childrenArray.map((child)=>{
                if (child === slottable) {
                    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Children"].count(newElement) > 1) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Children"].only(null);
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(newElement) ? newElement.props.children : null;
                } else {
                    return child;
                }
            });
            return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsx"])(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(newElement) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(newElement, void 0, newChildren) : null
            });
        }
        return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsx"])(SlotClone, {
            ...slotProps,
            ref: forwardedRef,
            children
        });
    });
    Slot2.displayName = `${ownerName}.Slot`;
    return Slot2;
}
var Slot = /* @__PURE__ */ createSlot("Slot");
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
    const SlotClone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, forwardedRef)=>{
        const { children, ...slotProps } = props;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(children)) {
            const childrenRef = getElementRef(children);
            const props2 = mergeProps(slotProps, children.props);
            if (children.type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"]) {
                props2.ref = forwardedRef ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["composeRefs"])(forwardedRef, childrenRef) : childrenRef;
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(children, props2);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Children"].count(children) > 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Children"].only(null) : null;
    });
    SlotClone.displayName = `${ownerName}.SlotClone`;
    return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
// @__NO_SIDE_EFFECTS__
function createSlottable(ownerName) {
    const Slottable2 = ({ children })=>{
        return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children
        });
    };
    Slottable2.displayName = `${ownerName}.Slottable`;
    Slottable2.__radixId = SLOTTABLE_IDENTIFIER;
    return Slottable2;
}
var Slottable = /* @__PURE__ */ createSlottable("Slottable");
function isSlottable(child) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
    const overrideProps = {
        ...childProps
    };
    for(const propName in childProps){
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
            if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args)=>{
                    const result = childPropValue(...args);
                    slotPropValue(...args);
                    return result;
                };
            } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
            }
        } else if (propName === "style") {
            overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
            };
        } else if (propName === "className") {
            overrideProps[propName] = [
                slotPropValue,
                childPropValue
            ].filter(Boolean).join(" ");
        }
    }
    return {
        ...slotProps,
        ...overrideProps
    };
}
function getElementRef(element) {
    let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
    let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    if (mayWarn) {
        return element.ref;
    }
    getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
    mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    if (mayWarn) {
        return element.props.ref;
    }
    return element.props.ref || element.ref;
}
;
 //# sourceMappingURL=index.mjs.map
}}),
"[project]/node_modules/h5player/dist/index.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
(function(global, factory) {
    ("TURBOPACK compile-time truthy", 1) ? module.exports = factory() : ("TURBOPACK unreachable", undefined);
})(this, function() {
    'use strict';
    function _extends() {
        _extends = Object.assign || function(target) {
            for(var i = 1; i < arguments.length; i++){
                var source = arguments[i];
                for(var key in source){
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        return _extends.apply(this, arguments);
    }
    function _inheritsLoose(subClass, superClass) {
        subClass.prototype = Object.create(superClass.prototype);
        subClass.prototype.constructor = subClass;
        subClass.__proto__ = superClass;
    }
    function _assertThisInitialized(self) {
        if (self === void 0) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return self;
    }
    var RE_LYRIC = /^\[([\d:.]+)\]\s*(.*)$/;
    function getTime(str) {
        var time = 0;
        str.split(':').forEach(function(part) {
            time = time * 60 + +part;
        });
        return time;
    }
    var LyricParser = /*#__PURE__*/ function() {
        function LyricParser() {
            this.reset();
        }
        var _proto = LyricParser.prototype;
        _proto.reset = function reset() {
            this.data = [];
            this.index = 0;
        };
        _proto.setLyric = function setLyric(lyric) {
            this.reset();
            var data = this.data;
            (lyric || '').split('\n').forEach(function(line) {
                var matches = line.match(RE_LYRIC);
                if (matches) data.push([
                    getTime(matches[1]),
                    matches[2]
                ]);
            });
        };
        _proto.getLyricByTime = function getLyricByTime(time) {
            var data = this.data;
            var index = this.index;
            var last = data[index] || data[index = 0];
            if (last) {
                var step = last[0] > time ? -1 : 1;
                while(true){
                    // eslint-disable-line no-constant-condition
                    var item = data[index];
                    var next = data[index + 1];
                    if ((!item || item[0] <= time) && (!next || next[0] > time)) break;
                    index += step;
                }
            }
            var current = data[this.index = index];
            return current ? current[1] : '';
        };
        return LyricParser;
    }();
    var EventEmitter = /*#__PURE__*/ function() {
        function EventEmitter() {
            Object.defineProperty(this, "map", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: {}
            });
        }
        var _proto = EventEmitter.prototype;
        _proto.on = function on(type, handle) {
            var _this = this;
            var handlers = this.map[type];
            if (!handlers) {
                handlers = [];
                this.map[type] = handlers;
            }
            handlers.push(handle);
            return function() {
                return _this.off(type, handle);
            };
        };
        _proto.off = function off(type, handle) {
            var handlers = this.map[type];
            if (handlers) {
                var i = handlers.indexOf(handle);
                if (i >= 0) handlers.splice(i, 1);
            }
        };
        _proto.once = function once(type, handle) {
            var revoke = this.on(type, handleOnce);
            return revoke;
            "TURBOPACK unreachable";
            function handleOnce() {
                handle.apply(void 0, arguments);
                revoke();
            }
        };
        _proto.emit = function emit(type) {
            for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                args[_key - 1] = arguments[_key];
            }
            var handlers = this.map[type];
            if (handlers) {
                handlers.forEach(function(handle) {
                    handle.apply(void 0, args);
                });
            }
        };
        return EventEmitter;
    }();
    function prevent(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    function createElement(tagName, props, children) {
        var el = document.createElement(tagName);
        if (props) {
            Object.keys(props).forEach(function(key) {
                var value = props[key];
                if (key === 'on') {
                    bindEvents(el, value);
                } else {
                    el[key] = value;
                }
            });
        }
        if (children) {
            children.forEach(function(child) {
                el.appendChild(child);
            });
        }
        return el;
    }
    function bindEvents(el, events) {
        if (events) {
            Object.keys(events).forEach(function(type) {
                var handle = events[type];
                if (handle) el.addEventListener(type, handle);
            });
        }
        return el;
    }
    function empty(el) {
        el.innerHTML = '';
        return el;
    }
    var NS_SVG = 'http://www.w3.org/2000/svg';
    var NS_XLINK = 'http://www.w3.org/1999/xlink';
    function createSVGElement(tagName, children) {
        var el = document.createElementNS(NS_SVG, tagName);
        if (children) {
            children.forEach(function(child) {
                el.appendChild(child);
            });
        }
        return el;
    }
    function createSVGIcon(name) {
        var use = createSVGElement('use');
        use.setAttributeNS(NS_XLINK, 'href', "#" + name);
        return createSVGElement('svg', [
            use
        ]);
    }
    var Progress = /*#__PURE__*/ function(_EventEmitter) {
        _inheritsLoose(Progress, _EventEmitter);
        function Progress() {
            var _this;
            _this = _EventEmitter.call(this) || this;
            Object.defineProperty(_assertThisInitialized(_this), "handleCursor", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    _this.cursorData = {
                        delta: e.clientX - _this.els.played.offsetWidth
                    };
                    document.addEventListener('mousemove', _this.handleCursorMove, false);
                    document.addEventListener('mouseup', _this.handleCursorEnd, false);
                }
            });
            Object.defineProperty(_assertThisInitialized(_this), "handleCursorMove", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    _this.cursorData.moved = true;
                    _this.setCursorPos(_this.getPos(e));
                }
            });
            Object.defineProperty(_assertThisInitialized(_this), "handleCursorChange", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    var x;
                    if ('offsetX' in e) {
                        x = e.offsetX;
                    } else {
                        var rect = e.target.getBoundingClientRect();
                        var docEl = document.documentElement;
                        var win = window;
                        x = e.pageX - (rect.left + win.pageXOffset - docEl.clientLeft);
                    }
                    var pos = x / _this.els.bar.offsetWidth;
                    _this.setCursorPos(pos);
                    _this.emit('cursor', pos);
                }
            });
            Object.defineProperty(_assertThisInitialized(_this), "handleCursorEnd", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    document.removeEventListener('mousemove', _this.handleCursorMove, false);
                    document.removeEventListener('mouseup', _this.handleCursorEnd, false);
                    var pos = _this.getPos(e);
                    _this.cursorData = null;
                    _this.setCursorPos(pos);
                    _this.emit('cursor', pos);
                }
            });
            _this.build();
            return _this;
        }
        var _proto = Progress.prototype;
        _proto.build = function build() {
            var played = createElement('div', {
                className: 'h5p-played'
            });
            var bar = createElement('div', {
                className: 'h5p-bar'
            }, [
                played
            ]);
            var cursor = createElement('div', {
                className: 'h5p-cursor',
                on: {
                    mousedown: this.handleCursor,
                    click: prevent
                }
            });
            var time = createElement('div', {
                className: 'h5p-time'
            });
            var el = createElement('div', {
                className: 'h5p-progress',
                on: {
                    click: this.handleCursorChange
                }
            }, [
                bar,
                cursor,
                time
            ]);
            this.el = el;
            this.els = {
                bar: bar,
                played: played,
                cursor: cursor,
                time: time
            };
        };
        _proto.setCursor = function setCursor(currentTime, duration) {
            if (!this.cursorData) this.setCursorPos(duration ? currentTime / duration : null);
            this.els.time.textContent = formatTime(currentTime) + " / " + formatTime(duration);
        };
        _proto.setCursorPos = function setCursorPos(pos) {
            var _els = this.els, played = _els.played, cursor = _els.cursor;
            var past = (pos || 0) * 100 + "%";
            played.style.width = past;
            cursor.style.left = past;
        };
        _proto.getPos = function getPos(e) {
            var pos = (e.clientX - this.cursorData.delta) / this.els.bar.offsetWidth;
            return Math.max(0, Math.min(1, pos));
        };
        return Progress;
    }(EventEmitter);
    function formatTime(time) {
        var minutes = time / 60 | 0;
        var seconds = time % 60 | 0;
        return leftpadNumber(minutes, 2) + ":" + leftpadNumber(seconds, 2);
    }
    function leftpadNumber(num, len) {
        var pad = Number.isNaN(num) ? '?' : '0';
        var str;
        for(str = "" + num; str.length < len; str = "" + pad + str){}
        return str;
    }
    var svgSprite = "<svg xmlns=\"http://www.w3.org/2000/svg\">\n<symbol id=\"h5p-backward\" viewBox=\"0 0 1024 1024\"><path d=\"M778.857 80.571q10.857-10.857 18.286-7.428t7.428 18.286V932.57q0 14.858-7.428 18.286t-18.286-7.428L373.143 537.714q-5.143-5.143-7.429-10.857v387.429q0 14.857-10.857 25.714t-25.714 10.857H256q-14.857 0-25.714-10.857t-10.857-25.714V109.714q0-14.857 10.857-25.714T256 73.143h73.143Q344 73.143 354.857 84t10.857 25.714v387.429q2.286-6.286 7.429-10.857z\"/></symbol>\n<symbol id=\"h5p-forward\" viewBox=\"0 0 1024 1024\"><path d=\"M245.143 943.429q-10.857 10.857-18.286 7.428t-7.428-18.286V91.43q0-14.858 7.428-18.286t18.286 7.428l405.714 405.715q4.572 4.571 7.429 10.857v-387.43q0-14.857 10.857-25.714t25.714-10.857H768q14.857 0 25.714 10.857t10.857 25.714v804.572q0 14.857-10.857 25.714T768 950.857h-73.143q-14.857 0-25.714-10.857t-10.857-25.714V526.857q-2.857 5.714-7.429 10.857z\"/></symbol>\n<symbol id=\"h5p-list\" viewBox=\"0 0 1024 1024\"><path d=\"M219.429 804.571q0 45.715-32 77.715t-77.715 32-77.714-32T0 804.57t32-77.714 77.714-32 77.715 32 32 77.714zm0-292.571q0 45.714-32 77.714t-77.715 32-77.714-32T0 512t32-77.714 77.714-32 77.715 32 32 77.714zM1024 749.714V859.43q0 7.428-5.429 12.857t-12.857 5.428H310.857q-7.428 0-12.857-5.428t-5.429-12.857V749.714q0-7.428 5.429-12.857t12.857-5.428h694.857q7.429 0 12.857 5.428t5.429 12.857zM219.429 219.43q0 45.714-32 77.714t-77.715 32-77.714-32T0 219.43t32-77.715 77.714-32 77.715 32 32 77.715zM1024 457.143v109.714q0 7.429-5.429 12.857t-12.857 5.429H310.857q-7.428 0-12.857-5.429t-5.429-12.857V457.143q0-7.429 5.429-12.857t12.857-5.429h694.857q7.429 0 12.857 5.429t5.429 12.857zm0-292.572v109.715q0 7.428-5.429 12.857t-12.857 5.428H310.857q-7.428 0-12.857-5.428t-5.429-12.857V164.57q0-7.428 5.429-12.857t12.857-5.428h694.857q7.429 0 12.857 5.428T1024 164.57z\"/></symbol>\n<symbol id=\"h5p-pause\" viewBox=\"0 0 1024 1024\"><path d=\"M950.857 109.714v804.572q0 14.857-10.857 25.714t-25.714 10.857H621.714q-14.857 0-25.714-10.857t-10.857-25.714V109.714Q585.143 94.857 596 84t25.714-10.857h292.572Q929.143 73.143 940 84t10.857 25.714zm-512 0v804.572q0 14.857-10.857 25.714t-25.714 10.857H109.714Q94.857 950.857 84 940t-10.857-25.714V109.714Q73.143 94.857 84 84t25.714-10.857h292.572Q417.143 73.143 428 84t10.857 25.714z\"/></symbol>\n<symbol id=\"h5p-play\" viewBox=\"0 0 1024 1024\"><path d=\"M900.571 529.714L141.714 951.43q-13.143 7.428-22.571 1.714t-9.429-20.572V91.43q0-14.858 9.429-20.572t22.571 1.714l758.857 421.715q13.143 7.428 13.143 17.714t-13.143 17.714z\"/></symbol>\n<symbol id=\"h5p-repeat-off\" viewBox=\"0 0 1024 1024\"><path d=\"M85.333 224.853l54.614-54.186 713.386 713.386-54.186 54.614-128-128h-372.48v128L128 768l170.667-170.667v128h287.146L298.667 438.187v31.146h-85.334v-116.48l-128-128m640 329.814h85.334v178.346l-85.334-85.333v-93.013m0-341.334v-128L896 256 725.333 426.667v-128H376.32l-85.333-85.334h434.346z\"/></symbol>\n<symbol id=\"h5p-repeat-one\" viewBox=\"0 0 1024 1024\"><path d=\"M554.667 640V384H512l-85.333 42.667v42.666h64V640m234.666 85.333H298.667v-128L128 768l170.667 170.667v-128h512v-256h-85.334m-426.666-256h426.666v128L896 256 725.333 85.333v128h-512v256h85.334V298.667z\"/></symbol>\n<symbol id=\"h5p-repeat\" viewBox=\"0 0 1024 1024\"><path d=\"M725.333 725.333H298.667v-128L128 768l170.667 170.667v-128h512v-256h-85.334m-426.666-256h426.666v128L896 256 725.333 85.333v128h-512v256h85.334V298.667z\"/></symbol>\n</svg>";
    function initialize() {
        var _document = document, body = _document.body;
        if (!body) {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }
        var sprite = createElement('div', {
            innerHTML: svgSprite
        });
        sprite.style.display = 'none';
        body.insertBefore(sprite, body.firstChild);
    }
    initialize();
    var H5P_ACTIVE = 'h5p-active';
    var MODES = [
        'repeatAll',
        'repeatOne',
        'repeatOff'
    ];
    var MODE_ICONS = {
        repeatAll: 'h5p-repeat',
        repeatOne: 'h5p-repeat-one',
        repeatOff: 'h5p-repeat-off'
    }; // manage all the players to ensure only one is playing at once
    var players = [];
    var currentPlayer = null;
    function setCurrentPlayer(player) {
        currentPlayer = player;
        players.forEach(function(other) {
            if (player !== other) other.audio.pause();
        });
    }
    function fireEvent(detail) {
        var event = new CustomEvent('PlayerEvent', {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    var Player = /*#__PURE__*/ function() {
        function Player(options) {
            var _this = this;
            Object.defineProperty(this, "handleSwitchMode", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    var index = MODES.indexOf(_this.mode);
                    _this.setMode(MODES[(index + 1) % MODES.length]);
                }
            });
            Object.defineProperty(this, "handleToggleList", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    _this.setPlaylist(!_this.els.buttons.list.classList.contains(H5P_ACTIVE));
                }
            });
            Object.defineProperty(this, "handleTogglePlay", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    if (_this.current < 0) _this.play(0);
                    else if (_this.audio.paused) _this.audio.play();
                    else _this.audio.pause();
                }
            });
            Object.defineProperty(this, "handlePlayPrev", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    _this.play(_this.prev());
                }
            });
            Object.defineProperty(this, "handlePlayNext", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    _this.play(_this.next());
                }
            });
            Object.defineProperty(this, "handlePlayAnother", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value() {
                    var mode = _this.mode;
                    if (mode === 'repeatAll') {
                        _this.handlePlayNext();
                    } else if (mode === 'repeatOne') {
                        _this.play();
                    } else {
                        var next = _this.next();
                        if (next) _this.play(next);
                    }
                }
            });
            Object.defineProperty(this, "handleUpdateTime", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    var target = e.target;
                    var currentTime = target.currentTime;
                    _this.duration = target.duration || _this.duration;
                    _this.progress.setCursor(currentTime, _this.duration);
                    _this.els.lyric.textContent = _this.lyricParser.getLyricByTime(currentTime);
                }
            });
            Object.defineProperty(this, "handleStatusChange", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    var type = e.type;
                    var isPlaying = type === 'play';
                    if (isPlaying) {
                        setCurrentPlayer(_this);
                        fireEvent({
                            type: type,
                            player: _this
                        });
                    } else if (currentPlayer === _this) {
                        currentPlayer = null;
                        fireEvent({
                            type: type,
                            player: _this
                        });
                    }
                    var play = _this.els.buttons.play;
                    play.firstChild.replaceWith(createSVGIcon(isPlaying ? 'h5p-pause' : 'h5p-play'));
                    _this.els.image.classList.toggle('h5p-roll', isPlaying);
                }
            });
            Object.defineProperty(this, "handlePlayItem", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(e) {
                    prevent(e);
                    var childNodes = _this.els.playlist.childNodes;
                    for(var i = 0; i < childNodes.length; i += 1){
                        var child = childNodes[i];
                        if (child === e.target) {
                            _this.play(i);
                            break;
                        }
                    }
                }
            });
            Object.defineProperty(this, "handleCursorChange", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function value(pos) {
                    var currentTime = _this.duration * pos | 0;
                    _this.audio.currentTime = currentTime;
                    _this.play();
                }
            });
            players.push(this);
            this.build(options);
            this.setSongs([]);
            this.setTheme(options.theme);
            this.setMode(options.mode);
            this.setPlaylist(options.showPlaylist);
        }
        var _proto = Player.prototype;
        _proto.build = function build(options) {
            this.defaultImage = options.image || '';
            this.callbackGetLyric = options.getLyric;
            this.progress = new Progress();
            var buttons = {};
            var image = createElement('div', {
                className: 'h5p-image'
            });
            var toolbar = createElement('div', {
                className: 'h5p-toolbar'
            }, [
                buttons.repeat = createElement('i', {
                    className: 'h5p-button',
                    on: {
                        click: this.handleSwitchMode
                    }
                }, [
                    createSVGIcon('h5p-repeat')
                ]),
                buttons.list = createElement('i', {
                    className: 'h5p-button',
                    on: {
                        click: this.handleToggleList
                    }
                }, [
                    createSVGIcon('h5p-list')
                ])
            ]);
            var title = createElement('div', {
                className: 'h5p-title'
            });
            var artist = createElement('div', {
                className: 'h5p-artist'
            });
            var info = createElement('div', {
                className: 'h5p-info'
            }, [
                title,
                artist
            ]);
            var control = createElement('div', {
                className: 'h5p-control'
            }, [
                createElement('i', {
                    className: 'h5p-button',
                    on: {
                        click: this.handlePlayPrev
                    }
                }, [
                    createSVGIcon('h5p-backward')
                ]),
                buttons.play = createElement('i', {
                    className: 'h5p-button',
                    on: {
                        click: this.handleTogglePlay
                    }
                }, [
                    createSVGIcon('h5p-play')
                ]),
                createElement('i', {
                    className: 'h5p-button',
                    on: {
                        click: this.handlePlayNext
                    }
                }, [
                    createSVGIcon('h5p-forward')
                ])
            ]);
            var progress = createElement('div', {
                className: 'h5p-progress-wrap'
            }, [
                this.progress.el
            ]);
            var lyric = createElement('div', {
                className: 'h5p-lyric'
            });
            var playlist = createElement('div', {
                className: 'h5p-playlist',
                on: {
                    click: this.handlePlayItem
                }
            });
            var audio = bindEvents(new Audio(), {
                ended: this.handlePlayAnother,
                timeupdate: this.handleUpdateTime,
                play: this.handleStatusChange,
                pause: this.handleStatusChange
            });
            this.progress.on('cursor', this.handleCursorChange);
            this.audio = audio;
            this.el = createElement('div', {
                className: 'h5p'
            }, [
                image,
                toolbar,
                info,
                control,
                progress,
                lyric,
                playlist,
                audio
            ]);
            this.els = {
                image: image,
                buttons: buttons,
                lyric: lyric,
                playlist: playlist,
                title: title,
                artist: artist
            };
            this.lyricParser = new LyricParser();
        };
        _proto.destroy = function destroy() {
            var el = this.el;
            var parent = el.parentNode;
            if (parent) parent.removeChild(el);
        };
        _proto.play = function play(index) {
            if (index == null) index = this.current;
            var song = this.songs[index];
            if (!song) song = this.songs[index = 0];
            if (song) {
                if (this.current !== index) {
                    var childNodes = this.els.playlist.childNodes;
                    var last = childNodes[this.current];
                    if (last) last.classList.remove(H5P_ACTIVE);
                    this.current = index;
                    childNodes[index].classList.add(H5P_ACTIVE);
                    this.audio.src = song.url;
                    this.duration = song.duration ? song.duration / 1000 : null;
                    this.showInfo(song);
                    this.progress.setCursor(0, this.duration);
                }
                this.audio.play();
            }
        };
        _proto.prev = function prev() {
            return (this.current + this.songs.length - 1) % this.songs.length;
        };
        _proto.next = function next() {
            return (this.current + 1) % this.songs.length;
        };
        _proto.setSongs = function setSongs(songs) {
            this.songs = songs;
            var playlist = this.els.playlist;
            empty(playlist);
            songs.forEach(function(_ref) {
                var name = _ref.name;
                playlist.appendChild(createElement('div', {
                    title: name,
                    textContent: name
                }));
            });
            this.current = -1;
            this.audio.src = '';
            this.duration = 0;
            this.showInfo(this.songs[0]);
        };
        _proto.showInfo = function showInfo(song) {
            this.updateInfo(song);
            var _ref2 = song || {}, name = _ref2.name, artist = _ref2.artist;
            var els = this.els;
            els.title.textContent = name || '';
            els.artist.textContent = artist || '';
        };
        _proto.updateInfo = function updateInfo(item) {
            var song = item || this.songs[this.current];
            var _ref3 = song || {}, image = _ref3.image;
            if (typeof image === 'object') image = image[this.theme];
            image = image || this.defaultImage;
            var els = this.els;
            var imageEl = empty(els.image);
            if (image) {
                imageEl.appendChild(createElement('img', {
                    src: image
                }));
            }
            els.lyric.textContent = '';
            if (song) this.loadLyric(song);
        };
        _proto.loadLyric = function loadLyric(song) {
            var _this2 = this;
            var lyricParser = this.lyricParser;
            if (song.lyric == null) {
                lyricParser.setLyric();
                var callbackGetLyric = this.callbackGetLyric;
                if (callbackGetLyric) {
                    callbackGetLyric(_extends({}, song), function(lyric) {
                        if (song === _this2.songs[_this2.current]) {
                            lyricParser.setLyric(song.lyric = lyric || '');
                        }
                    });
                }
            } else {
                lyricParser.setLyric(song.lyric);
            }
        };
        _proto.setTheme = function setTheme(name) {
            var themes = Player.themes;
            var index = themes.indexOf(name);
            if (index < 0) index = 0;
            var oldTheme = this.theme;
            this.theme = themes[index];
            if (oldTheme !== this.theme) {
                var classList = this.el.classList;
                classList.remove("h5p-" + oldTheme);
                classList.add("h5p-" + this.theme);
                this.updateInfo();
            }
        };
        _proto.setMode = function setMode(mode) {
            this.mode = MODES.indexOf(mode) < 0 ? MODES[0] : mode;
            var icon = MODE_ICONS[this.mode];
            this.els.buttons.repeat.firstChild.replaceWith(createSVGIcon(icon));
        };
        _proto.setPlaylist = function setPlaylist(show) {
            var _els = this.els, playlist = _els.playlist, buttons = _els.buttons;
            buttons.list.classList.toggle(H5P_ACTIVE, !!show);
            playlist.style.display = show ? 'block' : '';
        };
        return Player;
    }();
    Object.defineProperty(Player, "themes", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: [
            'normal',
            'simple'
        ]
    });
    return Player;
});
}}),

};

//# sourceMappingURL=_8e9e2f16._.js.map