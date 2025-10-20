module.exports = {

"[externals]/firebase-admin [external] (firebase-admin, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("firebase-admin", () => require("firebase-admin"));

module.exports = mod;
}}),
"[project]/src/firebase/service-account.json (json)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v(JSON.parse("{\"type\":\"service_account\",\"project_id\":\"studio-8316917408-a299a\",\"private_key_id\":\"89355c7694f4c87c01344933d87508316e6d19a0\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmK7sLz5bO4I8d\\n2g2cZ588R3fA5BfXF+lQJmUj5m/E+s3q+zY8b8Q6f3sZ5C8D4y3n9c9E8b7a6d8Z\\nc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\nZc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8Zc8n9d8b7a6d8\\n-u6BxlLjtl0N254Ztd2\\n+R4p9x6wJ0F7s8k5iH2g1e0dC/r3o2n1m0l9k8j7i6h5g4f3e2d1c0bZ\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"firebase-adminsdk-q09y4@studio-8316917408-a299a.iam.gserviceaccount.com\",\"client_id\":\"111818983946252924155\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-q09y4%40studio-8316917408-a299a.iam.gserviceaccount.com\"}"));}}),
"[project]/src/firebase/admin.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"7f80a58fcf1599f623ddc6e39958c4f223df21a40b":"adminDb","7ffe245c2eb153289824dc1bb15dbc19637c52c464":"adminApp"},"",""] */ __turbopack_context__.s({
    "adminApp": (()=>adminApp),
    "adminDb": (()=>adminDb)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$service$2d$account$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/src/firebase/service-account.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
// This function initializes the Firebase Admin SDK.
// It checks if the app is already initialized to prevent errors.
const initializeAdminApp = ()=>{
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["apps"].length > 0) {
        return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["app"])();
    }
    // Cast the imported JSON to the required type
    const credential = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["credential"].cert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$service$2d$account$2e$json__$28$json$29$__["default"]);
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["initializeApp"])({
        credential
    });
};
const adminApp = initializeAdminApp();
const adminDb = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["firestore"])();
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    adminApp,
    adminDb
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminApp, "7ffe245c2eb153289824dc1bb15dbc19637c52c464", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminDb, "7f80a58fcf1599f623ddc6e39958c4f223df21a40b", null);
}}),
"[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"400f9f1c0800cd62b43678ba4836b07f3ca23e757a":"reorderProjects","402c1fb7d0ef5442a3a9cb3a5c1dcedb3f68a96f13":"addProject","409e3ef29d5e160670442c690a0c093bf8fa760e0d":"deleteProject","607f302abd252f2474cb8d002e3af554e90badf1fc":"updateProject"},"",""] */ __turbopack_context__.s({
    "addProject": (()=>addProject),
    "deleteProject": (()=>deleteProject),
    "reorderProjects": (()=>reorderProjects),
    "updateProject": (()=>updateProject)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
// Helper function to get the projects collection
const projectsCollection = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('projects');
async function addProject(projectData) {
    try {
        const docRef = await projectsCollection.add(projectData);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/work');
        return {
            id: docRef.id,
            ...projectData
        };
    } catch (error) {
        console.error('Error adding project:', error);
        throw new Error('Could not add project.');
    }
}
async function updateProject(projectId, updates) {
    try {
        await projectsCollection.doc(projectId).set(updates, {
            merge: true
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/work');
    } catch (error) {
        console.error('Error updating project:', error);
        throw new Error('Could not update project.');
    }
}
async function deleteProject(projectId) {
    try {
        await projectsCollection.doc(projectId).delete();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/work');
    } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Could not delete project.');
    }
}
async function reorderProjects(orderedIds) {
    try {
        const batch = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].batch();
        orderedIds.forEach((id, index)=>{
            const docRef = projectsCollection.doc(id);
            batch.update(docRef, {
                order: index
            });
        });
        await batch.commit();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/work');
    } catch (error) {
        console.error('Error reordering projects:', error);
        throw new Error('Could not reorder projects.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    addProject,
    updateProject,
    deleteProject,
    reorderProjects
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addProject, "402c1fb7d0ef5442a3a9cb3a5c1dcedb3f68a96f13", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateProject, "607f302abd252f2474cb8d002e3af554e90badf1fc", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteProject, "409e3ef29d5e160670442c690a0c093bf8fa760e0d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(reorderProjects, "400f9f1c0800cd62b43678ba4836b07f3ca23e757a", null);
}}),
"[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"40b6e8c695547e9fbf4e6b3920366ca1002081a470":"updateContactInfo"},"",""] */ __turbopack_context__.s({
    "updateContactInfo": (()=>updateContactInfo)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function updateContactInfo(contactData) {
    try {
        const contactDocRef = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('contact').doc('details');
        await contactDocRef.set(contactData, {
            merge: true
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/contact');
    } catch (error) {
        console.error('Error updating contact info:', error);
        throw new Error('Could not update contact information.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateContactInfo
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateContactInfo, "40b6e8c695547e9fbf4e6b3920366ca1002081a470", null);
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/querystring [external] (querystring, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"605737e5cadae95113468f5087e7969dd4c9c48c04":"deleteCloudinaryAsset"},"",""] */ __turbopack_context__.s({
    "deleteCloudinaryAsset": (()=>deleteCloudinaryAsset)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cloudinary/cloudinary.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const isCloudinaryConfigured = ()=>{
    return !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_API_SECRET;
};
const configureCloudinary = ()=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["v2"].config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};
async function deleteCloudinaryAsset(publicId, resourceType = 'image') {
    if (!isCloudinaryConfigured()) {
        throw new Error('Server is not configured for Cloudinary operations.');
    }
    configureCloudinary();
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["v2"].uploader.destroy(publicId, {
            resource_type: resourceType
        });
        if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(result.result || 'Failed to delete asset from Cloudinary.');
        }
        return {
            success: true,
            message: 'Asset deleted successfully from Cloudinary.'
        };
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
        throw new Error(error.message || 'An unexpected error occurred during Cloudinary deletion.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    deleteCloudinaryAsset
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteCloudinaryAsset, "605737e5cadae95113468f5087e7969dd4c9c48c04", null);
}}),
"[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"407e5ed48005f01d5771b227e05e133dbf775058a2":"addMediaAsset","409a2c9b608126d79b8393aea7e8927cd4ea3926f2":"deleteMediaAsset"},"",""] */ __turbopack_context__.s({
    "addMediaAsset": (()=>addMediaAsset),
    "deleteMediaAsset": (()=>deleteMediaAsset)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function addMediaAsset(assetData) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('media').add(assetData);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
    } catch (error) {
        console.error('Error adding media asset:', error);
        throw new Error('Could not save media asset to the library.');
    }
}
async function deleteMediaAsset(mediaId) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('media').doc(mediaId).delete();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
    } catch (error) {
        console.error('Error deleting media asset:', error);
        throw new Error('Could not delete media asset from the library.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    addMediaAsset,
    deleteMediaAsset
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addMediaAsset, "407e5ed48005f01d5771b227e05e133dbf775058a2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteMediaAsset, "409a2c9b608126d79b8393aea7e8927cd4ea3926f2", null);
}}),
"[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"40295103043ac82a9846ab4cd3527df1cf9b1aaf1b":"updateHomepageSettings"},"",""] */ __turbopack_context__.s({
    "updateHomepageSettings": (()=>updateHomepageSettings)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function updateHomepageSettings(settings) {
    try {
        const settingsDocRef = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('homepage').doc('settings');
        await settingsDocRef.set(settings, {
            merge: true
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
    } catch (error) {
        console.error('Error updating homepage settings:', error);
        throw new Error('Could not update homepage settings.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateHomepageSettings
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateHomepageSettings, "40295103043ac82a9846ab4cd3527df1cf9b1aaf1b", null);
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "400f9f1c0800cd62b43678ba4836b07f3ca23e757a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reorderProjects"]),
    "40295103043ac82a9846ab4cd3527df1cf9b1aaf1b": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateHomepageSettings"]),
    "402c1fb7d0ef5442a3a9cb3a5c1dcedb3f68a96f13": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addProject"]),
    "407e5ed48005f01d5771b227e05e133dbf775058a2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addMediaAsset"]),
    "409a2c9b608126d79b8393aea7e8927cd4ea3926f2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteMediaAsset"]),
    "409e3ef29d5e160670442c690a0c093bf8fa760e0d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteProject"]),
    "40b6e8c695547e9fbf4e6b3920366ca1002081a470": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateContactInfo"]),
    "605737e5cadae95113468f5087e7969dd4c9c48c04": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteCloudinaryAsset"]),
    "607f302abd252f2474cb8d002e3af554e90badf1fc": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateProject"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "400f9f1c0800cd62b43678ba4836b07f3ca23e757a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["400f9f1c0800cd62b43678ba4836b07f3ca23e757a"]),
    "40295103043ac82a9846ab4cd3527df1cf9b1aaf1b": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["40295103043ac82a9846ab4cd3527df1cf9b1aaf1b"]),
    "402c1fb7d0ef5442a3a9cb3a5c1dcedb3f68a96f13": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["402c1fb7d0ef5442a3a9cb3a5c1dcedb3f68a96f13"]),
    "407e5ed48005f01d5771b227e05e133dbf775058a2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["407e5ed48005f01d5771b227e05e133dbf775058a2"]),
    "409a2c9b608126d79b8393aea7e8927cd4ea3926f2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["409a2c9b608126d79b8393aea7e8927cd4ea3926f2"]),
    "409e3ef29d5e160670442c690a0c093bf8fa760e0d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["409e3ef29d5e160670442c690a0c093bf8fa760e0d"]),
    "40b6e8c695547e9fbf4e6b3920366ca1002081a470": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["40b6e8c695547e9fbf4e6b3920366ca1002081a470"]),
    "605737e5cadae95113468f5087e7969dd4c9c48c04": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["605737e5cadae95113468f5087e7969dd4c9c48c04"]),
    "607f302abd252f2474cb8d002e3af554e90badf1fc": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["607f302abd252f2474cb8d002e3af554e90badf1fc"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$project$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$contact$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$cloudinary$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$media$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$src$2f$features$2f$admin$2f$actions$2f$homepage$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/admin/actions/project-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/admin/actions/contact-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/features/admin/actions/cloudinary-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/features/admin/actions/media-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/src/features/admin/actions/homepage-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/features/admin/components/AdminPage.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/features/admin/components/AdminPage.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/features/admin/components/AdminPage.tsx <module evaluation>", "default");
}}),
"[project]/src/features/admin/components/AdminPage.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/features/admin/components/AdminPage.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/features/admin/components/AdminPage.tsx", "default");
}}),
"[project]/src/features/admin/components/AdminPage.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$components$2f$AdminPage$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/features/admin/components/AdminPage.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$components$2f$AdminPage$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/features/admin/components/AdminPage.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$components$2f$AdminPage$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/admin/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$components$2f$AdminPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/admin/components/AdminPage.tsx [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$admin$2f$components$2f$AdminPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"];
}}),
"[project]/src/app/admin/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/admin/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__143e9513._.js.map