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
const waitForElement = <T>(selector: () => T | null | undefined): Promise<T> =>
  new Promise((resolve) => {
    // Check if it's already present
    const firstTry = selector();
    if (firstTry != null) {
      resolve(firstTry);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = selector();
      if (element == null) return;
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
const findByText = (
  elements: Iterable<HTMLElement> | ArrayLike<HTMLElement>,
  text: string
) => Array.from(elements).find((el) => el.textContent === text);

/**
 */
const spellColor = (spellName: string) => {
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
const autoclickSpell = async (spellName: string) => {
  const spell = await waitForElement(() =>
    findByText(document.getElementsByTagName("span"), spellName)
  );

  const timer = spell.parentElement?.getElementsByClassName("timer")?.item(0);

  // If there's no timer, the spell isn't on cooldown and we can click it
  if (timer == null) {
    console.info(
      `[%cThanatos%c / %c${spellName}%c] Cast!`,
      spellColor("Thanatos"),
      "",
      spellColor(spellName),
      ""
    );
    spell.click();
    // Wait for the timer to appear
    setTimeout(autoclickSpell, 0, spellName);
  } else {
    // If we have a timer, its text will represent how long the cooldown is
    const cooldown = +(timer.textContent || 0);
    console.info(
      `[%cThanatos%c / %c${spellName}%c] Sleeping for ${cooldown}s`,
      spellColor("Thanatos"),
      "",
      spellColor(spellName),
      ""
    );
    setTimeout(autoclickSpell, cooldown * MS_PER_S, spellName);
  }
};

/**
 * Autobuy an upgrade
 */
const autobuy = (upgrade: Element) => {
  const button = Array.from(upgrade.getElementsByTagName("button")).find(
    (el) => el.textContent === "Auto"
  );
  if (button) {
    if (upgrade.textContent !== null)
      console.info(
        `[%cThanatos%c] Autobuying %c${upgrade.textContent}%c `,
        spellColor("Thanatos"),
        "",
        spellColor(upgrade.textContent),
        ""
      );
    button.click();
  }
};

const closeSidebar = async () => {
  const closeButton = await waitForElement(() =>
    findByText(document.getElementsByTagName("button"), "Close")
  );
  closeButton.click();
};

const openSidebar = async (section: string) => {
  const sidebarButtons = await waitForElement(() =>
    document.getElementsByClassName("buttons").item(0)
  );
  const sectionButton = await waitForElement(() =>
    findByText(sidebarButtons.getElementsByTagName("button"), section)
  );
  sectionButton.click();
};

/** Open the shop, select all tabs and autobuy every upgrade */
const autobuyAll = async () => {
  await openSidebar("Shop");
  const tabs = await waitForElement(() => document.querySelector(".tabs"));
  for (let tab of tabs.children) {
    if (tab.textContent === "Complete" || !(tab instanceof HTMLElement))
      continue;
    tab.click();
    for (const upgrade of document.getElementsByClassName("upgrade"))
      autobuy(upgrade);
  }
  closeSidebar();
};

const autoConstruct = async () => {
  await openSidebar("Construction");
  const button = await waitForElement(() =>
    findByText(document.querySelectorAll(".tabs button"), "Auto Off")
  );
  button.click();
  await closeSidebar();
};

const detonateOnEnd = async () => {
  const spell = await waitForElement(() =>
    findByText(document.getElementsByTagName("span"), "Detonate")
  );
  const humansLabel = await waitForElement(() =>
    document.querySelector(".stats label:nth-child(3)")
  );
  const observer = new MutationObserver(() => {
    const humansText = humansLabel.textContent?.split(": ")[1];
    if (humansText == null) return;
    const humans = +humansText;
    if (humans === 0) {
      spell.click();
    }
  });
  observer.observe(humansLabel, { characterData: true, subtree: true });
};

// Set up autoclicking for important spells
["Time Warp", "Energy Charge", "Earth Freeze", "Gigazombies"].forEach(
  (spellName) => autoclickSpell(spellName)
);

detonateOnEnd();
autobuyAll()
  .then(() => autoConstruct())
  .then(() => setInterval(autobuyAll, 30_000));
