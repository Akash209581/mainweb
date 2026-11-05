export function sanitizePhone(value: string) {
  return value
    .trimStart()
    .replace(/[^0-9+ ()-]/g, "")
    .replace(/(?!^)\+/g, "");
}
function numericType(el: HTMLInputElement) {
  if (el.type === "tel" || el.name === "phone") return "phone";
  if (
    el.name === "captcha" ||
    el.inputMode === "numeric" ||
    (el.type === "number" && (!el.step || el.step === "1"))
  )
    return "integer";
  return null;
}
export function attachInputValidation(root: Document | ShadowRoot) {
  const target = (event: Event) => event.composedPath()[0];
  const input = (event: Event) => {
    const el = target(event);
    if (!(el instanceof HTMLInputElement)) return;
    if (
      [
        "first",
        "last",
        "name",
        "fullName",
        "firstName",
        "lastName",
        "queryName"
      ].includes(el.name) ||
      el.dataset.author === "name"
    ) {
      el.setCustomValidity(
        el.value.trim() &&
          !/^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}.'\u2019\-]*$/u.test(el.value.trim())
          ? "Use letters, spaces, apostrophes and hyphens in names."
          : ""
      );
      return;
    }
    const kind = numericType(el);
    if (!kind) return;
    const cleaned =
      kind === "phone" ? sanitizePhone(el.value) : el.value.replace(/\D/g, "");
    if (cleaned !== el.value) el.value = cleaned;
    el.setCustomValidity("");
    if (kind === "phone" && el.value) {
      const count = el.value.replace(/\D/g, "").length;
      if (count < 7 || count > 15)
        el.setCustomValidity("Enter 7-15 digits, including the country code.");
    }
  };
  const before = (event: Event) => {
    const el = target(event);
    if (!(el instanceof HTMLInputElement)) return;
    const kind = numericType(el);
    const data = (event as InputEvent).data;
    if (
      kind &&
      data &&
      (kind === "phone" ? /[^0-9+ ()-]/.test(data) : /[^0-9]/.test(data))
    )
      event.preventDefault();
  };
  const key = (event: Event) => {
    const e = event as KeyboardEvent;
    const el = target(e);
    if (
      !(el instanceof HTMLInputElement) ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.key.length !== 1
    )
      return;
    const kind = numericType(el);
    if (kind && (kind === "phone" ? /[^0-9+ ()-]/.test(e.key) : /[^0-9]/.test(e.key)))
      e.preventDefault();
  };
  const submit = (event: Event) => {
    const form = target(event);
    if (!(form instanceof HTMLFormElement)) return;
    form
      .querySelectorAll("input")
      .forEach((el) => input({ composedPath: () => [el] } as unknown as Event));
    const start = form.querySelector<HTMLInputElement>("[name=checkin]"),
      end = form.querySelector<HTMLInputElement>("[name=checkout]");
    if (start && end) {
      end.setCustomValidity("");
      if (start.required && start.value && end.value && end.value <= start.value)
        end.setCustomValidity("Check-out must be after check-in.");
    }
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.reportValidity();
    }
  };
  root.addEventListener("keydown", key, true);
  root.addEventListener("beforeinput", before, true);
  root.addEventListener("input", input, true);
  root.addEventListener("submit", submit, true);
  return () => {
    root.removeEventListener("keydown", key, true);
    root.removeEventListener("beforeinput", before, true);
    root.removeEventListener("input", input, true);
    root.removeEventListener("submit", submit, true);
  };
}
