"use client";

import { useLayoutEffect, useRef } from "react";
import { ReferenceSurface, useReferenceDocument } from "./surface";
import { validatedReferenceScript } from "./validated-script";
import { referenceFetch } from "./transport";

export interface HtmlReference {
  markup: string;
  css: string;
  script: string;
}

function HtmlContent({
  source,
  countries
}: {
  source: HtmlReference;
  countries?: string[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const document = useReferenceDocument();
  useLayoutEffect(() => {
    // Always start reference page from the top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Recreate the original DOM for Strict Mode effect replays and route changes.
    container.current!.innerHTML = source.markup.replaceAll(
      "Preview challenge only. Server-verified protection is required before launch.",
      "Solve the verification challenge to continue."
    );
    const controller = new AbortController();
    const scopedFetch = async (input: string, init?: RequestInit) => {
      controller.signal.throwIfAborted();
      const response = await referenceFetch(input, init);
      controller.signal.throwIfAborted();
      return response;
    };
    const execute = new Function(
      "document",
      "fetch",
      validatedReferenceScript(source.script)
    );
    execute(document, scopedFetch);
    return () => {
      controller.abort();
      container.current
        ?.querySelectorAll("dialog[open]")
        .forEach((dialog) => (dialog as HTMLDialogElement).close());
    };
  }, [document, source.markup, source.script]);
  const countryList = JSON.stringify(countries || []);
  useLayoutEffect(() => {
    const list = JSON.parse(countryList) as string[];
    const select = container.current?.querySelector<HTMLSelectElement>("#country");
    if (select && list.length) {
      const selected = select.value;
      select.replaceChildren(
        new Option("Select country / region", ""),
        ...list.map((country) => new Option(country, country))
      );
      select.value = selected;
    }
  }, [document, countryList]);
  return <div ref={container} />;
}

export function HtmlReferencePage({
  source,
  countries
}: {
  source: HtmlReference;
  countries?: string[];
}) {
  return (
    <ReferenceSurface css={source.css} fonts>
      <HtmlContent source={source} countries={countries} />
    </ReferenceSurface>
  );
}
