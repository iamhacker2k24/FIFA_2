
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
await OneSignal.init({
appId: "4edcb755-e518-46b8-969e-a6a6c679e7b3",
safari_web_id: "web.onesignal.auto.34e4584e-b851-4129-9188-f0d7c790d3df",
});
const gate = document.getElementById('floating-lock');
const promptView = document.getElementById('ui-prompt');
const blockedView = document.getElementById('ui-blocked');
const btn = document.getElementById('btn-enable');
async function checkAndEnforce() {
const permission = await OneSignal.Notifications.permissionNative;
const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
// HIDE only if granted and opted in
if (permission === 'granted' && isSubscribed) {
gate.classList.remove('active');
setTimeout(() => gate.style.display = 'none', 600);
}
// SHOW if they blocked it
else if (permission === 'denied') {
gate.style.display = 'flex';
setTimeout(() => gate.classList.add('active'), 10);
promptView.style.display = 'none';
blockedView.style.display = 'block';
}
}
checkAndEnforce();
// 10-Second Modern Entrance
setTimeout(async () => {
const permission = await OneSignal.Notifications.permissionNative;
if (permission === 'default') {
gate.style.display = 'flex';
setTimeout(() => gate.classList.add('active'), 10);
}
}, 10000);
btn.addEventListener('click', async () => {
await OneSignal.Notifications.requestPermission();
// After clicking, check if they allowed or if the browser prompt was dismissed
checkAndEnforce();
});
OneSignal.Notifications.addEventListener('permissionChange', checkAndEnforce);
});
