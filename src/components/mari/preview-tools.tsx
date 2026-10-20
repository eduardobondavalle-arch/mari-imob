"use client";
import { useEffect } from "react";
export function PreviewTools() {
  useEffect(() => {
    const selectors = [
      [".site-header", "brand"],
      [".hero", "hero"],
      [".featured-section", "featured"],
      [".about-section", "about"],
      [".contact-section", "contact"],
      [".site-footer", "footer"],
    ];
    const cleanup: (() => void)[] = [];
    for (const [selector, group] of selectors) {
      const target = document.querySelector(selector);
      if (!target) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Editar esta região";
      button.className = "edit-region-button";
      button.onclick = () =>
        window.parent.postMessage(
          { type: "mari-edit", group },
          location.origin,
        );
      target.classList.add("editable-region");
      target.appendChild(button);
      cleanup.push(() => {
        button.remove();
        target.classList.remove("editable-region");
      });
    }
    const stopNavigation = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) event.preventDefault();
    };
    document.addEventListener("click", stopNavigation, true);
    return () => {
      cleanup.forEach((fn) => fn());
      document.removeEventListener("click", stopNavigation, true);
    };
  }, []);
  return null;
}
