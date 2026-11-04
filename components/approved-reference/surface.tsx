"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { referenceHref } from "./transport";
import { attachPageCopy } from "./page-copy";

const ReferenceDocument = createContext<Document | null>(null);
export function useReferenceDocument() {
  return useContext(ReferenceDocument)!;
}

/** A Shadow DOM preserves the source cascade, including browser defaults,
 * without leaking generic body/header/input styles into the existing app. */
export function ReferenceSurface({
  css,
  children,
  fonts = false
}: {
  css: string;
  children: ReactNode;
  fonts?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<{ root: ShadowRoot; document: Document } | null>(
    null
  );
  useLayoutEffect(() => {
    const root = host.current!.shadowRoot || host.current!.attachShadow({ mode: "open" });
    const scopedDocument = new Proxy(document, {
      get(target, key) {
        if (key === "getElementById") return (id: string) => root.getElementById(id);
        if (key === "querySelector") return root.querySelector.bind(root);
        if (key === "querySelectorAll") return root.querySelectorAll.bind(root);
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
    setSurface({ root, document: scopedDocument });
    const detachPageCopy = attachPageCopy(root);
    const observer = new MutationObserver(() => {
      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
        const href = anchor.getAttribute("href")!;
        const mapped = referenceHref(href);
        if (mapped !== href) anchor.setAttribute("href", mapped);
      });
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"]
    });
    const followFragment = (event: Event) => {
      const anchor = (event.target as Element).closest?.("a[href^='#']");
      if (!anchor) return;
      const href = anchor.getAttribute("href")!;
      const target = href === "#" ? host.current : root.getElementById(href.slice(1));
      if (target) {
        event.preventDefault();
        target.scrollIntoView();
      }
    };
    root.addEventListener("click", followFragment);
    return () => {
      detachPageCopy();
      observer.disconnect();
      root.removeEventListener("click", followFragment);
    };
  }, []);
  return (
    <div ref={host} style={{ display: "block", minHeight: "100vh" }}>
      {surface &&
        createPortal(
          <ReferenceDocument.Provider value={surface.document}>
            <style>{`:host{all:initial;display:block} .reference-body{display:block;min-height:100vh} ${css.replace(/(?<![-\w.])body(?![-\w])/g, ".reference-body").replace(/:root/g, ".reference-body")}
      /* Allow the source's mobile grid columns to shrink to their viewport. */
      @media(max-width:600px){.layout>*{min-width:0}.fields>label{min-width:0}}
      /* The existing site navbar remains constant across all routes. */
      header{display:none}
      `}</style>
            {fonts && (
              <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Caslon+Display&display=swap"
              />
            )}
            <div className="reference-body">{children}</div>
          </ReferenceDocument.Provider>,
          surface.root
        )}
    </div>
  );
}
