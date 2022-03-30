// ==UserScript==
// @name Thanatos
// @description Helps with some aspects of Incremancer
// @match https://incremancer.gti.nz/
// @namespace PurpleMyst
// @author PurpleMyst
// @run-at document-idle
// @version 1.0.0
// ==/UserScript==
"use strict";
const MS_PER_S = 1000;
/**
 * Wait until an element is present in the DOM
 */
const waitForElement = (selector) => new Promise((resolve) => {
    // Check if it's already present
    const firstTry = selector();
    if (firstTry != null) {
        resolve(firstTry);
        return;
    }
    const observer = new MutationObserver(() => {
        const element = selector();
        if (element == null)
            return;
        observer.disconnect();
        resolve(element);
    });
    observer.observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
    });
});
/**
 *  Find an element in a collection by its textContent
 */
const findByText = (elements, text) => Array.from(elements).find((el) => el.textContent === text);
/**
 */
const spellColor = (spellName) => {
    let hash = 0;
    for (let i = 0; i < spellName.length; i++) {
        const chr = spellName.charCodeAt(i);
        hash = ((hash << 5) - hash + chr) | 0;
    }
    const r = (hash & 0xff0000) >> (2 * 8);
    const g = (hash & 0x00ff00) >> (1 * 8);
    const b = (hash & 0x0000ff) >> (0 * 8);
    return `color: rgb(${r}, ${g}, ${b})`;
};
/**
 * Autoclick a spell everytime it's not on cooldown
 */
const autoclickSpell = async (spellName) => {
    const spell = await waitForElement(() => findByText(document.getElementsByTagName("span"), spellName));
    const timer = spell.parentElement?.getElementsByClassName("timer")?.item(0);
    // If there's no timer, the spell isn't on cooldown and we can click it
    if (timer == null) {
        console.info(`[%cThanatos%c / %c${spellName}%c] Cast!`, spellColor("Thanatos"), "", spellColor(spellName), "");
        spell.click();
        // Wait for the timer to appear
        setTimeout(autoclickSpell, 0, spellName);
    }
    else {
        // If we have a timer, its text will represent how long the cooldown is
        const cooldown = +(timer.textContent || 0);
        console.info(`[%cThanatos%c / %c${spellName}%c] Sleeping for ${cooldown}s`, spellColor("Thanatos"), "", spellColor(spellName), "");
        setTimeout(autoclickSpell, cooldown * MS_PER_S, spellName);
    }
};
/**
 * Autobuy an upgrade
 */
const autobuy = (upgrade) => {
    const button = Array.from(upgrade.getElementsByTagName("button")).find((el) => el.textContent === "Auto");
    const name = upgrade.querySelector("h4");
    if (!button)
        return;
    console.info(`[%cThanatos%c] Autobuying %c${name}%c `, spellColor("Thanatos"), "", spellColor(name?.textContent ?? "Unknown Spell"), "");
    button.click();
};
const closeSidebar = async () => {
    const closeButton = await waitForElement(() => findByText(document.getElementsByTagName("button"), "Close"));
    closeButton.click();
};
const openSidebar = async (section) => {
    const sidebarButtons = await waitForElement(() => document.getElementsByClassName("buttons").item(0));
    const sectionButton = await waitForElement(() => findByText(sidebarButtons.getElementsByTagName("button"), section));
    sectionButton.click();
};
/** Check if an upgrade has a limited number of it available */
const isLimited = (upgrade) => upgrade.querySelector("p:last-child")?.textContent?.includes("/");
/** Open the shop, select all tabs and autobuy every upgrade */
const autobuyAll = async () => {
    await openSidebar("Shop");
    const tabs = await waitForElement(() => document.querySelector(".tabs"));
    for (const tab of tabs.children) {
        if (tab.textContent === "Complete" || !(tab instanceof HTMLElement))
            continue;
        tab.click();
        const upgrades = Array.from(document.getElementsByClassName("upgrade"));
        const someLimited = upgrades.some(isLimited);
        console.info(`[%cThanatos%c / %c${tab.textContent}%c] Do we have any limited upgrades? ${someLimited}`, spellColor("Thanatos"), "", spellColor(tab.textContent ?? "Unknown Tab"), "");
        for (const upgrade of upgrades) {
            const limited = isLimited(upgrade);
            /* If there are limited upgrades to buy, prioritize those */
            const shouldBuy = !someLimited || limited;
            if (shouldBuy)
                autobuy(upgrade);
        }
    }
    closeSidebar();
};
const autoConstruct = async () => {
    await openSidebar("Construction");
    const button = await waitForElement(() => findByText(document.querySelectorAll(".tabs button"), "Auto Off"));
    button.click();
    await closeSidebar();
};
const detonateOnEnd = async () => {
    const spell = await waitForElement(() => findByText(document.getElementsByTagName("span"), "Detonate"));
    const humansLabel = await waitForElement(() => document.querySelector(".stats label:nth-child(3)"));
    const observer = new MutationObserver(() => {
        const humansText = humansLabel.textContent?.split(": ")[1];
        if (humansText == null)
            return;
        const humans = +humansText;
        if (humans === 0) {
            spell.click();
        }
    });
    observer.observe(humansLabel, { characterData: true, subtree: true });
};
// Set up autoclicking for important spells
["Time Warp", "Energy Charge", "Earth Freeze", "Gigazombies"].forEach((spellName) => autoclickSpell(spellName));
detonateOnEnd();
autobuyAll()
    .then(() => autoConstruct())
    .then(() => setInterval(autobuyAll, 30000));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhhbmF0b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0aGFuYXRvcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxpQkFBaUI7QUFDakIsaUJBQWlCO0FBQ2pCLHNEQUFzRDtBQUN0RCxxQ0FBcUM7QUFDckMsd0JBQXdCO0FBQ3hCLHFCQUFxQjtBQUNyQix3QkFBd0I7QUFDeEIsaUJBQWlCO0FBQ2pCLGtCQUFrQjtBQUVsQixZQUFZLENBQUM7QUFFYixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFFdEI7O0dBRUc7QUFDSCxNQUFNLGNBQWMsR0FBRyxDQUFJLFFBQW9DLEVBQWMsRUFBRSxDQUM3RSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ3RCLGdDQUFnQztJQUNoQyxNQUFNLFFBQVEsR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUM1QixJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7UUFDcEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xCLE9BQU87S0FDUjtJQUVELE1BQU0sUUFBUSxHQUFHLElBQUksZ0JBQWdCLENBQUMsR0FBRyxFQUFFO1FBQ3pDLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxDQUFDO1FBQzNCLElBQUksT0FBTyxJQUFJLElBQUk7WUFBRSxPQUFPO1FBQzVCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDSCxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtRQUN6QixTQUFTLEVBQUUsSUFBSTtRQUNmLE9BQU8sRUFBRSxJQUFJO1FBQ2IsYUFBYSxFQUFFLElBQUk7UUFDbkIsVUFBVSxFQUFFLElBQUk7S0FDakIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTDs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUFHLENBQ2pCLFFBQXdELEVBQ3hELElBQVksRUFDWixFQUFF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MkNBQTJDO0FBQzNDLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUNuRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUN6QyxDQUFDO0FBRUYsYUFBYSxFQUFFLENBQUM7QUFDaEIsVUFBVSxFQUFFO0tBQ1QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzNCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLEtBQU0sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyA9PVVzZXJTY3JpcHQ9PVxuLy8gQG5hbWUgVGhhbmF0b3Ncbi8vIEBkZXNjcmlwdGlvbiBIZWxwcyB3aXRoIHNvbWUgYXNwZWN0cyBvZiBJbmNyZW1hbmNlclxuLy8gQG1hdGNoIGh0dHBzOi8vaW5jcmVtYW5jZXIuZ3RpLm56L1xuLy8gQG5hbWVzcGFjZSBQdXJwbGVNeXN0XG4vLyBAYXV0aG9yIFB1cnBsZU15c3Rcbi8vIEBydW4tYXQgZG9jdW1lbnQtaWRsZVxuLy8gQHZlcnNpb24gMS4wLjBcbi8vID09L1VzZXJTY3JpcHQ9PVxuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgTVNfUEVSX1MgPSAxMDAwO1xuXG4vKipcbiAqIFdhaXQgdW50aWwgYW4gZWxlbWVudCBpcyBwcmVzZW50IGluIHRoZSBET01cbiAqL1xuY29uc3Qgd2FpdEZvckVsZW1lbnQgPSA8VD4oc2VsZWN0b3I6ICgpID0+IFQgfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbWlzZTxUPiA9PlxuICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIC8vIENoZWNrIGlmIGl0J3MgYWxyZWFkeSBwcmVzZW50XG4gICAgY29uc3QgZmlyc3RUcnkgPSBzZWxlY3RvcigpO1xuICAgIGlmIChmaXJzdFRyeSAhPSBudWxsKSB7XG4gICAgICByZXNvbHZlKGZpcnN0VHJ5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBzZWxlY3RvcigpO1xuICAgICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgcmVzb2x2ZShlbGVtZW50KTtcbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xuXG4vKipcbiAqICBGaW5kIGFuIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIGJ5IGl0cyB0ZXh0Q29udGVudFxuICovXG5jb25zdCBmaW5kQnlUZXh0ID0gKFxuICBlbGVtZW50czogSXRlcmFibGU8SFRNTEVsZW1lbnQ+IHwgQXJyYXlMaWtlPEhUTUxFbGVtZW50PixcbiAgdGV4dDogc3RyaW5nXG4pID0+IEFycmF5LmZyb20oZWxlbWVudHMpLmZpbmQoKGVsKSA9PiBlbC50ZXh0Q29udGVudCA9PT0gdGV4dCk7XG5cbi8qKlxuICovXG5jb25zdCBzcGVsbENvbG9yID0gKHNwZWxsTmFtZTogc3RyaW5nKSA9PiB7XG4gIGxldCBoYXNoID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGVsbE5hbWUubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaHIgPSBzcGVsbE5hbWUuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCArIGNocikgfCAwO1xuICB9XG4gIGNvbnN0IHIgPSAoaGFzaCAmIDB4ZmYwMDAwKSA+PiAoMiAqIDgpO1xuICBjb25zdCBnID0gKGhhc2ggJiAweDAwZmYwMCkgPj4gKDEgKiA4KTtcbiAgY29uc3QgYiA9IChoYXNoICYgMHgwMDAwZmYpID4+ICgwICogOCk7XG4gIHJldHVybiBgY29sb3I6IHJnYigke3J9LCAke2d9LCAke2J9KWA7XG59O1xuXG4vKipcbiAqIEF1dG9jbGljayBhIHNwZWxsIGV2ZXJ5dGltZSBpdCdzIG5vdCBvbiBjb29sZG93blxuICovXG5jb25zdCBhdXRvY2xpY2tTcGVsbCA9IGFzeW5jIChzcGVsbE5hbWU6IHN0cmluZykgPT4ge1xuICBjb25zdCBzcGVsbCA9IGF3YWl0IHdhaXRGb3JFbGVtZW50KCgpID0+XG4gICAgZmluZEJ5VGV4dChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNwYW5cIiksIHNwZWxsTmFtZSlcbiAgKTtcblxuICBjb25zdCB0aW1lciA9IHNwZWxsLnBhcmVudEVsZW1lbnQ/LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ0aW1lclwiKT8uaXRlbSgwKTtcblxuICAvLyBJZiB0aGVyZSdzIG5vIHRpbWVyLCB0aGUgc3BlbGwgaXNuJ3Qgb24gY29vbGRvd24gYW5kIHdlIGNhbiBjbGljayBpdFxuICBpZiAodGltZXIgPT0gbnVsbCkge1xuICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgIGBbJWNUaGFuYXRvcyVjIC8gJWMke3NwZWxsTmFtZX0lY10gQ2FzdCFgLFxuICAgICAgc3BlbGxDb2xvcihcIlRoYW5hdG9zXCIpLFxuICAgICAgXCJcIixcbiAgICAgIHNwZWxsQ29sb3Ioc3BlbGxOYW1lKSxcbiAgICAgIFwiXCJcbiAgICApO1xuICAgIHNwZWxsLmNsaWNrKCk7XG4gICAgLy8gV2FpdCBmb3IgdGhlIHRpbWVyIHRvIGFwcGVhclxuICAgIHNldFRpbWVvdXQoYXV0b2NsaWNrU3BlbGwsIDAsIHNwZWxsTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhIHRpbWVyLCBpdHMgdGV4dCB3aWxsIHJlcHJlc2VudCBob3cgbG9uZyB0aGUgY29vbGRvd24gaXNcbiAgICBjb25zdCBjb29sZG93biA9ICsodGltZXIudGV4dENvbnRlbnQgfHwgMCk7XG4gICAgY29uc29sZS5pbmZvKFxuICAgICAgYFslY1RoYW5hdG9zJWMgLyAlYyR7c3BlbGxOYW1lfSVjXSBTbGVlcGluZyBmb3IgJHtjb29sZG93bn1zYCxcbiAgICAgIHNwZWxsQ29sb3IoXCJUaGFuYXRvc1wiKSxcbiAgICAgIFwiXCIsXG4gICAgICBzcGVsbENvbG9yKHNwZWxsTmFtZSksXG4gICAgICBcIlwiXG4gICAgKTtcbiAgICBzZXRUaW1lb3V0KGF1dG9jbGlja1NwZWxsLCBjb29sZG93biAqIE1TX1BFUl9TLCBzcGVsbE5hbWUpO1xuICB9XG59O1xuXG4vKipcbiAqIEF1dG9idXkgYW4gdXBncmFkZVxuICovXG5jb25zdCBhdXRvYnV5ID0gKHVwZ3JhZGU6IEVsZW1lbnQpID0+IHtcbiAgY29uc3QgYnV0dG9uID0gQXJyYXkuZnJvbSh1cGdyYWRlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpKS5maW5kKFxuICAgIChlbCkgPT4gZWwudGV4dENvbnRlbnQgPT09IFwiQXV0b1wiXG4gICk7XG4gIGNvbnN0IG5hbWUgPSB1cGdyYWRlLnF1ZXJ5U2VsZWN0b3IoXCJoNFwiKTtcbiAgaWYgKCFidXR0b24pIHJldHVybjtcblxuICBjb25zb2xlLmluZm8oXG4gICAgYFslY1RoYW5hdG9zJWNdIEF1dG9idXlpbmcgJWMke25hbWV9JWMgYCxcbiAgICBzcGVsbENvbG9yKFwiVGhhbmF0b3NcIiksXG4gICAgXCJcIixcbiAgICBzcGVsbENvbG9yKG5hbWU/LnRleHRDb250ZW50ID8/IFwiVW5rbm93biBTcGVsbFwiKSxcbiAgICBcIlwiXG4gICk7XG4gIGJ1dHRvbi5jbGljaygpO1xufTtcblxuY29uc3QgY2xvc2VTaWRlYmFyID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCBjbG9zZUJ1dHRvbiA9IGF3YWl0IHdhaXRGb3JFbGVtZW50KCgpID0+XG4gICAgZmluZEJ5VGV4dChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKSwgXCJDbG9zZVwiKVxuICApO1xuICBjbG9zZUJ1dHRvbi5jbGljaygpO1xufTtcblxuY29uc3Qgb3BlblNpZGViYXIgPSBhc3luYyAoc2VjdGlvbjogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHNpZGViYXJCdXR0b25zID0gYXdhaXQgd2FpdEZvckVsZW1lbnQoKCkgPT5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiYnV0dG9uc1wiKS5pdGVtKDApXG4gICk7XG4gIGNvbnN0IHNlY3Rpb25CdXR0b24gPSBhd2FpdCB3YWl0Rm9yRWxlbWVudCgoKSA9PlxuICAgIGZpbmRCeVRleHQoc2lkZWJhckJ1dHRvbnMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIiksIHNlY3Rpb24pXG4gICk7XG4gIHNlY3Rpb25CdXR0b24uY2xpY2soKTtcbn07XG5cbi8qKiBDaGVjayBpZiBhbiB1cGdyYWRlIGhhcyBhIGxpbWl0ZWQgbnVtYmVyIG9mIGl0IGF2YWlsYWJsZSAqL1xuY29uc3QgaXNMaW1pdGVkID0gKHVwZ3JhZGU6IEVsZW1lbnQpID0+XG4gIHVwZ3JhZGUucXVlcnlTZWxlY3RvcihcInA6bGFzdC1jaGlsZFwiKT8udGV4dENvbnRlbnQ/LmluY2x1ZGVzKFwiL1wiKTtcblxuLyoqIE9wZW4gdGhlIHNob3AsIHNlbGVjdCBhbGwgdGFicyBhbmQgYXV0b2J1eSBldmVyeSB1cGdyYWRlICovXG5jb25zdCBhdXRvYnV5QWxsID0gYXN5bmMgKCkgPT4ge1xuICBhd2FpdCBvcGVuU2lkZWJhcihcIlNob3BcIik7XG4gIGNvbnN0IHRhYnMgPSBhd2FpdCB3YWl0Rm9yRWxlbWVudCgoKSA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnRhYnNcIikpO1xuICBmb3IgKGNvbnN0IHRhYiBvZiB0YWJzLmNoaWxkcmVuKSB7XG4gICAgaWYgKHRhYi50ZXh0Q29udGVudCA9PT0gXCJDb21wbGV0ZVwiIHx8ICEodGFiIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKVxuICAgICAgY29udGludWU7XG4gICAgdGFiLmNsaWNrKCk7XG4gICAgY29uc3QgdXBncmFkZXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ1cGdyYWRlXCIpKTtcbiAgICBjb25zdCBzb21lTGltaXRlZCA9IHVwZ3JhZGVzLnNvbWUoaXNMaW1pdGVkKTtcbiAgICBjb25zb2xlLmluZm8oXG4gICAgICBgWyVjVGhhbmF0b3MlYyAvICVjJHt0YWIudGV4dENvbnRlbnR9JWNdIERvIHdlIGhhdmUgYW55IGxpbWl0ZWQgdXBncmFkZXM/ICR7c29tZUxpbWl0ZWR9YCxcbiAgICAgIHNwZWxsQ29sb3IoXCJUaGFuYXRvc1wiKSxcbiAgICAgIFwiXCIsXG4gICAgICBzcGVsbENvbG9yKHRhYi50ZXh0Q29udGVudCA/PyBcIlVua25vd24gVGFiXCIpLFxuICAgICAgXCJcIlxuICAgICk7XG5cbiAgICBmb3IgKGNvbnN0IHVwZ3JhZGUgb2YgdXBncmFkZXMpIHtcbiAgICAgIGNvbnN0IGxpbWl0ZWQgPSBpc0xpbWl0ZWQodXBncmFkZSk7XG4gICAgICAvKiBJZiB0aGVyZSBhcmUgbGltaXRlZCB1cGdyYWRlcyB0byBidXksIHByaW9yaXRpemUgdGhvc2UgKi9cbiAgICAgIGNvbnN0IHNob3VsZEJ1eSA9ICFzb21lTGltaXRlZCB8fCBsaW1pdGVkO1xuICAgICAgaWYgKHNob3VsZEJ1eSkgYXV0b2J1eSh1cGdyYWRlKTtcbiAgICB9XG4gIH1cbiAgY2xvc2VTaWRlYmFyKCk7XG59O1xuXG5jb25zdCBhdXRvQ29uc3RydWN0ID0gYXN5bmMgKCkgPT4ge1xuICBhd2FpdCBvcGVuU2lkZWJhcihcIkNvbnN0cnVjdGlvblwiKTtcbiAgY29uc3QgYnV0dG9uID0gYXdhaXQgd2FpdEZvckVsZW1lbnQoKCkgPT5cbiAgICBmaW5kQnlUZXh0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIudGFicyBidXR0b25cIiksIFwiQXV0byBPZmZcIilcbiAgKTtcbiAgYnV0dG9uLmNsaWNrKCk7XG4gIGF3YWl0IGNsb3NlU2lkZWJhcigpO1xufTtcblxuY29uc3QgZGV0b25hdGVPbkVuZCA9IGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc3BlbGwgPSBhd2FpdCB3YWl0Rm9yRWxlbWVudCgoKSA9PlxuICAgIGZpbmRCeVRleHQoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzcGFuXCIpLCBcIkRldG9uYXRlXCIpXG4gICk7XG4gIGNvbnN0IGh1bWFuc0xhYmVsID0gYXdhaXQgd2FpdEZvckVsZW1lbnQoKCkgPT5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnN0YXRzIGxhYmVsOm50aC1jaGlsZCgzKVwiKVxuICApO1xuICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICBjb25zdCBodW1hbnNUZXh0ID0gaHVtYW5zTGFiZWwudGV4dENvbnRlbnQ/LnNwbGl0KFwiOiBcIilbMV07XG4gICAgaWYgKGh1bWFuc1RleHQgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGNvbnN0IGh1bWFucyA9ICtodW1hbnNUZXh0O1xuICAgIGlmIChodW1hbnMgPT09IDApIHtcbiAgICAgIHNwZWxsLmNsaWNrKCk7XG4gICAgfVxuICB9KTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShodW1hbnNMYWJlbCwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xufTtcblxuLy8gU2V0IHVwIGF1dG9jbGlja2luZyBmb3IgaW1wb3J0YW50IHNwZWxsc1xuW1wiVGltZSBXYXJwXCIsIFwiRW5lcmd5IENoYXJnZVwiLCBcIkVhcnRoIEZyZWV6ZVwiLCBcIkdpZ2F6b21iaWVzXCJdLmZvckVhY2goXG4gIChzcGVsbE5hbWUpID0+IGF1dG9jbGlja1NwZWxsKHNwZWxsTmFtZSlcbik7XG5cbmRldG9uYXRlT25FbmQoKTtcbmF1dG9idXlBbGwoKVxuICAudGhlbigoKSA9PiBhdXRvQ29uc3RydWN0KCkpXG4gIC50aGVuKCgpID0+IHNldEludGVydmFsKGF1dG9idXlBbGwsIDMwXzAwMCkpO1xuIl19